import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/app.dart';
import 'package:mobile_app/data/repositories/mock_money_repository.dart';
import 'package:mobile_app/data/repositories/money_repository.dart';
import 'package:mobile_app/ui/features/shell/app_state.dart';
import 'package:provider/provider.dart';

void main() {
  testWidgets('renders overview and switches tabs', (tester) async {
    await tester.pumpWidget(
      MultiProvider(
        providers: [
          Provider<MoneyRepository>(create: (_) => MockMoneyRepository()),
          ChangeNotifierProvider(create: (_) => AppState()),
        ],
        child: const MoneyTrackerApp(),
      ),
    );

    await tester.pumpAndSettle();

    expect(find.text('Còn chi được'), findsOneWidget);
    expect(find.text('6 hũ tháng này'), findsOneWidget);
    expect(find.text('NEC'), findsOneWidget);

    await tester.tap(find.text('Đã chi'));
    await tester.pumpAndSettle();

    expect(find.text('Đã chi tháng này'), findsOneWidget);

    await tester.drag(find.byType(Scrollable).first, const Offset(0, -500));
    await tester.pumpAndSettle();

    expect(find.text('TOP ĂN TIỀN'), findsOneWidget);

    await tester.tap(find.byIcon(Icons.add));
    await tester.pumpAndSettle();

    expect(find.text('Thêm giao dịch'), findsOneWidget);
    expect(find.text('Chi'), findsOneWidget);

    await tester.tap(find.text('Hủy'));
    await tester.pumpAndSettle();

    await tester.tap(find.text('Giao dịch'));
    await tester.pumpAndSettle();

    expect(
      find.text('Các giao dịch gần nhất lấy trực tiếp từ API hiện tại.'),
      findsOneWidget,
    );
  });
}
