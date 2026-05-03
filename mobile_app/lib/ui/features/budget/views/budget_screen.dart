import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../../data/models/money_models.dart';
import '../../../../data/repositories/money_repository.dart';
import '../../../core/formatters.dart';
import '../../../core/months.dart';

class BudgetScreen extends StatefulWidget {
  const BudgetScreen({super.key, required this.data, required this.onRefresh});

  final OverviewData data;
  final Future<void> Function() onRefresh;

  @override
  State<BudgetScreen> createState() => _BudgetScreenState();
}

class _BudgetScreenState extends State<BudgetScreen> {
  BudgetEditorSeed? _editorSeed;
  Object? _editorError;
  bool _isLoadingEditor = false;
  bool _isSaving = false;
  int _expectedIncomeDraft = 0;
  int _baselineExpectedIncome = 0;
  Map<String, int> _baselineBudgetByKey = const {};
  List<_EditableBudgetCategory> _draftCategories = const [];

  @override
  void initState() {
    super.initState();
    _applyDraftComposition(null, widget.data);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      _loadEditor();
    });
  }

  @override
  void didUpdateWidget(covariant BudgetScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    final oldMonth = oldWidget.data.budgetStatus.month;
    final currentMonth = widget.data.budgetStatus.month;
    if (oldMonth != currentMonth) {
      _applyDraftComposition(null, widget.data);
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (!mounted) return;
        _loadEditor();
      });
      return;
    }

    final didStatusChange =
        oldWidget.data.budgetStatus.totalSpent !=
            widget.data.budgetStatus.totalSpent ||
        oldWidget.data.budgetStatus.expectedIncomeVnd !=
            widget.data.budgetStatus.expectedIncomeVnd ||
        oldWidget.data.budgetStatus.categories.length !=
            widget.data.budgetStatus.categories.length ||
        oldWidget.data.budgetStatus.periodStatus !=
            widget.data.budgetStatus.periodStatus;

    if (didStatusChange && !_hasUnsavedChanges && !_isSaving) {
      setState(() {
        _applyDraftComposition(_editorSeed, widget.data);
      });
    }
  }

  bool get _hasUnsavedChanges {
    if (_expectedIncomeDraft != _baselineExpectedIncome) {
      return true;
    }
    if (_draftCategories.length != _baselineBudgetByKey.length) {
      return true;
    }

    for (final category in _draftCategories) {
      if (_baselineBudgetByKey[category.storageKey] !=
          category.budgetedAmount) {
        return true;
      }
    }

    return false;
  }

  bool get _canEdit {
    final periodStatus = _editorSeed?.period?.status;
    return _editorSeed != null && !_isLoadingEditor && periodStatus != 'closed';
  }

  Future<void> _loadEditor({bool showLoading = true}) async {
    if (showLoading) {
      setState(() {
        _isLoadingEditor = true;
        _editorError = null;
      });
    } else {
      setState(() {
        _isLoadingEditor = true;
      });
    }

    try {
      final seed = await context.read<MoneyRepository>().fetchBudgetEditorSeed(
        widget.data.budgetStatus.month,
      );
      if (!mounted) return;

      setState(() {
        _editorSeed = seed;
        _editorError = null;
        _isLoadingEditor = false;
        _applyDraftComposition(seed, widget.data);
      });
    } catch (error) {
      if (!mounted) return;

      setState(() {
        _editorError = error;
        _isLoadingEditor = false;
      });
    }
  }

  Future<void> _refreshScreen() async {
    if (_hasUnsavedChanges) {
      await widget.onRefresh();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'Đã giữ draft chưa lưu. Bấm Lưu để ghi thay đổi vào budget.',
          ),
        ),
      );
      return;
    }

    await Future.wait([widget.onRefresh(), _loadEditor(showLoading: false)]);
  }

  Future<void> _editExpectedIncome() async {
    if (!_canEdit) return;

    final nextValue = await _showMoneyEditor(
      title: 'Thu nhập dự kiến',
      subtitle:
          'Số này sẽ dùng để tạo hoặc cập nhật kỳ ngân sách của ${compactMonthLabel(widget.data.budgetStatus.month)}.',
      initialValue: _expectedIncomeDraft,
      confirmLabel: 'Cập nhật draft',
    );
    if (nextValue == null || !mounted) return;

    setState(() {
      _expectedIncomeDraft = nextValue;
    });
  }

  Future<void> _editCategory(_EditableBudgetCategory category) async {
    if (!_canEdit || category.categoryId <= 0) {
      return;
    }

    final nextValue = await _showMoneyEditor(
      title: category.name,
      subtitle:
          'Đã chi ${formatCurrency(category.spentVnd)} · Reserved ${formatCurrency(category.reservedVnd)}',
      initialValue: category.budgetedAmount,
      confirmLabel: 'Cập nhật category',
    );
    if (nextValue == null || !mounted) return;

    setState(() {
      _draftCategories = _draftCategories
          .map(
            (item) => item.storageKey == category.storageKey
                ? item.copyWith(budgetedAmount: nextValue)
                : item,
          )
          .toList();
    });
  }

  void _resetDrafts() {
    setState(() {
      _applyDraftComposition(_editorSeed, widget.data);
    });
  }

  Future<void> _saveBudget() async {
    if (!_canEdit || _isSaving || _editorSeed == null) {
      return;
    }

    setState(() {
      _isSaving = true;
    });

    try {
      final savedSeed = await context.read<MoneyRepository>().saveBudget(
        BudgetSaveRequest(
          month: widget.data.budgetStatus.month,
          expectedIncomeVnd: _expectedIncomeDraft,
          period: _editorSeed?.period,
          categories: _draftCategories
              .where((category) => category.categoryId > 0)
              .map(
                (category) => BudgetCategorySaveDraft(
                  categoryId: category.categoryId,
                  existingBudgetId: category.existingBudgetId,
                  budgetedAmount: category.budgetedAmount,
                  reservedAmount: category.reservedVnd,
                  rolloverAmount: category.rolloverAmount,
                  notes: category.notes,
                ),
              )
              .toList(),
        ),
      );
      if (!mounted) return;

      setState(() {
        _editorSeed = savedSeed;
        _editorError = null;
        _applyDraftComposition(savedSeed, widget.data);
        _isSaving = false;
      });

      await widget.onRefresh();
      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Đã lưu kế hoạch chi tiêu trên APK.')),
      );
    } catch (error) {
      if (!mounted) return;

      setState(() {
        _isSaving = false;
      });

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            error is Error || error is Exception
                ? error.toString()
                : 'Không thể lưu budget trên APK.',
          ),
        ),
      );
    }
  }

  Future<int?> _showMoneyEditor({
    required String title,
    required String subtitle,
    required int initialValue,
    required String confirmLabel,
  }) async {
    final controller = TextEditingController(
      text: initialValue > 0 ? initialValue.toString() : '',
    );

    final result = await showModalBottomSheet<int>(
      context: context,
      useSafeArea: true,
      isScrollControlled: true,
      builder: (context) {
        String? errorText;

        return StatefulBuilder(
          builder: (context, setModalState) {
            void submit() {
              final value = _readMoneyInput(controller.text);
              if (value < 0) {
                setModalState(() {
                  errorText = 'Số tiền phải lớn hơn hoặc bằng 0.';
                });
                return;
              }
              Navigator.of(context).pop(value);
            }

            return Padding(
              padding: EdgeInsets.fromLTRB(
                16,
                16,
                16,
                MediaQuery.of(context).viewInsets.bottom + 16,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    subtitle,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: Theme.of(context).colorScheme.onSurfaceVariant,
                    ),
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: controller,
                    autofocus: true,
                    keyboardType: const TextInputType.numberWithOptions(),
                    decoration: const InputDecoration(
                      labelText: 'Số tiền',
                      hintText: 'VD: 700000',
                      border: OutlineInputBorder(),
                    ),
                    onSubmitted: (_) => submit(),
                  ),
                  if (errorText != null) ...[
                    const SizedBox(height: 8),
                    Text(
                      errorText!,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Colors.red.shade600,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          onPressed: () => Navigator.of(context).pop(),
                          child: const Text('Hủy'),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: FilledButton(
                          onPressed: submit,
                          child: Text(confirmLabel),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            );
          },
        );
      },
    );

    controller.dispose();
    return result;
  }

  void _applyDraftComposition(BudgetEditorSeed? seed, OverviewData data) {
    final definitionsById = {
      for (final category
          in seed?.categories ?? const <BudgetCategoryDefinition>[])
        category.id: category,
    };
    final definitionsByKey = {
      for (final category
          in seed?.categories ?? const <BudgetCategoryDefinition>[])
        category.key: category,
    };
    final budgetsByKey = {
      for (final budget
          in seed?.categoryBudgets ?? const <CategoryBudgetRecord>[])
        _budgetStorageKey(budget, definitionsById): budget,
    };
    final metricsByKey = {
      for (final metric in data.budgetStatus.categories)
        _metricStorageKey(metric): metric,
    };

    final allKeys = <String>{
      ...definitionsByKey.keys,
      ...budgetsByKey.keys,
      ...metricsByKey.keys,
    };

    final categories =
        allKeys
            .map((storageKey) {
              final metric = metricsByKey[storageKey];
              final budget = budgetsByKey[storageKey];
              final definition =
                  definitionsByKey[storageKey] ??
                  (budget != null ? definitionsById[budget.categoryId] : null);

              final key =
                  definition?.key ??
                  metric?.key ??
                  budget?.categoryKey ??
                  storageKey;
              final name =
                  definition?.name ??
                  metric?.name ??
                  budget?.categoryName ??
                  key;
              if (name.isEmpty) {
                return null;
              }

              return _EditableBudgetCategory(
                storageKey: storageKey,
                categoryId: definition?.id ?? budget?.categoryId ?? 0,
                existingBudgetId: budget?.id,
                key: key,
                name: name,
                group: definition?.group ?? metric?.group,
                sortOrder: definition?.sortOrder ?? 9999,
                budgetedAmount:
                    budget?.budgetedAmount ?? metric?.budgetedVnd ?? 0,
                spentVnd: metric?.spentVnd ?? 0,
                reservedVnd: budget?.reservedAmount ?? metric?.reservedVnd ?? 0,
                rolloverAmount: budget?.rolloverAmount ?? 0,
                notes: budget?.notes,
              );
            })
            .whereType<_EditableBudgetCategory>()
            .toList()
          ..sort((left, right) {
            final order = left.sortOrder.compareTo(right.sortOrder);
            if (order != 0) return order;
            return left.name.compareTo(right.name);
          });

    _draftCategories = categories;
    _expectedIncomeDraft =
        seed?.period?.totalIncome ?? data.budgetStatus.expectedIncomeVnd;
    _baselineExpectedIncome = _expectedIncomeDraft;
    _baselineBudgetByKey = {
      for (final category in categories)
        category.storageKey: category.budgetedAmount,
    };
  }

  @override
  Widget build(BuildContext context) {
    final status = widget.data.budgetStatus;
    final monthLabel = compactMonthLabel(status.month);
    final hasPreviewPlan = _editorSeed?.period == null;
    final totalPlanned = _draftCategories.fold<int>(
      0,
      (sum, category) => sum + category.budgetedAmount,
    );
    final totalRemaining = _draftCategories.fold<int>(
      0,
      (sum, category) => sum + category.remainingVnd,
    );
    final summaryCardWidth =
        (((MediaQuery.sizeOf(context).width - 44) / 2).clamp(
          148.0,
          220.0,
        )).toDouble();

    return RefreshIndicator(
      onRefresh: _refreshScreen,
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 96),
        children: [
          _BudgetHeader(monthLabel: monthLabel, hasPreviewPlan: hasPreviewPlan),
          const SizedBox(height: 14),
          _EditorActionCard(
            expectedIncomeDraft: _expectedIncomeDraft,
            hasUnsavedChanges: _hasUnsavedChanges,
            isSaving: _isSaving,
            canEdit: _canEdit,
            periodStatus: _editorSeed?.period?.status,
            onEditExpectedIncome: _editExpectedIncome,
            onReset: _hasUnsavedChanges ? _resetDrafts : null,
            onSave: _hasUnsavedChanges ? _saveBudget : null,
          ),
          const SizedBox(height: 14),
          _PlannerNoticeCard(
            hasPreviewPlan: hasPreviewPlan,
            isLoadingEditor: _isLoadingEditor,
            canEdit: _canEdit,
            periodStatus: _editorSeed?.period?.status,
            errorText: _editorError?.toString(),
            onRetry: _loadEditor,
          ),
          const SizedBox(height: 14),
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: [
              _SummaryCard(
                width: summaryCardWidth,
                title: 'Thu nhập dự kiến',
                value: formatCompactCurrency(_expectedIncomeDraft),
                subtitle: 'Base để save budget tháng này',
                icon: Icons.account_balance_wallet_outlined,
                tone: Colors.blue,
              ),
              _SummaryCard(
                width: summaryCardWidth,
                title: hasPreviewPlan ? 'Draft category' : 'Đã phân bổ',
                value: formatCompactCurrency(totalPlanned),
                subtitle: hasPreviewPlan
                    ? 'Sẽ tạo period khi bấm lưu'
                    : 'Lấy từ category budget đã lưu',
                icon: Icons.stacked_bar_chart_rounded,
                tone: Colors.green,
              ),
              _SummaryCard(
                width: summaryCardWidth,
                title: 'Đã chi thực tế',
                value: formatCompactCurrency(status.totalSpent),
                subtitle: _expectedIncomeDraft > 0
                    ? '${((status.totalSpent / _expectedIncomeDraft) * 100).round()}% trên draft hiện tại'
                    : 'Chưa có income draft',
                icon: Icons.trending_down_rounded,
                tone: Colors.red,
              ),
              _SummaryCard(
                width: summaryCardWidth,
                title: 'Dư tổng category',
                value: formatCompactCurrency(totalRemaining),
                subtitle: totalRemaining >= 0
                    ? 'Cộng dồn còn của từng category'
                    : 'Draft hiện tại đang thiếu',
                icon: Icons.savings_outlined,
                tone: totalRemaining >= 0 ? Colors.teal : Colors.red,
              ),
            ],
          ),
          const SizedBox(height: 16),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Text(
                'Thực thu tháng này: ${formatCurrency(status.actualIncomeVnd)}. APK giờ có thể chỉnh từng category budget và lưu trực tiếp; riêng import JSON chi tiết vẫn đang đầy đủ nhất ở web.',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
              ),
            ),
          ),
          const SizedBox(height: 18),
          _SectionHeader(
            title: 'Category budget',
            subtitle:
                'Chạm Sửa để đổi budget của từng danh mục, rồi bấm Lưu budget ở trên.',
            badge: hasPreviewPlan ? 'Chưa lưu' : 'Đã đồng bộ',
          ),
          const SizedBox(height: 12),
          if (_draftCategories.isEmpty)
            const _EmptyBudgetCard()
          else
            ..._draftCategories.map(
              (category) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: _CategoryBudgetCard(
                  category: category,
                  expectedIncome: _expectedIncomeDraft,
                  isEditable: _canEdit && category.categoryId > 0,
                  onEdit: () => _editCategory(category),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _EditableBudgetCategory {
  const _EditableBudgetCategory({
    required this.storageKey,
    required this.categoryId,
    required this.existingBudgetId,
    required this.key,
    required this.name,
    required this.group,
    required this.sortOrder,
    required this.budgetedAmount,
    required this.spentVnd,
    required this.reservedVnd,
    required this.rolloverAmount,
    required this.notes,
  });

  final String storageKey;
  final int categoryId;
  final int? existingBudgetId;
  final String key;
  final String name;
  final String? group;
  final int sortOrder;
  final int budgetedAmount;
  final int spentVnd;
  final int reservedVnd;
  final int rolloverAmount;
  final String? notes;

  int get remainingVnd =>
      budgetedAmount - spentVnd - reservedVnd + rolloverAmount;

  int get usagePct {
    if (budgetedAmount <= 0) {
      return spentVnd > 0 ? 100 : 0;
    }

    return ((spentVnd / budgetedAmount) * 100).round().clamp(0, 999);
  }

  String get status {
    if (remainingVnd < 0) {
      return 'OVER';
    }
    if (usagePct >= 80) {
      return 'WARN';
    }
    return 'OK';
  }

  _EditableBudgetCategory copyWith({int? budgetedAmount}) {
    return _EditableBudgetCategory(
      storageKey: storageKey,
      categoryId: categoryId,
      existingBudgetId: existingBudgetId,
      key: key,
      name: name,
      group: group,
      sortOrder: sortOrder,
      budgetedAmount: budgetedAmount ?? this.budgetedAmount,
      spentVnd: spentVnd,
      reservedVnd: reservedVnd,
      rolloverAmount: rolloverAmount,
      notes: notes,
    );
  }
}

class _BudgetHeader extends StatelessWidget {
  const _BudgetHeader({required this.monthLabel, required this.hasPreviewPlan});

  final String monthLabel;
  final bool hasPreviewPlan;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Chi tiêu · $monthLabel',
          style: Theme.of(
            context,
          ).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w800),
        ),
        const SizedBox(height: 4),
        Text(
          hasPreviewPlan
              ? 'Draft trên APK đang bám plan gợi ý cho đến khi bạn bấm lưu.'
              : 'APK đã có thể chỉnh category budget và lưu trực tiếp như web ở phần cốt lõi.',
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
            color: Theme.of(context).colorScheme.onSurfaceVariant,
          ),
        ),
      ],
    );
  }
}

class _EditorActionCard extends StatelessWidget {
  const _EditorActionCard({
    required this.expectedIncomeDraft,
    required this.hasUnsavedChanges,
    required this.isSaving,
    required this.canEdit,
    required this.periodStatus,
    required this.onEditExpectedIncome,
    required this.onReset,
    required this.onSave,
  });

  final int expectedIncomeDraft;
  final bool hasUnsavedChanges;
  final bool isSaving;
  final bool canEdit;
  final String? periodStatus;
  final VoidCallback onEditExpectedIncome;
  final VoidCallback? onReset;
  final VoidCallback? onSave;

  @override
  Widget build(BuildContext context) {
    final statusText = switch (periodStatus) {
      'closed' => 'Kỳ đã đóng',
      'open' => 'Kỳ đang mở',
      _ => 'Chưa có kỳ lưu',
    };

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Thu nhập dự kiến',
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        formatCurrency(expectedIncomeDraft),
                        style: Theme.of(context).textTheme.headlineSmall
                            ?.copyWith(fontWeight: FontWeight.w800),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: Theme.of(
                      context,
                    ).colorScheme.surfaceContainerHighest,
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Text(
                    statusText,
                    style: Theme.of(context).textTheme.labelMedium?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              'Thay đổi thu nhập dự kiến sẽ được ghi vào budget period cùng lúc với category budgets.',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: Theme.of(context).colorScheme.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: canEdit ? onEditExpectedIncome : null,
                    icon: const Icon(Icons.edit_outlined),
                    label: const Text('Sửa thu nhập'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: hasUnsavedChanges ? onReset : null,
                    icon: const Icon(Icons.undo_rounded),
                    label: const Text('Reset draft'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: FilledButton.icon(
                    onPressed: canEdit && hasUnsavedChanges && !isSaving
                        ? onSave
                        : null,
                    icon: isSaving
                        ? const SizedBox(
                            width: 16,
                            height: 16,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Icon(Icons.save_outlined),
                    label: Text(isSaving ? 'Đang lưu...' : 'Lưu budget'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _PlannerNoticeCard extends StatelessWidget {
  const _PlannerNoticeCard({
    required this.hasPreviewPlan,
    required this.isLoadingEditor,
    required this.canEdit,
    required this.periodStatus,
    required this.errorText,
    required this.onRetry,
  });

  final bool hasPreviewPlan;
  final bool isLoadingEditor;
  final bool canEdit;
  final String? periodStatus;
  final String? errorText;
  final Future<void> Function() onRetry;

  @override
  Widget build(BuildContext context) {
    if (isLoadingEditor) {
      return const Card(
        child: Padding(
          padding: EdgeInsets.all(16),
          child: Row(
            children: [
              SizedBox(
                width: 18,
                height: 18,
                child: CircularProgressIndicator(strokeWidth: 2),
              ),
              SizedBox(width: 12),
              Expanded(
                child: Text(
                  'Đang tải metadata để map category với API save...',
                ),
              ),
            ],
          ),
        ),
      );
    }

    if (errorText != null) {
      return Card(
        color: Colors.red.withValues(alpha: 0.08),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(Icons.error_outline, color: Colors.red.shade600),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Không tải được editor budget',
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                errorText!,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
              ),
              const SizedBox(height: 12),
              FilledButton.icon(
                onPressed: () => onRetry(),
                icon: const Icon(Icons.refresh_rounded),
                label: const Text('Thử lại'),
              ),
            ],
          ),
        ),
      );
    }

    if (periodStatus == 'closed') {
      return Card(
        color: Colors.blueGrey.withValues(alpha: 0.08),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Text(
            'Tháng này đã đóng nên APK chỉ còn chế độ xem. Muốn sửa tiếp thì cần mở một kỳ khác hoặc thao tác lại từ web/backend.',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: Theme.of(context).colorScheme.onSurfaceVariant,
            ),
          ),
        ),
      );
    }

    return Card(
      color: (hasPreviewPlan ? Colors.amber : Colors.green).withValues(
        alpha: 0.08,
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(
              hasPreviewPlan
                  ? Icons.warning_amber_rounded
                  : Icons.check_circle_outline,
              color: hasPreviewPlan
                  ? Colors.amber.shade700
                  : Colors.green.shade700,
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                hasPreviewPlan
                    ? 'Bạn đang chỉnh draft category budget trên APK. Bấm Lưu budget để tạo budget period và ghi category budgets thật.'
                    : canEdit
                    ? 'APK đang nối trực tiếp vào budget period hiện có. Bạn có thể sửa category và lưu ngay trên máy.'
                    : 'Editor đang tạm khóa cho kỳ này.',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SummaryCard extends StatelessWidget {
  const _SummaryCard({
    required this.width,
    required this.title,
    required this.value,
    required this.subtitle,
    required this.icon,
    required this.tone,
  });

  final double width;
  final String title;
  final String value;
  final String subtitle;
  final IconData icon;
  final Color tone;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: width,
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 38,
                height: 38,
                decoration: BoxDecoration(
                  color: tone.withValues(alpha: 0.14),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, color: tone),
              ),
              const SizedBox(height: 14),
              Text(
                title,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                value,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: Theme.of(
                  context,
                ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: 6),
              Text(
                subtitle,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({
    required this.title,
    required this.subtitle,
    required this.badge,
  });

  final String title;
  final String subtitle;
  final String badge;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 4),
              Text(
                subtitle,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(width: 10),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            color: Colors.blue.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(999),
          ),
          child: Text(
            badge,
            style: Theme.of(context).textTheme.labelMedium?.copyWith(
              color: Colors.blue.shade700,
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
      ],
    );
  }
}

class _CategoryBudgetCard extends StatelessWidget {
  const _CategoryBudgetCard({
    required this.category,
    required this.expectedIncome,
    required this.isEditable,
    required this.onEdit,
  });

  final _EditableBudgetCategory category;
  final int expectedIncome;
  final bool isEditable;
  final VoidCallback onEdit;

  @override
  Widget build(BuildContext context) {
    final usage = (category.usagePct.clamp(0, 100) / 100).toDouble();
    final budgetShare = expectedIncome > 0
        ? ((category.budgetedAmount / expectedIncome) * 100)
        : 0.0;
    final statusColor = switch (category.status) {
      'OVER' => Colors.red.shade600,
      'WARN' => Colors.orange.shade600,
      _ => Colors.green.shade600,
    };

    return Card(
      child: InkWell(
        onTap: isEditable ? onEdit : null,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          category.name,
                          style: Theme.of(context).textTheme.titleMedium,
                        ),
                        const SizedBox(height: 2),
                        Text(
                          category.group ?? category.key,
                          style: Theme.of(context).textTheme.bodySmall
                              ?.copyWith(
                                color: Theme.of(
                                  context,
                                ).colorScheme.onSurfaceVariant,
                              ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 10),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: statusColor.withValues(alpha: 0.14),
                          borderRadius: BorderRadius.circular(999),
                        ),
                        child: Text(
                          category.status,
                          style: Theme.of(context).textTheme.labelMedium
                              ?.copyWith(
                                color: statusColor,
                                fontWeight: FontWeight.w800,
                              ),
                        ),
                      ),
                      const SizedBox(height: 8),
                      if (isEditable)
                        Text(
                          'Sửa',
                          style: Theme.of(context).textTheme.labelMedium
                              ?.copyWith(
                                color: Theme.of(context).colorScheme.primary,
                                fontWeight: FontWeight.w700,
                              ),
                        ),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 14),
              ClipRRect(
                borderRadius: BorderRadius.circular(999),
                child: LinearProgressIndicator(
                  minHeight: 8,
                  value: usage,
                  backgroundColor: Theme.of(
                    context,
                  ).colorScheme.surfaceContainerHighest,
                  color: category.remainingVnd >= 0
                      ? Colors.blue.shade600
                      : Colors.red.shade600,
                ),
              ),
              const SizedBox(height: 14),
              Row(
                children: [
                  Expanded(
                    child: _MetricCell(
                      label: 'Budget',
                      value: formatCompactCurrency(category.budgetedAmount),
                    ),
                  ),
                  Expanded(
                    child: _MetricCell(
                      label: 'Đã chi',
                      value: formatCompactCurrency(category.spentVnd),
                      valueColor: Colors.red.shade600,
                    ),
                  ),
                  Expanded(
                    child: _MetricCell(
                      label: 'Còn',
                      value: formatCompactCurrency(category.remainingVnd),
                      valueColor: category.remainingVnd >= 0
                          ? Colors.green.shade600
                          : Colors.red.shade600,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Text(
                '${budgetShare.toStringAsFixed(budgetShare >= 10 ? 1 : 2)}% income · ${category.usagePct}% đã dùng${category.rolloverAmount != 0 ? ' · Carry ${formatCompactCurrency(category.rolloverAmount)}' : ''}',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _MetricCell extends StatelessWidget {
  const _MetricCell({
    required this.label,
    required this.value,
    this.valueColor,
  });

  final String label;
  final String value;
  final Color? valueColor;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
            color: Theme.of(context).colorScheme.onSurfaceVariant,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          value,
          style: Theme.of(context).textTheme.labelLarge?.copyWith(
            color: valueColor ?? Theme.of(context).colorScheme.onSurface,
            fontWeight: FontWeight.w800,
          ),
        ),
      ],
    );
  }
}

class _EmptyBudgetCard extends StatelessWidget {
  const _EmptyBudgetCard();

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            Icon(
              Icons.layers_clear_outlined,
              size: 40,
              color: Theme.of(context).colorScheme.primary,
            ),
            const SizedBox(height: 12),
            Text(
              'Chưa có category budget',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 8),
            Text(
              'Khi metadata categories tải xong, bạn sẽ thấy đầy đủ danh sách category để chỉnh và lưu ngay trên APK.',
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Theme.of(context).colorScheme.onSurfaceVariant,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

String _metricStorageKey(CategoryMetric metric) {
  return metric.key.isNotEmpty ? metric.key : metric.name;
}

String _budgetStorageKey(
  CategoryBudgetRecord budget,
  Map<int, BudgetCategoryDefinition> definitionsById,
) {
  if (budget.categoryKey.isNotEmpty) {
    return budget.categoryKey;
  }

  final definition = definitionsById[budget.categoryId];
  if (definition != null && definition.key.isNotEmpty) {
    return definition.key;
  }

  return 'id:${budget.categoryId}';
}

int _readMoneyInput(String value) {
  final normalized = value.replaceAll(RegExp(r'[^\d-]'), '');
  if (normalized.isEmpty || normalized == '-') {
    return 0;
  }
  return int.tryParse(normalized) ?? 0;
}
