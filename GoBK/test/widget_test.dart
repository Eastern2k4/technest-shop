// This is a basic Flutter widget test.
//
// To perform an interaction with a widget in your test, use the WidgetTester
// utility in the flutter_test package. For example, you can send tap and scroll
// gestures. You can also use WidgetTester to find child widgets in the widget
// tree, read text, and verify that the values of widget properties are correct.

import 'package:flutter_test/flutter_test.dart';
import 'package:gobk/main.dart';

void main() {
  testWidgets('GoBK app loads login screen', (WidgetTester tester) async {
    // Build our app and trigger a frame.
    await tester.pumpWidget(const GoBKApp());

    // Verify that login screen is displayed
    expect(find.text('GoBK'), findsOneWidget);
    expect(find.text('Đăng nhập GoBK'), findsOneWidget);
    expect(find.text('Đặt xe nội bộ trường BK'), findsOneWidget);
    expect(find.text('Đăng nhập'), findsOneWidget);
  });

  testWidgets('Login button navigates to home screen',
      (WidgetTester tester) async {
    // Build our app and trigger a frame.
    await tester.pumpWidget(const GoBKApp());

    // Wait for the app to build
    await tester.pumpAndSettle();

    // Find and tap the login button
    await tester.tap(find.text('Đăng nhập'));
    await tester.pumpAndSettle();

    // Verify that we're on the home screen
    expect(find.text('Đặt xe mới'), findsOneWidget);
    expect(find.text('Theo dõi chuyến xe'), findsOneWidget);
  });
}
