// This is a basic Flutter widget test.
//
// To perform an interaction with a widget in your test, use the WidgetTester
// utility in the flutter_test package. For example, you can send tap and scroll
// gestures. You can also use WidgetTester to find child widgets in the widget
// tree, read text, and verify that the values of widget properties are correct.

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mishwar_customer/main.dart';
import 'package:mishwar_shared/mishwar_api.dart';

class _FakeMishwarApi extends MishwarApi {
  @override
  Future<Map<String, dynamic>> health() async => {
        'service': 'Test API',
        'status': 'ONLINE',
      };

  @override
  Future<Map<String, dynamic>?> activeRide(String role) async => null;
}

void main() {
  testWidgets('customer can open the ride booking screen', (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [apiProvider.overrideWithValue(_FakeMishwarApi())],
        child: const MishwarCustomerApp(routingEnabled: false),
      ),
    );
    await tester.pump();
    await tester.pump();

    expect(find.text('احجز مشوارك'), findsOneWidget);
    expect(find.text('اطلب مشواراً'), findsOneWidget);

    await tester.pumpWidget(const SizedBox());
  });
}
