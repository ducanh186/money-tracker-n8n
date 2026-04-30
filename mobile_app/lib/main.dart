import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'app.dart';
import 'data/repositories/remote_money_repository.dart';
import 'data/repositories/mock_money_repository.dart';
import 'data/repositories/money_repository.dart';
import 'data/services/api_client.dart';
import 'ui/features/shell/app_state.dart';

const useMockApi = bool.fromEnvironment('USE_MOCK_API', defaultValue: false);

void main() {
  runApp(
    MultiProvider(
      providers: [
        Provider<MoneyRepository>(
          create: (_) => useMockApi
              ? MockMoneyRepository()
              : RemoteMoneyRepository(apiClient: ApiClient()),
        ),
        ChangeNotifierProvider(create: (_) => AppState()),
      ],
      child: const MoneyTrackerApp(),
    ),
  );
}
