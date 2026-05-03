import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../../data/models/money_models.dart';
import '../../../core/formatters.dart';
import '../../shell/app_state.dart';
import '../view_models/overview_view_model.dart';

enum _HeroMode { remaining, spent, savings }

class OverviewScreen extends StatefulWidget {
  const OverviewScreen({super.key});

  @override
  State<OverviewScreen> createState() => _OverviewScreenState();
}

class _OverviewScreenState extends State<OverviewScreen> {
  String? _lastMonth;
  _HeroMode _heroMode = _HeroMode.remaining;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final month = context.watch<AppState>().selectedMonth;
    if (_lastMonth != month) {
      _lastMonth = month;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (!mounted) return;
        context.read<OverviewViewModel>().load(month);
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<OverviewViewModel>(
      builder: (context, viewModel, _) {
        if (viewModel.isLoading && viewModel.data == null) {
          return const Center(child: CircularProgressIndicator());
        }
        if (viewModel.error != null && viewModel.data == null) {
          return Center(
            child: Text('Không tải được dữ liệu: ${viewModel.error}'),
          );
        }

        final data = viewModel.data;
        if (data == null) {
          return const SizedBox.shrink();
        }

        return RefreshIndicator(
          onRefresh: () => viewModel.load(data.budgetStatus.month),
          child: ListView(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 96),
            children: [
              _SyncRow(isRefreshing: viewModel.isLoading),
              const SizedBox(height: 12),
              _HeroCard(
                data: data,
                mode: _heroMode,
                onModeChanged: (mode) => setState(() => _heroMode = mode),
              ),
              const SizedBox(height: 14),
              _JarGrid(jars: data.budgetStatus.jars),
              const SizedBox(height: 18),
              _TopCategories(categories: data.topCategories),
              const SizedBox(height: 18),
              _RecentTransactions(
                transactions: data.summary.recentTransactions,
              ),
            ],
          ),
        );
      },
    );
  }
}

class _SyncRow extends StatelessWidget {
  const _SyncRow({required this.isRefreshing});

  final bool isRefreshing;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: Text(
            'Đồng bộ snapshot từ API',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: Theme.of(context).colorScheme.onSurfaceVariant,
            ),
          ),
        ),
        Icon(
          isRefreshing ? Icons.sync_rounded : Icons.sync_outlined,
          size: 16,
          color: Theme.of(context).colorScheme.primary,
        ),
        const SizedBox(width: 4),
        Text(
          isRefreshing ? 'Đang làm mới' : 'Làm mới',
          style: Theme.of(context).textTheme.labelMedium?.copyWith(
            color: Theme.of(context).colorScheme.primary,
            fontWeight: FontWeight.w700,
          ),
        ),
      ],
    );
  }
}

class _HeroCard extends StatelessWidget {
  const _HeroCard({
    required this.data,
    required this.mode,
    required this.onModeChanged,
  });

  final OverviewData data;
  final _HeroMode mode;
  final ValueChanged<_HeroMode> onModeChanged;

  @override
  Widget build(BuildContext context) {
    final status = data.budgetStatus;
    final expectedIncome = status.expectedIncomeVnd;
    final actualIncome = status.actualIncomeVnd;
    final savingsBase = actualIncome > 0 ? actualIncome : expectedIncome;
    final savingsRate = expectedIncome > 0
        ? (((savingsBase - status.totalSpent) / expectedIncome) * 100).round()
        : 0;
    final bigValue = switch (mode) {
      _HeroMode.remaining =>
        status.hasPeriod ? status.availableToSpend : status.accountBalanceVnd,
      _HeroMode.spent => status.totalSpent,
      _HeroMode.savings => savingsRate,
    };
    final label = switch (mode) {
      _HeroMode.remaining =>
        status.hasPeriod ? 'Còn chi được' : 'Số dư tài khoản',
      _HeroMode.spent => 'Đã chi tháng này',
      _HeroMode.savings => 'Tỷ lệ tiết kiệm',
    };

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _HeroToggle(mode: mode, onModeChanged: onModeChanged),
            const SizedBox(height: 14),
            Row(
              children: [
                Expanded(
                  child: Text(
                    label,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: Theme.of(context).colorScheme.onSurfaceVariant,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            FittedBox(
              fit: BoxFit.scaleDown,
              alignment: Alignment.centerLeft,
              child: Text(
                mode == _HeroMode.savings
                    ? '$bigValue%'
                    : formatCurrency(bigValue),
                maxLines: 1,
                style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                  fontSize: 38,
                  color:
                      mode == _HeroMode.remaining &&
                          status.hasPeriod &&
                          status.availableToSpend < 0
                      ? Colors.red.shade600
                      : Theme.of(context).colorScheme.onSurface,
                ),
              ),
            ),
            const SizedBox(height: 10),
            Text(
              status.hasPeriod
                  ? 'Kế hoạch đã lưu · Thực thu ${formatCompactCurrency(actualIncome)} · Chi ${formatCompactCurrency(status.totalSpent)}'
                  : 'Đang dùng Plan gợi ý ${formatCompactCurrency(expectedIncome)} · Thực thu ${formatCompactCurrency(actualIncome)} · Chi ${formatCompactCurrency(status.totalSpent)}',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: Theme.of(context).colorScheme.onSurfaceVariant,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _HeroToggle extends StatelessWidget {
  const _HeroToggle({required this.mode, required this.onModeChanged});

  final _HeroMode mode;
  final ValueChanged<_HeroMode> onModeChanged;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(3),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        children: [
          _ToggleButton(
            label: 'Còn lại',
            selected: mode == _HeroMode.remaining,
            onTap: () => onModeChanged(_HeroMode.remaining),
          ),
          _ToggleButton(
            label: 'Đã chi',
            selected: mode == _HeroMode.spent,
            onTap: () => onModeChanged(_HeroMode.spent),
          ),
          _ToggleButton(
            label: 'Tiết kiệm',
            selected: mode == _HeroMode.savings,
            onTap: () => onModeChanged(_HeroMode.savings),
          ),
        ],
      ),
    );
  }
}

class _ToggleButton extends StatelessWidget {
  const _ToggleButton({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: InkWell(
        borderRadius: BorderRadius.circular(999),
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 150),
          padding: const EdgeInsets.symmetric(vertical: 7),
          decoration: BoxDecoration(
            color: selected ? Theme.of(context).cardColor : Colors.transparent,
            borderRadius: BorderRadius.circular(999),
          ),
          child: Text(
            label,
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
              color: selected
                  ? Theme.of(context).colorScheme.onSurface
                  : Theme.of(context).colorScheme.onSurfaceVariant,
              fontWeight: FontWeight.w800,
            ),
          ),
        ),
      ),
    );
  }
}

class _JarGrid extends StatelessWidget {
  const _JarGrid({required this.jars});

  final List<JarMetric> jars;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              '6 hũ tháng này',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 12),
            LayoutBuilder(
              builder: (context, constraints) {
                final crossAxisCount = constraints.maxWidth >= 520 ? 3 : 2;
                return GridView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: jars.length,
                  gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: crossAxisCount,
                    crossAxisSpacing: 10,
                    mainAxisSpacing: 10,
                    mainAxisExtent: 126,
                  ),
                  itemBuilder: (context, index) {
                    return _JarTile(jar: jars[index]);
                  },
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}

class _JarTile extends StatelessWidget {
  const _JarTile({required this.jar});

  final JarMetric jar;

  @override
  Widget build(BuildContext context) {
    final statusColor = jar.isOver
        ? Colors.red
        : jar.isWarning
        ? Colors.orange
        : Colors.green;

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Theme.of(
          context,
        ).colorScheme.surfaceContainerHighest.withValues(alpha: 0.45),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: Theme.of(context).dividerColor.withValues(alpha: 0.25),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 30,
                height: 30,
                decoration: BoxDecoration(
                  color: jar.color.withValues(alpha: 0.14),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(jar.icon, color: jar.color, size: 18),
              ),
              const SizedBox(width: 8),
              Text(
                jar.key,
                style: Theme.of(
                  context,
                ).textTheme.labelLarge?.copyWith(fontWeight: FontWeight.w800),
              ),
            ],
          ),
          const Spacer(),
          Text(
            '${formatCompactCurrency(jar.spent)} / ${formatCompactCurrency(jar.planned)}',
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: Theme.of(context).textTheme.labelLarge,
          ),
          const SizedBox(height: 8),
          ClipRRect(
            borderRadius: BorderRadius.circular(999),
            child: LinearProgressIndicator(
              minHeight: 6,
              value: (jar.usagePct.clamp(0, 100)) / 100,
              backgroundColor: Theme.of(context).colorScheme.surface,
              color: jar.isOver ? Colors.red : jar.color,
            ),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Container(
                width: 7,
                height: 7,
                decoration: BoxDecoration(
                  color: statusColor,
                  shape: BoxShape.circle,
                ),
              ),
              const SizedBox(width: 5),
              Expanded(
                child: Text(
                  jar.available < 0
                      ? 'vượt ${formatCompactCurrency(jar.available.abs())}'
                      : 'còn ${formatCompactCurrency(jar.available)}',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _TopCategories extends StatelessWidget {
  const _TopCategories({required this.categories});

  final List<TopCategory> categories;

  @override
  Widget build(BuildContext context) {
    if (categories.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const _SectionHeader(title: 'Top ăn tiền', action: 'Xem hết →'),
        Card(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
            child: Column(
              children: [
                for (final category in categories)
                  _TopCategoryRow(category: category),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _TopCategoryRow extends StatelessWidget {
  const _TopCategoryRow({required this.category});

  final TopCategory category;

  @override
  Widget build(BuildContext context) {
    final jar = jarDefinitions[category.jarKey] ?? fallbackJarDefinition;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 10),
      child: Row(
        children: [
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(color: jar.color, shape: BoxShape.circle),
            child: Icon(jar.icon, size: 16, color: Colors.white),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        category.label,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                    Text(
                      '-${formatCurrency(category.amountVnd)}',
                      style: Theme.of(context).textTheme.labelLarge?.copyWith(
                        color: Theme.of(context).colorScheme.onSurface,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                ClipRRect(
                  borderRadius: BorderRadius.circular(999),
                  child: LinearProgressIndicator(
                    minHeight: 5,
                    value: category.percent.clamp(0, 100) / 100,
                    backgroundColor: Theme.of(
                      context,
                    ).colorScheme.surfaceContainerHighest,
                    color: jar.color,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _RecentTransactions extends StatelessWidget {
  const _RecentTransactions({required this.transactions});

  final List<Transaction> transactions;

  @override
  Widget build(BuildContext context) {
    final grouped = <String, List<Transaction>>{};
    for (final transaction in transactions) {
      final key =
          '${transaction.dayLabel ?? 'Khác'} · ${transaction.date ?? ''}';
      grouped.putIfAbsent(key, () => []).add(transaction);
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const _SectionHeader(title: 'Gần đây', action: 'Xem tất cả →'),
        const SizedBox(height: 12),
        Card(
          child: ClipRRect(
            borderRadius: BorderRadius.circular(20),
            child: Column(
              children: [
                for (final entry in grouped.entries) ...[
                  _DateHeader(label: entry.key, transactions: entry.value),
                  for (final transaction in entry.value)
                    _TransactionTile(transaction: transaction),
                ],
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({required this.title, required this.action});

  final String title;
  final String action;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 4),
      child: Row(
        children: [
          Expanded(
            child: Text(
              title.toUpperCase(),
              style: Theme.of(context).textTheme.labelMedium?.copyWith(
                color: Theme.of(context).colorScheme.onSurfaceVariant,
                fontWeight: FontWeight.w800,
                letterSpacing: 0.7,
              ),
            ),
          ),
          Text(
            action,
            style: Theme.of(context).textTheme.labelMedium?.copyWith(
              color: Theme.of(context).colorScheme.primary,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}

class _DateHeader extends StatelessWidget {
  const _DateHeader({required this.label, required this.transactions});

  final String label;
  final List<Transaction> transactions;

  @override
  Widget build(BuildContext context) {
    final total = transactions.fold<int>(0, (sum, tx) {
      return sum +
          (tx.flow == TransactionFlow.income ? tx.amountVnd : -tx.amountVnd);
    });

    return Container(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
      color: Theme.of(context).cardColor,
      child: Row(
        children: [
          Expanded(
            child: Text(
              label,
              style: Theme.of(context).textTheme.labelMedium?.copyWith(
                color: Theme.of(context).colorScheme.onSurfaceVariant,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
          Text(
            total >= 0
                ? '+${formatCompactCurrency(total)}'
                : '-${formatCompactCurrency(total.abs())}',
            style: Theme.of(context).textTheme.labelMedium?.copyWith(
              color: Theme.of(context).colorScheme.onSurfaceVariant,
              fontWeight: FontWeight.w800,
            ),
          ),
        ],
      ),
    );
  }
}

class _TransactionTile extends StatelessWidget {
  const _TransactionTile({required this.transaction});

  final Transaction transaction;

  @override
  Widget build(BuildContext context) {
    final isIncome = transaction.flow == TransactionFlow.income;
    final color = isIncome ? Colors.green : Colors.orange;

    return DecoratedBox(
      decoration: BoxDecoration(
        border: Border(
          bottom: BorderSide(
            color: Theme.of(context).dividerColor.withValues(alpha: 0.18),
          ),
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Row(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.13),
                shape: BoxShape.circle,
              ),
              child: Icon(
                isIncome
                    ? Icons.arrow_upward_rounded
                    : Icons.arrow_downward_rounded,
                color: color.shade700,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    transaction.description ?? transaction.category ?? '-',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(context).textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 3),
                  Text(
                    '${transaction.time ?? '--:--'} · ${transaction.date ?? ''}',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: Theme.of(context).colorScheme.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 10),
            Text(
              formatSignedAmount(transaction.amountVnd, transaction.flow),
              style: Theme.of(context).textTheme.labelLarge?.copyWith(
                color: isIncome
                    ? Colors.green.shade700
                    : Theme.of(context).colorScheme.onSurface,
                fontWeight: FontWeight.w800,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
