import 'package:dio/dio.dart';

const mishwarApiBaseUrl = String.fromEnvironment(
  'MISHWAR_API_BASE_URL',
  defaultValue: 'http://localhost:4000',
);

const demoCustomerId = 'flutter_demo_customer';
const demoDriverId = 'flutter_demo_driver';

class MishwarApi {
  MishwarApi()
      : _dio = Dio(BaseOptions(
          baseUrl: mishwarApiBaseUrl,
          connectTimeout: const Duration(seconds: 5),
          receiveTimeout: const Duration(seconds: 5),
        ));

  final Dio _dio;

  Map<String, String> _headers(String role) => {
        'x-user-id': role == 'CUSTOMER' ? demoCustomerId : demoDriverId,
        'x-user-role': role,
      };

  Map<String, dynamic> _data(Response<dynamic> response) =>
      Map<String, dynamic>.from(response.data['data'] as Map);

  Future<Map<String, dynamic>> health() async => _data(await _dio.get('/health'));

  Future<Map<String, dynamic>?> activeRide(String role) async {
    final response = await _dio.get(
      '/api/rides/active',
      options: Options(headers: _headers(role)),
    );
    final data = response.data['data'];
    return data == null ? null : Map<String, dynamic>.from(data as Map);
  }

  Future<Map<String, dynamic>?> incomingRide() async {
    final response = await _dio.get(
      '/api/dispatch/incoming',
      options: Options(headers: _headers('DRIVER')),
    );
    final data = response.data['data'];
    return data == null ? null : Map<String, dynamic>.from(data as Map);
  }

  Future<Map<String, dynamic>> updateDriverLocation({
    required String rideId,
    required double latitude,
    required double longitude,
  }) async {
    final response = await _dio.post(
      '/api/rides/$rideId/location',
      data: {'latitude': latitude, 'longitude': longitude},
      options: Options(headers: _headers('DRIVER')),
    );
    return _data(response);
  }

  Future<Map<String, dynamic>> requestRide({
    required String pickupName,
    required String destinationName,
    required double pickupLatitude,
    required double pickupLongitude,
    required double destinationLatitude,
    required double destinationLongitude,
    required String vehicleType,
    required int passengerCount,
    required bool airConditioningRequired,
    required String paymentMethod,
  }) async {
    final key = 'flutter-${DateTime.now().microsecondsSinceEpoch}';
    final response = await _dio.post(
      '/api/rides',
      data: {
        'customerName': 'عميل مشوار',
        'customerPhone': '771234567',
        'pickup': {
          'latitude': pickupLatitude,
          'longitude': pickupLongitude,
          'addressName': pickupName,
        },
        'destination': {
          'latitude': destinationLatitude,
          'longitude': destinationLongitude,
          'addressName': destinationName,
        },
        'vehicleType': vehicleType,
        'passengerCount': passengerCount,
        'airConditioningRequired': airConditioningRequired,
        'paymentMethod': paymentMethod,
      },
      options: Options(
        headers: {
          ..._headers('CUSTOMER'),
          'x-idempotency-key': key,
        },
      ),
    );
    return _data(response);
  }

  Future<Map<String, dynamic>> rideAction(
    String rideId,
    String action, {
    String? driverName,
    String? reason,
    String? actorRole,
  }) async {
    final data = <String, dynamic>{};
    if (driverName != null) data['driverName'] = driverName;
    if (reason != null) data['reason'] = reason;
    final role = actorRole ?? (action == 'accept' ||
            action == 'arrived' ||
            action == 'start' ||
            action == 'complete'
        ? 'DRIVER'
        : action == 'cancel'
            ? 'CUSTOMER'
        : 'DRIVER');
    final response = await _dio.post(
      '/api/rides/$rideId/$action',
      data: data,
      options: Options(headers: _headers(role)),
    );
    return _data(response);
  }
}