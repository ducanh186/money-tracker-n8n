import 'package:flutter/material.dart';

enum TransactionFlow { income, expense, transfer }

class Transaction {
  const Transaction({
    required this.date,
    required this.dayLabel,
    required this.time,
    required this.flow,
    required this.amountVnd,
    required this.description,
    required this.category,
    required this.jar,
  });

  final String? date;
  final String? dayLabel;
  final String? time;
  final TransactionFlow? flow;
  final int amountVnd;
  final String? description;
  final String? category;
  final String? jar;

  factory Transaction.fromJson(Map<String, Object?> json) {
    return Transaction(
      date: json['date'] as String?,
      dayLabel: json['day_label'] as String?,
      time: json['time'] as String?,
      flow: _flowFromString(json['flow'] as String?),
      amountVnd: _intFromJson(json['amount_vnd']),
      description: json['description'] as String?,
      category: json['category'] as String?,
      jar: json['jar'] as String?,
    );
  }
}

class DashboardSummary {
  const DashboardSummary({
    required this.month,
    required this.incomeVnd,
    required this.expenseVnd,
    required this.netVnd,
    required this.recentTransactions,
  });

  final String month;
  final int incomeVnd;
  final int expenseVnd;
  final int netVnd;
  final List<Transaction> recentTransactions;

  factory DashboardSummary.fromJson(Map<String, Object?> json) {
    final totals = (json['totals'] as Map<String, Object?>?) ?? {};
    final recent = (json['recent_transactions'] as List<Object?>? ?? [])
        .whereType<Map<String, Object?>>()
        .map(Transaction.fromJson)
        .toList();

    return DashboardSummary(
      month: json['month'] as String? ?? '',
      incomeVnd: _intFromJson(totals['income_vnd']),
      expenseVnd: _intFromJson(totals['expense_vnd']),
      netVnd: _intFromJson(totals['net_vnd']),
      recentTransactions: recent,
    );
  }
}

class BudgetStatus {
  const BudgetStatus({
    required this.month,
    required this.income,
    required this.assigned,
    required this.unassigned,
    required this.totalSpent,
    required this.availableToSpend,
    required this.jars,
  });

  final String month;
  final int income;
  final int assigned;
  final int unassigned;
  final int totalSpent;
  final int availableToSpend;
  final List<JarMetric> jars;

  factory BudgetStatus.fromJson(Map<String, Object?> json) {
    final jars = (json['jars'] as List<Object?>? ?? [])
        .whereType<Map<String, Object?>>()
        .map(JarMetric.fromJson)
        .toList();

    return BudgetStatus(
      month: json['month'] as String? ?? '',
      income: _intFromJson(json['income']),
      assigned: _intFromJson(json['assigned']),
      unassigned: _intFromJson(json['unassigned']),
      totalSpent: _intFromJson(json['total_spent']),
      availableToSpend: _intFromJson(json['available_to_spend']),
      jars: jars,
    );
  }
}

class JarMetric {
  const JarMetric({
    required this.key,
    required this.label,
    required this.planned,
    required this.spent,
    required this.available,
    required this.color,
    required this.icon,
  });

  final String key;
  final String label;
  final int planned;
  final int spent;
  final int available;
  final Color color;
  final IconData icon;

  int get usagePct {
    if (planned <= 0) return 0;
    return ((spent / planned) * 100).round().clamp(0, 999);
  }

  bool get isOver => available < 0;
  bool get isWarning => !isOver && usagePct >= 80;

  factory JarMetric.fromJson(Map<String, Object?> json) {
    final key = json['key'] as String? ?? '';
    final planned = _intFromJson(json['planned']);
    final spent = _intFromJson(json['spent']);
    final available = _intFromJson(json['available']);
    final definition = jarDefinitions[key] ?? fallbackJarDefinition;

    return JarMetric(
      key: key,
      label: json['label'] as String? ?? definition.label,
      planned: planned,
      spent: spent,
      available: available,
      color: definition.color,
      icon: definition.icon,
    );
  }
}

class OverviewData {
  const OverviewData({
    required this.summary,
    required this.budgetStatus,
    required this.topCategories,
  });

  final DashboardSummary summary;
  final BudgetStatus budgetStatus;
  final List<TopCategory> topCategories;
}

class TopCategory {
  const TopCategory({
    required this.label,
    required this.jarKey,
    required this.amountVnd,
    required this.percent,
  });

  final String label;
  final String jarKey;
  final int amountVnd;
  final int percent;
}

class JarDefinition {
  const JarDefinition({
    required this.label,
    required this.color,
    required this.icon,
  });

  final String label;
  final Color color;
  final IconData icon;
}

const fallbackJarDefinition = JarDefinition(
  label: 'Hũ',
  color: Color(0xFF2563EB),
  icon: Icons.account_balance_wallet_outlined,
);

const jarDefinitions = <String, JarDefinition>{
  'NEC': JarDefinition(
    label: 'Thiết yếu',
    color: Color(0xFF0284C7),
    icon: Icons.home_outlined,
  ),
  'EDU': JarDefinition(
    label: 'Giáo dục',
    color: Color(0xFF7C3AED),
    icon: Icons.menu_book_outlined,
  ),
  'LTSS': JarDefinition(
    label: 'Tiết kiệm dài hạn',
    color: Color(0xFF059669),
    icon: Icons.savings_outlined,
  ),
  'PLAY': JarDefinition(
    label: 'Hưởng thụ',
    color: Color(0xFFEA580C),
    icon: Icons.celebration_outlined,
  ),
  'FFA': JarDefinition(
    label: 'Tự do tài chính',
    color: Color(0xFFD97706),
    icon: Icons.trending_up_outlined,
  ),
  'GIVE': JarDefinition(
    label: 'Cho đi',
    color: Color(0xFFDB2777),
    icon: Icons.volunteer_activism_outlined,
  ),
};

TransactionFlow? _flowFromString(String? value) {
  return switch (value) {
    'income' => TransactionFlow.income,
    'expense' => TransactionFlow.expense,
    'transfer' => TransactionFlow.transfer,
    _ => null,
  };
}

int _intFromJson(Object? value) {
  if (value is int) return value;
  if (value is double) return value.round();
  if (value is num) return value.round();
  if (value is String) return int.tryParse(value) ?? 0;
  return 0;
}
