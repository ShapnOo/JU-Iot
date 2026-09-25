import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/main.dart';

void main() {
  testWidgets('ESP32 Smart Home App Smoke Test', (WidgetTester tester) async {
    await tester.pumpWidget(const Esp32SmartHomeApp());
    expect(find.text('ESP32 Smart Home'), findsOneWidget);
  });
}
