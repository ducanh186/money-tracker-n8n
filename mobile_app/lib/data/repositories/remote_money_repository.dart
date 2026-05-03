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
    final topCategories = categories
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
}
