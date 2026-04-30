import '../models/money_models.dart';
import 'money_repository.dart';

class MockMoneyRepository implements MoneyRepository {
  @override
  Future<OverviewData> fetchOverview(String month) async {
    await Future<void>.delayed(const Duration(milliseconds: 250));

    final transactions = const [
      Transaction(
        date: '18/04',
        dayLabel: 'Hôm nay',
        time: '09:30',
        flow: TransactionFlow.expense,
        amountVnd: 50000,
        description: 'Cà phê sáng',
        category: 'Cà phê',
        jar: 'NEC',
      ),
      Transaction(
        date: '18/04',
        dayLabel: 'Hôm nay',
        time: '08:15',
        flow: TransactionFlow.expense,
        amountVnd: 45000,
        description: 'Grab đi làm',
        category: 'Đi lại',
        jar: 'NEC',
      ),
      Transaction(
        date: '18/04',
        dayLabel: 'Hôm nay',
        time: '12:45',
        flow: TransactionFlow.expense,
        amountVnd: 65000,
        description: 'Trà sữa',
        category: 'Ăn ngoài',
        jar: 'PLAY',
      ),
      Transaction(
        date: '17/04',
        dayLabel: 'Hôm qua',
        time: '09:00',
        flow: TransactionFlow.income,
        amountVnd: 18000000,
        description: 'Lương tháng 4',
        category: 'Thu nhập',
        jar: null,
      ),
      Transaction(
        date: '17/04',
        dayLabel: 'Hôm qua',
        time: '18:30',
        flow: TransactionFlow.expense,
        amountVnd: 180000,
        description: 'Đi chợ Bà Chiểu',
        category: 'Đi chợ',
        jar: 'NEC',
      ),
    ];

    final jars = [
      _jar('NEC', 9900000, 1800000),
      _jar('EDU', 1800000, 1700000),
      _jar('LTSS', 1800000, 1800000),
      _jar('PLAY', 1800000, 2200000),
      _jar('FFA', 1800000, 540000),
      _jar('GIVE', 900000, 0),
    ];
    final totalSpent = jars.fold<int>(0, (sum, jar) => sum + jar.spent);

    final summary = DashboardSummary(
      month: month,
      incomeVnd: 18000000,
      expenseVnd: totalSpent,
      netVnd: 18000000 - totalSpent,
      recentTransactions: transactions,
    );

    final budgetStatus = BudgetStatus(
      month: month,
      income: 18000000,
      assigned: 18000000,
      unassigned: 0,
      totalSpent: totalSpent,
      availableToSpend: 18000000 - totalSpent,
      planningInsightsEnabled: true,
      jars: jars,
    );

    return OverviewData(
      summary: summary,
      budgetStatus: budgetStatus,
      topCategories: const [
        TopCategory(
          label: 'Ăn ngoài',
          jarKey: 'PLAY',
          amountVnd: 1240000,
          percent: 35,
        ),
        TopCategory(
          label: 'Đi chợ',
          jarKey: 'NEC',
          amountVnd: 980000,
          percent: 28,
        ),
        TopCategory(
          label: 'Xăng xe',
          jarKey: 'NEC',
          amountVnd: 560000,
          percent: 16,
        ),
      ],
    );
  }

  JarMetric _jar(String key, int planned, int spent) {
    final definition = jarDefinitions[key] ?? fallbackJarDefinition;
    return JarMetric(
      key: key,
      label: definition.label,
      planned: planned,
      spent: spent,
      available: planned - spent,
      color: definition.color,
      icon: definition.icon,
    );
  }
}
