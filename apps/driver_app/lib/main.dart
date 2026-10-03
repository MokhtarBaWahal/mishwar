import 'dart:async';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:mishwar_shared/mishwar_api.dart';
import 'package:mishwar_shared/mishwar_brand.dart';
import 'package:mishwar_shared/osm_ride_map.dart';

final apiProvider = Provider<MishwarApi>((ref) => MishwarApi());

final healthProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  return ref.watch(apiProvider).health();
});

const _terminalStatuses = <String>{
  'TRIP_COMPLETED',
  'CANCELLED_BY_CUSTOMER',
  'CANCELLED_BY_PASSENGER',
  'CANCELLED_BY_DRIVER',
  'NO_DRIVER_FOUND',
  'NO_DRIVER_AVAILABLE',
};

String _rideStatusLabel(String status) => switch (status) {
      'SEARCHING_DRIVER' => 'طلب مشوار جديد',
      'DRIVER_ASSIGNED' || 'DRIVER_ARRIVING' || 'DRIVER_ON_THE_WAY' => 'توجه إلى موقع العميل',
      'DRIVER_ARRIVED' => 'وصلت إلى موقع العميل',
      'TRIP_STARTED' => 'المشوار جارٍ الآن',
      'TRIP_COMPLETED' => 'اكتمل المشوار',
      'CANCELLED_BY_CUSTOMER' || 'CANCELLED_BY_PASSENGER' => 'ألغى العميل المشوار',
      'CANCELLED_BY_DRIVER' => 'تم إلغاء المشوار',
      'NO_DRIVER_FOUND' || 'NO_DRIVER_AVAILABLE' => 'لم يعد الطلب متاحاً',
      _ => 'حالة المشوار: $status',
    };

String _errorMessage(Object error) {
  if (error is DioException) {
    final data = error.response?.data;
    if (data is Map && data['message'] is String) return data['message'] as String;
    return error.message ?? 'تعذر الاتصال بالخادم';
  }
  return 'تعذر تنفيذ الطلب. حاول مرة أخرى.';
}

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const ProviderScope(child: MishwarDriverApp()));
}

class MishwarDriverApp extends StatelessWidget {
  const MishwarDriverApp({super.key, this.routingEnabled = true});

  final bool routingEnabled;

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'مشوار - تطبيق الكابتن',
      debugShowCheckedModeBanner: false,
      locale: const Locale('ar', 'YE'),
      supportedLocales: const [Locale('ar', 'YE'), Locale('en', 'US')],
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      theme: MishwarBrand.buildTheme(brightness: Brightness.dark),
      home: DriverHomeScreen(routingEnabled: routingEnabled),
    );
  }
}

class DriverHomeScreen extends ConsumerStatefulWidget {
  const DriverHomeScreen({super.key, this.routingEnabled = true});

  final bool routingEnabled;

  @override
  ConsumerState<DriverHomeScreen> createState() => _DriverHomeScreenState();
}

class _DriverHomeScreenState extends ConsumerState<DriverHomeScreen> {
  Timer? _pollTimer;
  StreamSubscription<Position>? _locationSubscription;
  Map<String, dynamic>? _ride;
  Position? _driverPosition;
  bool _online = true;
  bool _busy = false;
  bool _refreshing = false;
  bool _startingLocation = false;
  bool _locationPostInFlight = false;
  bool _locationServerReady = false;
  String? _locationAttemptedRideId;
  DateTime? _lastLocationPostedAt;
  String _locationMessage = 'سيُطلب إذن الموقع بعد قبول المشوار';
  String? _message;

  @override
  void initState() {
    super.initState();
    _refreshRide();
    _pollTimer = Timer.periodic(const Duration(seconds: 5), (_) => _refreshRide());
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    _locationSubscription?.cancel();
    super.dispose();
  }

  Future<void> _refreshRide() async {
    if (!_online || _refreshing || _busy) return;
    _refreshing = true;
    try {
      final ride = await ref.read(apiProvider).incomingRide();
      if (!mounted) return;
      setState(() => _ride = ride);
      final status = ride?['status'] as String?;
      if (ride == null || _terminalStatuses.contains(status)) {
        await _stopLocationTracking();
      } else if (status != 'SEARCHING_DRIVER' &&
          _locationSubscription == null &&
          _locationAttemptedRideId != ride['id']) {
        unawaited(_startLocationTracking(ride['id'] as String));
      }
    } catch (error) {
      if (mounted && _ride == null) setState(() => _message = _errorMessage(error));
    } finally {
      _refreshing = false;
    }
  }

  Future<void> _rideAction(String action) async {
    final ride = _ride;
    if (ride == null) return;
    setState(() {
      _busy = true;
      _message = null;
    });
    try {
      final updated = await ref.read(apiProvider).rideAction(
            ride['id'] as String,
            action,
            driverName: 'كابتن مشوار',
            reason: action == 'cancel' ? 'تم الإلغاء من تطبيق الكابتن' : null,
            actorRole: 'DRIVER',
          );
      if (mounted) setState(() => _ride = updated);
      if (action == 'accept') {
        await _startLocationTracking(updated['id'] as String);
      } else if (_terminalStatuses.contains(updated['status'])) {
        await _stopLocationTracking();
      }
    } catch (error) {
      if (mounted) setState(() => _message = _errorMessage(error));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _startLocationTracking(String rideId, {bool retry = false}) async {
    if (_startingLocation ||
        _locationSubscription != null ||
        (!retry && _locationAttemptedRideId == rideId)) return;
    _locationAttemptedRideId = rideId;
    setState(() {
      _startingLocation = true;
      _locationMessage = 'جارٍ طلب إذن الموقع...';
    });

    try {
      if (!await Geolocator.isLocationServiceEnabled()) {
        throw StateError('فعّل خدمة الموقع على جهازك ثم حاول مجدداً.');
      }

      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
      if (permission == LocationPermission.deniedForever) {
        throw StateError('إذن الموقع محظور. غيّره من إعدادات المتصفح ثم أعد المحاولة.');
      }
      if (permission == LocationPermission.denied) {
        throw StateError('لم يتم منح إذن الموقع. يمكنك المحاولة مرة أخرى.');
      }

      final initialPosition = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
        timeLimit: const Duration(seconds: 12),
      );
      if (!mounted || _ride?['id'] != rideId) return;
      setState(() {
        _driverPosition = initialPosition;
        _locationMessage = 'تم تحديد موقعك، جارٍ مشاركته مع العميل';
      });
      await _publishLocation(rideId, initialPosition);

      _locationSubscription = Geolocator.getPositionStream(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          distanceFilter: 8,
        ),
      ).listen(
        (position) {
          if (!mounted || _ride?['id'] != rideId) return;
          setState(() => _driverPosition = position);
          unawaited(_publishLocation(rideId, position));
        },
        onError: (Object error) {
          _locationSubscription?.cancel();
          _locationSubscription = null;
          if (mounted) {
            setState(() {
              _locationServerReady = false;
              _locationMessage = 'توقف تحديث الموقع: $error';
            });
          }
        },
      );
    } catch (error) {
      if (mounted) setState(() => _locationMessage = _locationErrorMessage(error));
    } finally {
      if (mounted) setState(() => _startingLocation = false);
    }
  }

  String _locationErrorMessage(Object error) {
    final message = error is StateError ? error.message : error.toString();
    return message.replaceFirst('Bad state: ', '');
  }

  Future<void> _publishLocation(String rideId, Position position) async {
    if (_locationPostInFlight) return;
    final now = DateTime.now();
    if (_lastLocationPostedAt != null &&
        now.difference(_lastLocationPostedAt!) < const Duration(seconds: 4)) {
      return;
    }

    _locationPostInFlight = true;
    _lastLocationPostedAt = now;
    try {
      final updated = await ref.read(apiProvider).updateDriverLocation(
            rideId: rideId,
            latitude: position.latitude,
            longitude: position.longitude,
          );
      if (mounted && _ride?['id'] == rideId) {
        setState(() {
          _ride = {
            ..._ride!,
            'driverLocation': updated['driverLocation'],
            'driverLocationUpdatedAt': updated['driverLocationUpdatedAt'],
          };
          _locationServerReady = true;
          _locationMessage = 'موقعك مباشر ويظهر للعميل';
        });
      }
    } catch (error) {
      if (mounted) {
        setState(() {
          _locationServerReady = false;
          _locationMessage = 'تعذر إرسال الموقع: ${_errorMessage(error)}';
        });
      }
    } finally {
      _locationPostInFlight = false;
    }
  }

  Future<void> _stopLocationTracking() async {
    await _locationSubscription?.cancel();
    _locationSubscription = null;
    _lastLocationPostedAt = null;
    _locationAttemptedRideId = null;
    _locationServerReady = false;
    if (mounted && _driverPosition != null) {
      setState(() {
        _driverPosition = null;
        _locationServerReady = false;
        _locationMessage = 'انتهى المشوار وتوقفت مشاركة الموقع';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final health = ref.watch(healthProvider);
    final status = _ride?['status'] as String?;
    final isIncoming = status == 'SEARCHING_DRIVER';
    final isInRide = status != null && !_terminalStatuses.contains(status) && !isIncoming;

    return Scaffold(
      appBar: AppBar(
        title: const Text('كابتن مشوار'),
        actions: [
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(_online ? 'متصل' : 'غير متصل', style: Theme.of(context).textTheme.labelSmall),
              Switch(
                value: _online,
                onChanged: _busy || isInRide
                    ? null
                    : (value) {
                        setState(() {
                          _online = value;
                          if (!value) _ride = null;
                        });
                        if (value) _refreshRide();
                      },
                activeColor: const Color(0xFF10B981),
              ),
            ],
          ),
        ],
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            _HealthCard(health: health),
            const SizedBox(height: 16),
            if (isInRide && _ride != null) ...[
              _LocationStatusCard(
                message: _locationMessage,
                isStarting: _startingLocation,
                isSharing: _locationServerReady,
                accuracy: _driverPosition?.accuracy,
                onRetry: _startingLocation
                    ? null
                    : () {
                        final rideId = _ride!['id'] as String;
                        final position = _driverPosition;
                        if (position == null || _locationSubscription == null) {
                          _startLocationTracking(rideId, retry: true);
                        } else {
                          _publishLocation(rideId, position);
                        }
                      },
              ),
              const SizedBox(height: 12),
            ],
            if (_ride == null)
              const SizedBox(
                height: 230,
                child: MishwarMap(
                  centerLatitude: 15.3694,
                  centerLongitude: 44.1910,
                ),
              ),
            if (_ride == null) const SizedBox(height: 12),
            if (!_online)
              const _InfoCard(
                icon: Icons.pause_circle_outline,
                title: 'أنت غير متصل',
                message: 'فعّل حالة الاتصال لاستقبال طلبات المشاوير.',
              )
            else if (_ride == null)
              const _InfoCard(
                icon: Icons.radar,
                title: 'بانتظار طلب جديد',
                message: 'سيظهر طلب العميل هنا فور إرساله.',
              )
            else
              _rideCard(_ride!, incoming: isIncoming),
            if (_message != null) ...[
              const SizedBox(height: 12),
              _MessageBanner(message: _message!),
            ],
          ],
        ),
      ),
    );
  }

  Widget _rideCard(Map<String, dynamic> ride, {required bool incoming}) {
    final status = ride['status'] as String? ?? '';
    final fare = ride['fare'] is Map ? Map<String, dynamic>.from(ride['fare'] as Map) : <String, dynamic>{};
    final pickup = Map<String, dynamic>.from(ride['pickup'] as Map);
    final destination = Map<String, dynamic>.from(ride['destination'] as Map);
    final nextAction = switch (status) {
      'DRIVER_ASSIGNED' || 'DRIVER_ARRIVING' || 'DRIVER_ON_THE_WAY' => ('arrived', 'وصلت إلى العميل', Icons.place_outlined),
      'DRIVER_ARRIVED' => ('start', 'ابدأ المشوار', Icons.play_arrow),
      'TRIP_STARTED' => ('complete', 'إنهاء المشوار', Icons.flag_outlined),
      _ => (null, '', Icons.check),
    };

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                Icon(incoming ? Icons.notifications_active_outlined : Icons.navigation_outlined, color: const Color(0xFF10B981)),
                const SizedBox(width: 10),
                Expanded(child: Text(_rideStatusLabel(status), style: Theme.of(context).textTheme.titleMedium)),
              ],
            ),
            const SizedBox(height: 14),
            SizedBox(
              height: 230,
              child: MishwarMap(
                centerLatitude: ((pickup['latitude'] as num).toDouble() + (destination['latitude'] as num).toDouble()) / 2,
                centerLongitude: ((pickup['longitude'] as num).toDouble() + (destination['longitude'] as num).toDouble()) / 2,
                pickupLatitude: (pickup['latitude'] as num).toDouble(),
                pickupLongitude: (pickup['longitude'] as num).toDouble(),
                destinationLatitude: (destination['latitude'] as num).toDouble(),
                destinationLongitude: (destination['longitude'] as num).toDouble(),
                driverLatitude: _driverPosition?.latitude ?? (ride['driverLocation']?['latitude'] as num?)?.toDouble(),
                driverLongitude: _driverPosition?.longitude ?? (ride['driverLocation']?['longitude'] as num?)?.toDouble(),
                routingEnabled: widget.routingEnabled,
              ),
            ),
            const SizedBox(height: 16),
            _RideDetail(label: 'العميل', value: ride['customerName']?.toString() ?? 'عميل مشوار'),
            _RideDetail(label: 'الانطلاق', value: ride['pickup']?['addressName']?.toString() ?? ''),
            _RideDetail(label: 'الوجهة', value: ride['destination']?['addressName']?.toString() ?? ''),
            _RideDetail(label: 'المركبة', value: ride['vehicleType']?.toString() ?? ''),
            if (fare['grossFare'] != null) _RideDetail(label: 'الأجرة', value: '${fare['grossFare']} ر.ي'),
            const SizedBox(height: 18),
            if (incoming) ...[
              FilledButton.icon(
                onPressed: _busy ? null : () => _rideAction('accept'),
                icon: _busy
                    ? const SizedBox.square(dimension: 18, child: CircularProgressIndicator(strokeWidth: 2))
                    : const Icon(Icons.check_circle_outline),
                label: const Text('قبول الطلب'),
              ),
              const SizedBox(height: 8),
              OutlinedButton.icon(
                onPressed: _busy ? null : () => _rideAction('decline'),
                icon: const Icon(Icons.close),
                label: const Text('رفض الطلب'),
              ),
            ] else if (nextAction.$1 != null) ...[
              FilledButton.icon(
                onPressed: _busy ? null : () => _rideAction(nextAction.$1!),
                icon: _busy
                    ? const SizedBox.square(dimension: 18, child: CircularProgressIndicator(strokeWidth: 2))
                    : Icon(nextAction.$3),
                label: Text(nextAction.$2),
              ),
              const SizedBox(height: 8),
              TextButton.icon(
                onPressed: _busy ? null : () => _rideAction('cancel'),
                icon: const Icon(Icons.cancel_outlined),
                label: const Text('إلغاء المشوار'),
              ),
            ] else
              const Text('لا يوجد إجراء مطلوب لهذا الطلب.', textAlign: TextAlign.center),
          ],
        ),
      ),
    );
  }
}

class _HealthCard extends StatelessWidget {
  const _HealthCard({required this.health});

  final AsyncValue<Map<String, dynamic>> health;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: health.when(
          loading: () => const Row(children: [CircularProgressIndicator(), SizedBox(width: 12), Text('جاري الاتصال بالخادم...')]),
          error: (error, _) => Text('تعذر الاتصال بالخادم: $error'),
          data: (data) => Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('حالة الخادم', style: TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              Text('${data['service']} - ${data['status']}'),
              Text('API: $mishwarApiBaseUrl', style: Theme.of(context).textTheme.bodySmall),
            ],
          ),
        ),
      ),
    );
  }
}

class _RideDetail extends StatelessWidget {
  const _RideDetail({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 12),
      child: Row(
        children: [
          SizedBox(width: 76, child: Text(label, style: const TextStyle(color: Colors.white60))),
          Expanded(child: Text(value, textAlign: TextAlign.right)),
        ],
      ),
    );
  }
}

class _InfoCard extends StatelessWidget {
  const _InfoCard({required this.icon, required this.title, required this.message});

  final IconData icon;
  final String title;
  final String message;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 28),
        child: Column(
          children: [
            Icon(icon, size: 36, color: const Color(0xFF10B981)),
            const SizedBox(height: 12),
            Text(title, style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 6),
            Text(message, textAlign: TextAlign.center, style: const TextStyle(color: Colors.white70)),
          ],
        ),
      ),
    );
  }
}

class _LocationStatusCard extends StatelessWidget {
  const _LocationStatusCard({
    required this.message,
    required this.isStarting,
    required this.isSharing,
    required this.onRetry,
    this.accuracy,
  });

  final String message;
  final bool isStarting;
  final bool isSharing;
  final double? accuracy;
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context) {
    final color = isSharing ? const Color(0xFF10B981) : const Color(0xFFF59E0B);
    return Card(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        child: Row(
          children: [
            if (isStarting)
              const SizedBox.square(dimension: 22, child: CircularProgressIndicator(strokeWidth: 2))
            else
              Icon(isSharing ? Icons.gps_fixed : Icons.location_searching, color: color),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(isSharing ? 'مشاركة الموقع مباشرة' : 'مشاركة الموقع غير مفعلة',
                      style: const TextStyle(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 3),
                  Text(message, style: Theme.of(context).textTheme.bodySmall),
                ],
              ),
            ),
            if (accuracy != null && isSharing)
              Text('±${accuracy!.round()} م', style: Theme.of(context).textTheme.labelSmall),
            if (!isSharing && !isStarting)
              IconButton(
                tooltip: 'إعادة محاولة تحديد الموقع',
                onPressed: onRetry,
                icon: const Icon(Icons.refresh),
              ),
          ],
        ),
      ),
    );
  }
}

class _MessageBanner extends StatelessWidget {
  const _MessageBanner({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Theme.of(context).colorScheme.errorContainer,
      borderRadius: BorderRadius.circular(8),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Text(message, textDirection: TextDirection.rtl),
      ),
    );
  }
}
