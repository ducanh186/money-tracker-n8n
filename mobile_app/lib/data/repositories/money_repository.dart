import '../models/money_models.dart';

abstract class MoneyRepository {
  Future<OverviewData> fetchOverview(String month);

  Future<BudgetEditorSeed> fetchBudgetEditorSeed(String month);

  Future<BudgetEditorSeed> saveBudget(BudgetSaveRequest request);
}
