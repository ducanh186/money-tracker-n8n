import '../models/money_models.dart';
import '../services/api_client.dart';
import 'money_repository.dart';

class RemoteMoneyRepository implements MoneyRepository {
  RemoteMoneyRepository({required ApiClient apiClient})
    : _apiClient = apiClient;

  final ApiClient _apiClient;

  @override
  Future<OverviewData> fetchOverview(String month) async {
    final results = await Future.wait([
      _apiClient.getJson(
        '/dashboard/summary',
        queryParameters: {'month': month},
      ),
      _apiClient.getJson('/budget-status', queryParameters: {'month': month}),
    ]);

    final summaryData = results[0]['data'];
    final statusData = results[1]['data'];
    if (summaryData is! Map<String, Object?> ||
        statusData is! Map<String, Object?>) {
      throw const ApiException('Overview endpoints returned invalid data');
    }

    final budgetStatus = BudgetStatus.fromJson(statusData);
    final categories = budgetStatus.categories;
    final totalCategorySpent = categories.fold<int>(
      0,
      (sum, category) => sum + category.spentVnd.abs(),
    );
    final topCategories =
        categories
            .where((category) => category.spentVnd > 0)
            .map(
              (category) => TopCategory(
                label: category.name,
                jarKey: category.key,
                amountVnd: category.spentVnd,
                percent: totalCategorySpent > 0
                    ? ((category.spentVnd / totalCategorySpent) * 100).round()
                    : 0,
              ),
            )
            .toList()
          ..sort((a, b) => b.amountVnd.compareTo(a.amountVnd));

    return OverviewData(
      summary: DashboardSummary.fromJson(summaryData),
      budgetStatus: budgetStatus,
      topCategories: topCategories.take(4).toList(),
    );
  }

  @override
  Future<BudgetEditorSeed> fetchBudgetEditorSeed(String month) async {
    final results = await Future.wait([
      _apiClient.getJson('/categories'),
      _apiClient.getJson(
        '/category-budgets',
        queryParameters: {'month': month},
      ),
      _apiClient.getJson('/budget-periods'),
    ]);

    final categoriesData = results[0]['data'];
    final budgetsData = results[1]['data'];
    final periodsData = results[2]['data'];

    final categories =
        _readList(
          categoriesData,
        ).map(BudgetCategoryDefinition.fromJson).toList()..sort((left, right) {
          final order = left.sortOrder.compareTo(right.sortOrder);
          if (order != 0) return order;
          return left.name.compareTo(right.name);
        });

    final categoryBudgets = _readList(
      budgetsData,
    ).map(CategoryBudgetRecord.fromJson).toList();

    final period = _readList(periodsData)
        .map(BudgetPeriodSnapshot.fromJson)
        .cast<BudgetPeriodSnapshot?>()
        .firstWhere((item) => item?.month == month, orElse: () => null);

    return BudgetEditorSeed(
      month: month,
      period: period,
      categories: categories,
      categoryBudgets: categoryBudgets,
    );
  }

  @override
  Future<BudgetEditorSeed> saveBudget(BudgetSaveRequest request) async {
    var period = request.period;
    if (period == null) {
      final parsedMonth = _parseBudgetMonth(request.month);
      if (parsedMonth == null) {
        throw const ApiException(
          'Không đọc được tháng ngân sách để tạo kỳ mới.',
        );
      }

      final createResponse = await _apiClient.postJson(
        '/budget-periods',
        body: {
          'month': request.month,
          'year': parsedMonth.year,
          'month_num': parsedMonth.monthNum,
          'total_income': request.expectedIncomeVnd,
        },
      );
      period = _readWorkspacePeriod(createResponse);
    } else if (period.totalIncome != request.expectedIncomeVnd) {
      await _apiClient.putJson(
        '/budget-periods/${period.id}',
        body: {'total_income': request.expectedIncomeVnd},
      );
      period = BudgetPeriodSnapshot(
        id: period.id,
        month: period.month,
        totalIncome: request.expectedIncomeVnd,
        status: period.status,
      );
    }

    for (final category in request.categories) {
      if (category.categoryId <= 0) {
        continue;
      }

      final payload = <String, Object?>{
        'budgeted_amount': category.budgetedAmount,
        'reserved_amount': category.reservedAmount,
        'rollover_amount': category.rolloverAmount,
        'notes': category.notes,
      };

      if (category.existingBudgetId != null) {
        await _apiClient.putJson(
          '/category-budgets/${category.existingBudgetId}',
          body: payload,
        );
        continue;
      }

      final hasMeaningfulValue =
          category.budgetedAmount > 0 ||
          category.reservedAmount > 0 ||
          category.rolloverAmount > 0 ||
          (category.notes?.trim().isNotEmpty ?? false);
      if (!hasMeaningfulValue) {
        continue;
      }

      await _apiClient.postJson(
        '/category-budgets',
        body: {
          'budget_period_id': period.id,
          'category_id': category.categoryId,
          ...payload,
        },
      );
    }

    return fetchBudgetEditorSeed(request.month);
  }
}

List<Map<String, Object?>> _readList(Object? value) {
  if (value is! List<Object?>) {
    return const [];
  }

  return value.whereType<Map<String, Object?>>().toList();
}

BudgetPeriodSnapshot _readWorkspacePeriod(Map<String, Object?> response) {
  final data = response['data'];
  if (data is! Map<String, Object?>) {
    throw const ApiException(
      'Budget period response returned invalid workspace data.',
    );
  }

  final period = data['period'];
  if (period is! Map<String, Object?>) {
    throw const ApiException(
      'Budget period response did not include a period.',
    );
  }

  return BudgetPeriodSnapshot.fromJson(period);
}

({int year, int monthNum})? _parseBudgetMonth(String month) {
  final parts = month.split('-');
  if (parts.length != 2) {
    return null;
  }

  final monthNames = const [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  final year = int.tryParse(parts[1]);
  final monthNum = monthNames.indexOf(parts[0]) + 1;
  if (year == null || monthNum <= 0) {
    return null;
  }

  return (year: year, monthNum: monthNum);
}
