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

    return OverviewData(
      summary: DashboardSummary.fromJson(summaryData),
      budgetStatus: BudgetStatus.fromJson(statusData),
      topCategories: const [],
    );
  }
}
