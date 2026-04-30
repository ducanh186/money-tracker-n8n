import 'package:flutter/foundation.dart';

import '../../../../data/models/money_models.dart';
import '../../../../data/repositories/money_repository.dart';

class OverviewViewModel extends ChangeNotifier {
  OverviewViewModel({required MoneyRepository repository})
    : _repository = repository;

  final MoneyRepository _repository;

  OverviewData? _data;
  Object? _error;
  bool _isLoading = false;
  String? _loadedMonth;

  OverviewData? get data => _data;
  Object? get error => _error;
  bool get isLoading => _isLoading;

  Future<void> load(String month) async {
    if (_loadedMonth == month && _data != null) return;
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _data = await _repository.fetchOverview(month);
      _loadedMonth = month;
    } catch (error) {
      _error = error;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
