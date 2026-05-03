import 'package:flutter/material.dart';

import '../../core/months.dart';

enum AppTab { overview, transactions, jars, budget, more }

class AppState extends ChangeNotifier {
  AppTab _currentTab = AppTab.overview;
  String _selectedMonth = getCurrentMonth();
  bool _darkMode = true;

  AppTab get currentTab => _currentTab;
  String get selectedMonth => _selectedMonth;
  bool get darkMode => _darkMode;

  void setTab(AppTab tab) {
    if (_currentTab == tab) return;
    _currentTab = tab;
    notifyListeners();
  }

  void setMonth(String month) {
    if (_selectedMonth == month) return;
    _selectedMonth = month;
    notifyListeners();
  }

  void toggleDarkMode() {
    _darkMode = !_darkMode;
    notifyListeners();
  }
}
