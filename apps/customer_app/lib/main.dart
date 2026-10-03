import 'dart:async';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mishwar_shared/mishwar_api.dart';
import 'package:mishwar_shared/mishwar_brand.dart';
import 'package:mishwar_shared/osm_ride_map.dart';

final apiProvider = Provider<MishwarApi>((ref) => MishwarApi());

final healthProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  return ref.watch(apiProvider).health();
});

const _vehicleOptions = <String, String>{
  'ECONOMY': 'سيارة اقتصادية',
  'MOTORCYCLE': 'دراجة نارية',
  'COMFORT': 'سيارة مريحة',
  'FAMILY': 'سيارة عائلية',
};

const _terminalStatuses = <String>{
  'TRIP_COMPLETED',
  'CANCELLED_BY_CUSTOMER',
  'CANCELLED_BY_PASSENGER',
  'CANCELLED_BY_DRIVER',
  'NO_DRIVER_FOUND',
  'NO_DRIVER_AVAILABLE',
};

String _rideStatusLabel(String status) => switch (status) {
      'SEARCHING_DRIVER' => 'جاري البحث عن كابتن',
      'DRIVER_ASSIGNED' || 'DRIVER_ARRIVING' || 'DRIVER_ON_THE_WAY' => 'الكابتن في الطريق إليك',
      'DRIVER_ARRIVED' => 'وصل الكابتن إلى موقعك',
      'TRIP_STARTED' => 'مشوارك جارٍ الآن',
      'TRIP_COMPLETED' => 'اكتمل المشوار',
      'CANCELLED_BY_CUSTOMER' || 'CANCELLED_BY_PASSENGER' => 'تم إلغاء المشوار',
      'CANCELLED_BY_DRIVER' => 'ألغى الكابتن المشوار',
      'NO_DRIVER_FOUND' || 'NO_DRIVER_AVAILABLE' => 'لم يتم العثور على كابتن',
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

String _locationUpdateLabel(Object? value) {
  if (value is! String) return 'بانتظار موقع الكابتن';
  final updatedAt = DateTime.tryParse(value)?.toLocal();
  if (updatedAt == null) return 'موقع الكابتن غير متاح';
  final elapsed = DateTime.now().difference(updatedAt);
  if (elapsed.inSeconds < 30) return 'موقع الكابتن مباشر';
  if (elapsed.inMinutes < 1) return 'آخر تحديث قبل ${elapsed.inSeconds} ثانية';
  return 'آخر تحديث قبل ${elapsed.inMinutes} دقيقة';
}

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const ProviderScope(child: MishwarCustomerApp()));
}

class MishwarCustomerApp extends StatelessWidget {
  const MishwarCustomerApp({super.key, this.routingEnabled = true});

  final bool routingEnabled;

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'مشوار - تطبيق العميل',
      debugShowCheckedModeBanner: false,
      locale: const Locale('ar', 'YE'),
      supportedLocales: const [Locale('ar', 'YE'), Locale('en', 'US')],
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      theme: MishwarBrand.buildTheme(brightness: Brightness.dark),
      home: CustomerHomeScreen(routingEnabled: routingEnabled),
    );
  }
}

class CustomerHomeScreen extends ConsumerStatefulWidget {
  const CustomerHomeScreen({super.key, this.routingEnabled = true});

  final bool routingEnabled;

  @override
  ConsumerState<CustomerHomeScreen> createState() => _CustomerHomeScreenState();
}

class _CustomerHomeScreenState extends ConsumerState<CustomerHomeScreen> {
  final _pickupController = TextEditingController(text: 'ميدان التحرير');
  final _destinationController = TextEditingController(text: 'شارع حدة');
  double _pickupLatitude = 15.3694;
  double _pickupLongitude = 44.1910;
  double _destinationLatitude = 15.3470;
  double _destinationLongitude = 44.2060;
  String _mapSelection = 'pickup';
  Timer? _pollTimer;
  Map<String, dynamic>? _ride;
  String _vehicleType = 'ECONOMY';
  String _paymentMethod = 'CASH';
  int _passengerCount = 1;
  bool _airConditioningRequired = false;
  bool _busy = false;
  bool _refreshing = false;
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
    _pickupController.dispose();
    _destinationController.dispose();
    super.dispose();
  }

  Future<void> _refreshRide() async {
    if (_refreshing || _busy) return;
    _refreshing = true;
    try {
      final ride = await ref.read(apiProvider).activeRide('CUSTOMER');
      if (mounted) setState(() => _ride = ride);
    } catch (error) {
      if (mounted && _ride == null) setState(() => _message = _errorMessage(error));
    } finally {
      _refreshing = false;
    }
  }

  Future<void> _requestRide() async {
    if (_pickupController.text.trim().isEmpty || _destinationController.text.trim().isEmpty) {
      setState(() => _message = 'أدخل موقع الانطلاق والوجهة أولاً');
      return;
    }
    setState(() {
      _busy = true;
      _message = null;
    });
    try {
      final ride = await ref.read(apiProvider).requestRide(
            pickupName: _pickupController.text.trim(),
            destinationName: _destinationController.text.trim(),
            pickupLatitude: _pickupLatitude,
            pickupLongitude: _pickupLongitude,
            destinationLatitude: _destinationLatitude,
            destinationLongitude: _destinationLongitude,
            vehicleType: _vehicleType,
            passengerCount: _passengerCount,
            airConditioningRequired: _airConditioningRequired,
            paymentMethod: _paymentMethod,
          );
      if (mounted) setState(() => _ride = ride);
    } catch (error) {
      if (mounted) setState(() => _message = _errorMessage(error));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  void _selectMapLocation(double latitude, double longitude) {
    setState(() {
      final coordinates = '${latitude.toStringAsFixed(5)}, ${longitude.toStringAsFixed(5)}';
      if (_mapSelection == 'pickup') {
        _pickupLatitude = latitude;
        _pickupLongitude = longitude;
        _pickupController.text = 'موقع الانطلاق على الخريطة ($coordinates)';
      } else {
        _destinationLatitude = latitude;
        _destinationLongitude = longitude;
        _destinationController.text = 'الوجهة على الخريطة ($coordinates)';
      }
    });
  }

  Future<void> _cancelRide() async {
    final ride = _ride;
    if (ride == null) return;
    setState(() {
      _busy = true;
      _message = null;
    });
    try {
      final updated = await ref.read(apiProvider).rideAction(
            ride['id'] as String,
            'cancel',
            reason: 'تم الإلغاء من تطبيق العميل',
          );
      if (mounted) setState(() => _ride = updated);
    } catch (error) {
      if (mounted) setState(() => _message = _errorMessage(error));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final health = ref.watch(healthProvider);
    final isActiveRide = _ride != null && !_terminalStatuses.contains(_ride!['status']);

    return Scaffold(
      appBar: AppBar(
        title: const Text('مشوار'),
        actions: [
          IconButton(
            tooltip: 'تحديث الحالة',
            onPressed: _refreshRide,
            icon: const Icon(Icons.refresh_rounded),
          ),
        ],
      ),
      body: Container(
        decoration: const BoxDecoration(gradient: MishwarBrand.gradient),
        child: SafeArea(
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              const MishwarBrandHeader(subtitle: 'رحلات ذكية • أسرع • أكثر أماناً'),
              const SizedBox(height: 16),
              _HealthCard(health: health),
              const SizedBox(height: 16),
              if (isActiveRide) _activeRideCard(_ride!) else _bookingCard(),
              if (_message != null) ...[
                const SizedBox(height: 12),
                _MessageBanner(message: _message!),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _bookingCard() {
    final previousStatus = _ride?['status'] as String?;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text('احجز مشوارك', style: Theme.of(context).textTheme.titleLarge),
            if (previousStatus != null) ...[
              const SizedBox(height: 8),
              Text(_rideStatusLabel(previousStatus), style: const TextStyle(color: Colors.white70)),
            ],
            const SizedBox(height: 18),
            TextField(
              controller: _pickupController,
              textDirection: TextDirection.rtl,
              decoration: const InputDecoration(
                labelText: 'موقع الانطلاق',
                prefixIcon: Icon(Icons.trip_origin),
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _destinationController,
              textDirection: TextDirection.rtl,
              decoration: const InputDecoration(
                labelText: 'الوجهة',
                prefixIcon: Icon(Icons.location_on_outlined),
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 16),
            Align(
              alignment: Alignment.centerRight,
              child: Text('اختر نقطة على الخريطة', style: Theme.of(context).textTheme.titleSmall),
            ),
            const SizedBox(height: 8),
            SegmentedButton<String>(
              segments: const [
                ButtonSegment(value: 'pickup', label: Text('الانطلاق'), icon: Icon(Icons.trip_origin)),
                ButtonSegment(value: 'destination', label: Text('الوجهة'), icon: Icon(Icons.location_on_outlined)),
              ],
              selected: {_mapSelection},
              onSelectionChanged: (selection) => setState(() => _mapSelection = selection.first),
            ),
            const SizedBox(height: 10),
            SizedBox(
              height: 230,
              child: MishwarMap(
                centerLatitude: (_pickupLatitude + _destinationLatitude) / 2,
                centerLongitude: (_pickupLongitude + _destinationLongitude) / 2,
                pickupLatitude: _pickupLatitude,
                pickupLongitude: _pickupLongitude,
                destinationLatitude: _destinationLatitude,
                destinationLongitude: _destinationLongitude,
                onMapTap: _selectMapLocation,
                routingEnabled: widget.routingEnabled,
              ),
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              value: _vehicleType,
              decoration: const InputDecoration(labelText: 'نوع المركبة', border: OutlineInputBorder()),
              items: _vehicleOptions.entries
                  .map((entry) => DropdownMenuItem(value: entry.key, child: Text(entry.value)))
                  .toList(),
              onChanged: _busy
                  ? null
                  : (value) => setState(() {
                        _vehicleType = value ?? 'ECONOMY';
                        if (_vehicleType == 'MOTORCYCLE') {
                          _passengerCount = 1;
                          _airConditioningRequired = false;
                        }
                      }),
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<int>(
              value: _passengerCount,
              decoration: const InputDecoration(labelText: 'عدد الركاب', border: OutlineInputBorder()),
              items: List.generate(_vehicleType == 'MOTORCYCLE' ? 1 : 4, (index) => index + 1)
                  .map((count) => DropdownMenuItem(value: count, child: Text('$count')))
                  .toList(),
              onChanged: _busy ? null : (value) => setState(() => _passengerCount = value ?? 1),
            ),
            if (_vehicleType != 'MOTORCYCLE')
              SwitchListTile.adaptive(
                contentPadding: EdgeInsets.zero,
                title: const Text('أحتاج إلى مكيف'),
                value: _airConditioningRequired,
                onChanged: _busy ? null : (value) => setState(() => _airConditioningRequired = value),
              ),
            const SizedBox(height: 4),
            SegmentedButton<String>(
              segments: const [
                ButtonSegment(value: 'CASH', label: Text('نقداً'), icon: Icon(Icons.payments_outlined)),
                ButtonSegment(value: 'WALLET', label: Text('المحفظة'), icon: Icon(Icons.account_balance_wallet_outlined)),
              ],
              selected: {_paymentMethod},
              onSelectionChanged: _busy ? null : (selection) => setState(() => _paymentMethod = selection.first),
            ),
            const SizedBox(height: 18),
            FilledButton.icon(
              onPressed: _busy ? null : _requestRide,
              icon: _busy
                  ? const SizedBox.square(dimension: 18, child: CircularProgressIndicator(strokeWidth: 2))
                  : const Icon(Icons.local_taxi),
              label: Text(_busy ? 'جارٍ إرسال الطلب...' : 'اطلب مشواراً'),
              style: FilledButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 14)),
            ),
          ],
        ),
      ),
    );
  }

  Widget _activeRideCard(Map<String, dynamic> ride) {
    final status = ride['status'] as String? ?? '';
    final fare = ride['fare'] is Map ? Map<String, dynamic>.from(ride['fare'] as Map) : <String, dynamic>{};
    final pickup = Map<String, dynamic>.from(ride['pickup'] as Map);
    final destination = Map<String, dynamic>.from(ride['destination'] as Map);
    final driverLocation = ride['driverLocation'] is Map
      ? Map<String, dynamic>.from(ride['driverLocation'] as Map)
      : null;
    final progress = switch (status) {
      'SEARCHING_DRIVER' => 0.2,
      'DRIVER_ASSIGNED' || 'DRIVER_ARRIVING' || 'DRIVER_ON_THE_WAY' => 0.4,
      'DRIVER_ARRIVED' => 0.6,
      'TRIP_STARTED' => 0.8,
      _ => 1.0,
    };

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                const Icon(Icons.directions_car, color: Color(0xFF10B981)),
                const SizedBox(width: 10),
                Expanded(child: Text(_rideStatusLabel(status), style: Theme.of(context).textTheme.titleMedium)),
              ],
            ),
            const SizedBox(height: 14),
            LinearProgressIndicator(value: progress, minHeight: 5),
            if (ride['driverId'] != null) ...[
              const SizedBox(height: 12),
              _DriverLocationStatus(updatedAt: ride['driverLocationUpdatedAt']),
            ],
            const SizedBox(height: 14),
            SizedBox(
              height: 220,
              child: MishwarMap(
                centerLatitude: ((pickup['latitude'] as num).toDouble() + (destination['latitude'] as num).toDouble()) / 2,
                centerLongitude: ((pickup['longitude'] as num).toDouble() + (destination['longitude'] as num).toDouble()) / 2,
                pickupLatitude: (pickup['latitude'] as num).toDouble(),
                pickupLongitude: (pickup['longitude'] as num).toDouble(),
                destinationLatitude: (destination['latitude'] as num).toDouble(),
                destinationLongitude: (destination['longitude'] as num).toDouble(),
                driverLatitude: (driverLocation?['latitude'] as num?)?.toDouble(),
                driverLongitude: (driverLocation?['longitude'] as num?)?.toDouble(),
                routingEnabled: widget.routingEnabled,
              ),
            ),
            const SizedBox(height: 18),
            _RideDetail(label: 'من', value: ride['pickup']?['addressName']?.toString() ?? _pickupController.text),
            _RideDetail(label: 'إلى', value: ride['destination']?['addressName']?.toString() ?? _destinationController.text),
            _RideDetail(label: 'المركبة', value: _vehicleOptions[ride['vehicleType']] ?? ride['vehicleType'].toString()),
            _RideDetail(label: 'الدفع', value: ride['paymentMethod'] == 'WALLET' ? 'المحفظة' : 'نقداً'),
            if (ride['driverName'] != null) _RideDetail(label: 'الكابتن', value: ride['driverName'].toString()),
            if (fare['grossFare'] != null) _RideDetail(label: 'الأجرة التقديرية', value: '${fare['grossFare']} ر.ي'),
            const SizedBox(height: 14),
            if (status != 'TRIP_COMPLETED')
              OutlinedButton.icon(
                onPressed: _busy ? null : _cancelRide,
                icon: const Icon(Icons.close),
                label: const Text('إلغاء المشوار'),
              ),
            if (status == 'TRIP_COMPLETED')
              const Text('شكراً لاختيارك مشوار', textAlign: TextAlign.center),
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
          SizedBox(width: 74, child: Text(label, style: const TextStyle(color: Colors.white60))),
          Expanded(child: Text(value, textAlign: TextAlign.right)),
        ],
      ),
    );
  }
}

class _DriverLocationStatus extends StatelessWidget {
  const _DriverLocationStatus({required this.updatedAt});

  final Object? updatedAt;

  @override
  Widget build(BuildContext context) {
    final isLive = updatedAt is String &&
        DateTime.now().difference(DateTime.tryParse(updatedAt as String)?.toLocal() ?? DateTime(2000)).inSeconds < 30;
    final color = isLive ? const Color(0xFF10B981) : Colors.amber;
    return Row(
      children: [
        Icon(isLive ? Icons.gps_fixed : Icons.location_searching, size: 18, color: color),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            _locationUpdateLabel(updatedAt),
            style: TextStyle(color: color, fontWeight: FontWeight.w600),
          ),
        ),
        if (isLive)
          Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(color: color, shape: BoxShape.circle),
          ),
      ],
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
