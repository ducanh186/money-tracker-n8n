import '../models/money_models.dart';

abstract class MoneyRepository {
  Future<OverviewData> fetchOverview(String month);
}
