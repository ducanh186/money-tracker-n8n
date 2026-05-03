import '../models/money_models.dart';
import 'money_repository.dart';

class MockMoneyRepository implements MoneyRepository {
  final Map<String, BudgetPeriodSnapshot> _periodsByMonth = {};
  final Map<String, Map<int, CategoryBudgetRecord>> _budgetsByMonth = {};
  int _nextBudgetId = 1000;

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
      accountBalanceVnd: 12000000,
      endingBalanceVnd: 12000000,
      recentTransactions: transactions,
    );

    final budgetStatus = BudgetStatus(
      month: month,
      income: 18000000,
      expectedIncomeVnd: 18000000,
      actualIncomeVnd: 18000000,
      actualExpenseVnd: totalSpent,
      assigned: 18000000,
      unassigned: 0,
      reservedVnd: 0,
      totalSpent: totalSpent,
      availableToSpend: 18000000 - totalSpent,
      accountBalanceVnd: 12000000,
      endingBalanceVnd: 12000000,
      hasPeriod: true,
      periodStatus: 'open',
      planningInsightsEnabled: true,
      jars: jars,
      categories: const [],
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

  @override
  Future<BudgetEditorSeed> fetchBudgetEditorSeed(String month) async {
    await Future<void>.delayed(const Duration(milliseconds: 120));

    return BudgetEditorSeed(
      month: month,
      period: _periodsByMonth[month],
      categories: _mockCategories,
      categoryBudgets: _budgetsByMonth[month]?.values.toList() ?? const [],
    );
  }

  @override
  Future<BudgetEditorSeed> saveBudget(BudgetSaveRequest request) async {
    await Future<void>.delayed(const Duration(milliseconds: 180));

    final period =
        request.period ??
        BudgetPeriodSnapshot(
          id: 1,
          month: request.month,
          totalIncome: request.expectedIncomeVnd,
          status: 'open',
        );
    _periodsByMonth[request.month] = BudgetPeriodSnapshot(
      id: period.id,
      month: request.month,
      totalIncome: request.expectedIncomeVnd,
      status: period.status,
    );

    final monthBudgets = _budgetsByMonth.putIfAbsent(
      request.month,
      () => <int, CategoryBudgetRecord>{},
    );

    for (final category in request.categories) {
      if (category.categoryId <= 0) {
        continue;
      }

      final existingId = category.existingBudgetId;
      final definition = _mockCategories.firstWhere(
        (item) => item.id == category.categoryId,
        orElse: () => BudgetCategoryDefinition(
          id: category.categoryId,
          key: 'CAT-${category.categoryId}',
          name: 'Category ${category.categoryId}',
          group: null,
          sortOrder: category.categoryId,
          isActive: true,
        ),
      );

      if (existingId == null &&
          category.budgetedAmount <= 0 &&
          category.reservedAmount <= 0 &&
          category.rolloverAmount <= 0) {
        continue;
      }

      final budgetId = existingId ?? _nextBudgetId++;
      monthBudgets[budgetId] = CategoryBudgetRecord(
        id: budgetId,
        budgetPeriodId: _periodsByMonth[request.month]!.id,
        categoryId: category.categoryId,
        categoryKey: definition.key,
        categoryName: definition.name,
        budgetedAmount: category.budgetedAmount,
        reservedAmount: category.reservedAmount,
        rolloverAmount: category.rolloverAmount,
        notes: category.notes,
      );
    }

    return fetchBudgetEditorSeed(request.month);
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

const _mockCategories = <BudgetCategoryDefinition>[
  BudgetCategoryDefinition(
    id: 1,
    key: 'food',
    name: 'Ăn uống',
    group: 'Thiết yếu',
    sortOrder: 1,
    isActive: true,
  ),
  BudgetCategoryDefinition(
    id: 2,
    key: 'transport',
    name: 'Di chuyển',
    group: 'Thiết yếu',
    sortOrder: 2,
    isActive: true,
  ),
  BudgetCategoryDefinition(
    id: 3,
    key: 'housing',
    name: 'Nhà ở',
    group: 'Thiết yếu',
    sortOrder: 3,
    isActive: true,
  ),
  BudgetCategoryDefinition(
    id: 4,
    key: 'shopping',
    name: 'Mua sắm',
    group: 'Hưởng thụ',
    sortOrder: 4,
    isActive: true,
  ),
  BudgetCategoryDefinition(
    id: 5,
    key: 'entertainment',
    name: 'Giải trí',
    group: 'Hưởng thụ',
    sortOrder: 5,
    isActive: true,
  ),
];
