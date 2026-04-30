import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'ui/core/app_theme.dart';
import 'ui/features/shell/app_state.dart';
import 'ui/features/shell/money_app_shell.dart';

class MoneyTrackerApp extends StatelessWidget {
  const MoneyTrackerApp({super.key});

  @override
  Widget build(BuildContext context) {
    final darkMode = context.watch<AppState>().darkMode;

    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'AL Money Tracker',
      theme: AppTheme.light,
      darkTheme: AppTheme.dark,
      themeMode: darkMode ? ThemeMode.dark : ThemeMode.light,
      home: const MoneyAppShell(),
    );
  }
}
