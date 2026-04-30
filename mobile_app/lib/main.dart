import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'app.dart';
import 'data/repositories/mock_money_repository.dart';
import 'data/repositories/money_repository.dart';
import 'ui/features/shell/app_state.dart';

void main() {
  runApp(
    MultiProvider(
      providers: [
        Provider<MoneyRepository>(create: (_) => MockMoneyRepository()),
        ChangeNotifierProvider(create: (_) => AppState()),
      ],
      child: const MoneyTrackerApp(),
    ),
  );
}
