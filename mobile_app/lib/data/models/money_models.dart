import 'package:flutter/material.dart';

enum TransactionFlow { income, expense, transfer }

class Transaction {
  const Transaction({
    required this.date,
    required this.dayLabel,
    required this.time,
    required this.flow,
    required this.amountVnd,
    this.amountRaw = 0,
    this.amountVndSigned = 0,
    this.amountVndAbs = 0,
    this.direction,
    required this.description,
    required this.category,
    required this.jar,
  });

  final String? date;
  final String? dayLabel;
  final String? time;
  final TransactionFlow? flow;
  final int amountVnd;
  final int amountRaw;
  final int amountVndSigned;
  final int amountVndAbs;
  final String? direction;
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
      amountRaw: _intFromJson(json['amount_raw']),
      amountVndSigned: _intFromJson(json['amount_vnd_signed']),
      amountVndAbs: _intFromJson(json['amount_vnd_abs']),
      direction: json['direction'] as String?,
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
    required this.accountBalanceVnd,
    required this.endingBalanceVnd,
    required this.recentTransactions,
  });

  final String month;
  final int incomeVnd;
  final int expenseVnd;
  final int netVnd;
  final int accountBalanceVnd;
  final int endingBalanceVnd;
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
      accountBalanceVnd: _intFromJson(totals['account_balance_vnd']),
      endingBalanceVnd: _intFromJson(totals['ending_balance_vnd']),
      recentTransactions: recent,
    );
  }
}

class BudgetStatus {
  const BudgetStatus({
    required this.month,
    required this.income,
    required this.expectedIncomeVnd,
    required this.actualIncomeVnd,
    required this.actualExpenseVnd,
    required this.assigned,
    required this.unassigned,
    required this.reservedVnd,
    required this.totalSpent,
    required this.availableToSpend,
    required this.accountBalanceVnd,
    required this.endingBalanceVnd,
    required this.hasPeriod,
    required this.periodStatus,
    required this.planningInsightsEnabled,
    required this.jars,
    required this.categories,
  });

  final String month;
  final int income;
  final int expectedIncomeVnd;
  final int actualIncomeVnd;
  final int actualExpenseVnd;
  final int assigned;
  final int unassigned;
  final int reservedVnd;
  final int totalSpent;
  final int availableToSpend;
  final int accountBalanceVnd;
  final int endingBalanceVnd;
  final bool hasPeriod;
  final String periodStatus;
  final bool planningInsightsEnabled;
  final List<JarMetric> jars;
  final List<CategoryMetric> categories;

  factory BudgetStatus.fromJson(Map<String, Object?> json) {
    final jars = (json['jars'] as List<Object?>? ?? [])
        .whereType<Map<String, Object?>>()
        .map(JarMetric.fromJson)
        .toList();
    final categories = (json['categories'] as List<Object?>? ?? [])
        .whereType<Map<String, Object?>>()
        .map(CategoryMetric.fromJson)
        .toList();

    return BudgetStatus(
      month: json['month'] as String? ?? '',
      income: _intFromJson(json['income']),
      expectedIncomeVnd: _intFromJson(
        json['expected_income_vnd'] ?? json['income'],
      ),
      actualIncomeVnd: _intFromJson(
        json['actual_income_vnd'] ?? json['sheet_income'],
      ),
      actualExpenseVnd: _intFromJson(
        json['actual_expense_vnd'] ?? json['total_spent'],
      ),
      assigned: _intFromJson(json['assigned']),
      unassigned: _intFromJson(
        json['left_to_budget_vnd'] ?? json['unassigned'],
      ),
      reservedVnd: _intFromJson(json['reserved_vnd'] ?? json['committed']),
      totalSpent: _intFromJson(
        json['actual_expense_vnd'] ?? json['total_spent'],
      ),
      availableToSpend: _intFromJson(
        json['available_to_spend_vnd'] ?? json['available_to_spend'],
      ),
      accountBalanceVnd: _intFromJson(
        json['account_balance_vnd'] ?? json['ending_balance_vnd'],
      ),
      endingBalanceVnd: _intFromJson(json['ending_balance_vnd']),
      hasPeriod: json['has_period'] != false,
      periodStatus: json['period_status'] as String? ?? '',
      planningInsightsEnabled: json['planning_insights_enabled'] == true,
      jars: jars,
      categories: categories,
    );
  }
}

class CategoryMetric {
  const CategoryMetric({
    required this.key,
    required this.name,
    required this.group,
    required this.budgetedVnd,
    required this.spentVnd,
    required this.reservedVnd,
    required this.remainingVnd,
    required this.usagePct,
    required this.status,
  });

  final String key;
  final String name;
  final String? group;
  final int budgetedVnd;
  final int spentVnd;
  final int reservedVnd;
  final int remainingVnd;
  final int usagePct;
  final String status;

  factory CategoryMetric.fromJson(Map<String, Object?> json) {
    return CategoryMetric(
      key: json['category_key'] as String? ?? '',
      name: json['category_name'] as String? ?? '',
      group: json['category_group'] as String?,
      budgetedVnd: _intFromJson(json['budgeted_vnd']),
      spentVnd: _intFromJson(json['spent_vnd']),
      reservedVnd: _intFromJson(json['reserved_vnd']),
      remainingVnd: _intFromJson(json['remaining_vnd']),
      usagePct: _intFromJson(json['usage_pct']),
      status: json['status'] as String? ?? 'OK',
    );
  }
}

class BudgetCategoryDefinition {
  const BudgetCategoryDefinition({
    required this.id,
    required this.key,
    required this.name,
    required this.group,
    required this.sortOrder,
    required this.isActive,
  });

  final int id;
  final String key;
  final String name;
  final String? group;
  final int sortOrder;
  final bool isActive;

  factory BudgetCategoryDefinition.fromJson(Map<String, Object?> json) {
    return BudgetCategoryDefinition(
      id: _intFromJson(json['id']),
      key: json['key'] as String? ?? '',
      name: json['name'] as String? ?? '',
      group: json['group'] as String?,
      sortOrder: _intFromJson(json['sort_order']),
      isActive: _boolFromJson(json['is_active'], defaultValue: true),
    );
  }
}

class CategoryBudgetRecord {
  const CategoryBudgetRecord({
    required this.id,
    required this.budgetPeriodId,
    required this.categoryId,
    required this.categoryKey,
    required this.categoryName,
    required this.budgetedAmount,
    required this.reservedAmount,
    required this.rolloverAmount,
    required this.notes,
  });

  final int id;
  final int budgetPeriodId;
  final int categoryId;
  final String categoryKey;
  final String categoryName;
  final int budgetedAmount;
  final int reservedAmount;
  final int rolloverAmount;
  final String? notes;

  factory CategoryBudgetRecord.fromJson(Map<String, Object?> json) {
    return CategoryBudgetRecord(
      id: _intFromJson(json['id']),
      budgetPeriodId: _intFromJson(json['budget_period_id']),
      categoryId: _intFromJson(json['category_id']),
      categoryKey: json['category_key'] as String? ?? '',
      categoryName: json['category_name'] as String? ?? '',
      budgetedAmount: _intFromJson(json['budgeted_amount']),
      reservedAmount: _intFromJson(json['reserved_amount']),
      rolloverAmount: _intFromJson(json['rollover_amount']),
      notes: json['notes'] as String?,
    );
  }
}

class BudgetPeriodSnapshot {
  const BudgetPeriodSnapshot({
    required this.id,
    required this.month,
    required this.totalIncome,
    required this.status,
  });

  final int id;
  final String month;
  final int totalIncome;
  final String status;

  factory BudgetPeriodSnapshot.fromJson(Map<String, Object?> json) {
    return BudgetPeriodSnapshot(
      id: _intFromJson(json['id']),
      month: json['month'] as String? ?? '',
      totalIncome: _intFromJson(json['total_income']),
      status: json['status'] as String? ?? 'draft',
    );
  }
}

class BudgetEditorSeed {
  const BudgetEditorSeed({
    required this.month,
    required this.period,
    required this.categories,
    required this.categoryBudgets,
  });

  final String month;
  final BudgetPeriodSnapshot? period;
  final List<BudgetCategoryDefinition> categories;
  final List<CategoryBudgetRecord> categoryBudgets;
}

class BudgetCategorySaveDraft {
  const BudgetCategorySaveDraft({
    required this.categoryId,
    required this.budgetedAmount,
    this.existingBudgetId,
    this.reservedAmount = 0,
    this.rolloverAmount = 0,
    this.notes,
  });

  final int categoryId;
  final int budgetedAmount;
  final int? existingBudgetId;
  final int reservedAmount;
  final int rolloverAmount;
  final String? notes;
}

class BudgetSaveRequest {
  const BudgetSaveRequest({
    required this.month,
    required this.expectedIncomeVnd,
    required this.categories,
    this.period,
  });

  final String month;
  final int expectedIncomeVnd;
  final BudgetPeriodSnapshot? period;
  final List<BudgetCategorySaveDraft> categories;
}

class JarMetric {
  const JarMetric({
    required this.key,
    required this.label,
    required this.planned,
    required this.spent,
    this.reserved = 0,
    required this.available,
    required this.color,
    required this.icon,
  });

  final String key;
  final String label;
  final int planned;
  final int spent;
  final int reserved;
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
    final available = _intFromJson(json['available_vnd'] ?? json['available']);
    final definition = jarDefinitions[key] ?? fallbackJarDefinition;

    return JarMetric(
      key: key,
      label: json['label'] as String? ?? definition.label,
      planned: planned,
      spent: spent,
      reserved: _intFromJson(
        json['reserved_vnd'] ?? json['reserved'] ?? json['committed'],
      ),
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

bool _boolFromJson(Object? value, {required bool defaultValue}) {
  if (value is bool) return value;
  if (value is num) return value != 0;
  if (value is String) {
    final normalized = value.trim().toLowerCase();
    if (normalized == 'true' || normalized == '1') return true;
    if (normalized == 'false' || normalized == '0') return false;
  }
  return defaultValue;
}
