import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../data/models/money_models.dart';
import '../../../data/repositories/money_repository.dart';
import '../../core/formatters.dart';
import '../../core/months.dart';
import '../overview/view_models/overview_view_model.dart';
import '../overview/views/overview_screen.dart';
import 'app_state.dart';
import 'quick_capture_sheet.dart';

class MoneyAppShell extends StatelessWidget {
  const MoneyAppShell({super.key});

  @override
  Widget build(BuildContext context) {
    final appState = context.watch<AppState>();

    return ChangeNotifierProvider(
      create: (context) =>
          OverviewViewModel(repository: context.read<MoneyRepository>())
            ..load(appState.selectedMonth),
      child: Builder(
        builder: (context) {
          return _OverviewDataSync(
            month: appState.selectedMonth,
            child: Scaffold(
              appBar: _MoneyTopBar(
                month: appState.selectedMonth,
                darkMode: appState.darkMode,
                onMonthChanged: appState.setMonth,
                onToggleDarkMode: appState.toggleDarkMode,
              ),
              body: SafeArea(
                top: false,
                child: _CurrentTabView(tab: appState.currentTab),
              ),
              floatingActionButton: FloatingActionButton(
                onPressed: () => _showQuickCaptureSheet(context),
                shape: const CircleBorder(),
                child: const Icon(Icons.add),
              ),
              floatingActionButtonLocation:
                  FloatingActionButtonLocation.centerDocked,
              bottomNavigationBar: const _BottomNavBar(),
            ),
          );
        },
      ),
    );
  }
}

void _showQuickCaptureSheet(BuildContext context) {
  showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    backgroundColor: Colors.transparent,
    builder: (_) => const QuickCaptureSheet(),
  );
}

class _OverviewDataSync extends StatefulWidget {
  const _OverviewDataSync({required this.month, required this.child});

  final String month;
  final Widget child;

  @override
  State<_OverviewDataSync> createState() => _OverviewDataSyncState();
}

class _OverviewDataSyncState extends State<_OverviewDataSync> {
  @override
  void didUpdateWidget(covariant _OverviewDataSync oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.month == widget.month) return;

    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      context.read<OverviewViewModel>().load(widget.month);
    });
  }

  @override
  Widget build(BuildContext context) => widget.child;
}

class _MoneyTopBar extends StatelessWidget implements PreferredSizeWidget {
  const _MoneyTopBar({
    required this.month,
    required this.darkMode,
    required this.onMonthChanged,
    required this.onToggleDarkMode,
  });

  final String month;
  final bool darkMode;
  final ValueChanged<String> onMonthChanged;
  final VoidCallback onToggleDarkMode;

  @override
  Size get preferredSize => const Size.fromHeight(64);

  @override
  Widget build(BuildContext context) {
    final months = getRecentMonths();

    return AppBar(
      titleSpacing: 16,
      title: Row(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: Image.asset(
              'assets/branding/money_tracker_logo.png',
              width: 34,
              height: 34,
              fit: BoxFit.cover,
            ),
          ),
          const SizedBox(width: 10),
          PopupMenuButton<String>(
            initialValue: month,
            onSelected: onMonthChanged,
            itemBuilder: (context) => [
              for (final item in months)
                PopupMenuItem(value: item, child: Text(formatMonthLabel(item))),
            ],
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  compactMonthLabel(month),
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(width: 4),
                const Icon(Icons.keyboard_arrow_down_rounded),
              ],
            ),
          ),
        ],
      ),
      actions: [
        IconButton(
          tooltip: 'Thông báo',
          onPressed: () {},
          icon: const Icon(Icons.notifications_none_rounded),
        ),
        IconButton(
          tooltip: darkMode ? 'Chế độ sáng' : 'Chế độ tối',
          onPressed: onToggleDarkMode,
          icon: Icon(
            darkMode ? Icons.light_mode_outlined : Icons.dark_mode_outlined,
          ),
        ),
        const SizedBox(width: 8),
      ],
    );
  }
}

class _CurrentTabView extends StatelessWidget {
  const _CurrentTabView({required this.tab});

  final AppTab tab;

  @override
  Widget build(BuildContext context) {
    return switch (tab) {
      AppTab.overview => const OverviewScreen(),
      AppTab.transactions => _OverviewDataView(
        builder: (context, data, onRefresh) => _TransactionsTab(
          data: data,
          onRefresh: onRefresh,
        ),
      ),
      AppTab.jars => _OverviewDataView(
        builder: (context, data, onRefresh) =>
            _JarsTab(data: data, onRefresh: onRefresh),
      ),
      AppTab.more => _OverviewDataView(
        builder: (context, data, onRefresh) => _MoreTab(
          data: data,
          onRefresh: onRefresh,
        ),
      ),
    };
  }
}

class _OverviewDataView extends StatelessWidget {
  const _OverviewDataView({required this.builder});

  final Widget Function(
    BuildContext context,
    OverviewData data,
    Future<void> Function() onRefresh,
  ) builder;

  @override
  Widget build(BuildContext context) {
    return Consumer<OverviewViewModel>(
      builder: (context, viewModel, _) {
        if (viewModel.isLoading && viewModel.data == null) {
          return const Center(child: CircularProgressIndicator());
        }

        if (viewModel.error != null && viewModel.data == null) {
          return _TabErrorState(
            message: 'Không tải được dữ liệu: ${viewModel.error}',
            onRetry: () => viewModel.load(context.read<AppState>().selectedMonth),
          );
        }

        final data = viewModel.data;
        if (data == null) {
          return const SizedBox.shrink();
        }

        return builder(
          context,
          data,
          () => viewModel.load(context.read<AppState>().selectedMonth),
        );
      },
    );
  }
}

class _TabErrorState extends StatelessWidget {
  const _TabErrorState({required this.message, required this.onRetry});

  final String message;
  final Future<void> Function() onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.cloud_off_rounded,
              size: 46,
              color: Theme.of(context).colorScheme.primary,
            ),
            const SizedBox(height: 16),
            Text(
              'Không tải được tab',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 8),
            Text(
              message,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            const SizedBox(height: 16),
            FilledButton.tonal(
              onPressed: onRetry,
              child: const Text('Thử lại'),
            ),
          ],
        ),
      ),
    );
  }
}

class _TransactionsTab extends StatelessWidget {
  const _TransactionsTab({required this.data, required this.onRefresh});

  final OverviewData data;
  final Future<void> Function() onRefresh;

  @override
  Widget build(BuildContext context) {
    final summary = data.summary;
    final transactions = summary.recentTransactions;

    return RefreshIndicator(
      onRefresh: onRefresh,
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 96),
        children: [
          const _TabHeader(
            icon: Icons.receipt_long_outlined,
            title: 'Giao dịch',
            subtitle: 'Các giao dịch gần nhất lấy trực tiếp từ API hiện tại.',
          ),
          const SizedBox(height: 14),
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: [
              _StatCard(
                icon: Icons.arrow_downward_rounded,
                label: 'Chi',
                value: formatCompactCurrency(summary.expenseVnd),
                tone: Colors.orange,
              ),
              _StatCard(
                icon: Icons.arrow_upward_rounded,
                label: 'Thu',
                value: formatCompactCurrency(summary.incomeVnd),
                tone: Colors.green,
              ),
              _StatCard(
                icon: Icons.account_balance_wallet_outlined,
                label: 'Ròng',
                value: formatCompactCurrency(summary.netVnd),
                tone: summary.netVnd >= 0 ? Colors.blue : Colors.red,
              ),
            ],
          ),
          const SizedBox(height: 18),
          if (transactions.isEmpty)
            const _EmptyCard(
              icon: Icons.inbox_outlined,
              title: 'Chưa có giao dịch',
              message: 'Kéo xuống để làm mới khi tháng này bắt đầu có dữ liệu.',
            )
          else
            ...transactions.map((transaction) {
              return Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: _TransactionCard(transaction: transaction),
              );
            }),
        ],
      ),
    );
  }
}

class _JarsTab extends StatelessWidget {
  const _JarsTab({required this.data, required this.onRefresh});

  final OverviewData data;
  final Future<void> Function() onRefresh;

  @override
  Widget build(BuildContext context) {
    final jars = data.budgetStatus.jars;
    final totalPlanned = jars.fold<int>(0, (sum, jar) => sum + jar.planned);

    return RefreshIndicator(
      onRefresh: onRefresh,
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 96),
        children: [
          const _TabHeader(
            icon: Icons.account_balance_wallet_outlined,
            title: 'Hũ',
            subtitle: 'Toàn bộ 6 hũ đang dùng trong tháng hiện tại.',
          ),
          const SizedBox(height: 14),
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: [
              _StatCard(
                icon: Icons.grid_view_rounded,
                label: 'Số hũ',
                value: '${jars.length}',
                tone: Colors.indigo,
              ),
              _StatCard(
                icon: Icons.savings_outlined,
                label: 'Ngân sách',
                value: formatCompactCurrency(totalPlanned),
                tone: Colors.blue,
              ),
              _StatCard(
                icon: Icons.pie_chart_outline_rounded,
                label: data.budgetStatus.hasPeriod ? 'Còn chi được' : 'Số dư',
                value: formatCompactCurrency(
                  data.budgetStatus.hasPeriod
                      ? data.budgetStatus.availableToSpend
                      : data.budgetStatus.accountBalanceVnd,
                ),
                tone: (data.budgetStatus.hasPeriod
                            ? data.budgetStatus.availableToSpend
                            : data.budgetStatus.accountBalanceVnd) >=
                        0
                    ? Colors.green
                    : Colors.red,
              ),
            ],
          ),
          const SizedBox(height: 18),
          _JarsSummaryGrid(jars: jars),
          const SizedBox(height: 18),
          ...jars.map((jar) {
            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: _JarBreakdownCard(jar: jar),
            );
          }),
        ],
      ),
    );
  }
}

class _JarsSummaryGrid extends StatelessWidget {
  const _JarsSummaryGrid({required this.jars});

  final List<JarMetric> jars;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: LayoutBuilder(
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
              itemBuilder: (context, index) => _JarMiniTile(jar: jars[index]),
            );
          },
        ),
      ),
    );
  }
}

class _JarMiniTile extends StatelessWidget {
  const _JarMiniTile({required this.jar});

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
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _MoreTab extends StatelessWidget {
  const _MoreTab({required this.data, required this.onRefresh});

  final OverviewData data;
  final Future<void> Function() onRefresh;

  @override
  Widget build(BuildContext context) {
    final appState = context.watch<AppState>();

    return RefreshIndicator(
      onRefresh: onRefresh,
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 96),
        children: [
          const _TabHeader(
            icon: Icons.menu_rounded,
            title: 'Khác',
            subtitle: 'Tiện ích nhanh, trạng thái app và lối tắt điều hướng.',
          ),
          const SizedBox(height: 14),
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: [
              _StatCard(
                icon: Icons.calendar_month_outlined,
                label: 'Tháng',
                value: compactMonthLabel(data.budgetStatus.month),
                tone: Colors.blue,
              ),
              _StatCard(
                icon: Icons.cloud_done_outlined,
                label: 'Nguồn dữ liệu',
                value: 'API',
                tone: Colors.green,
              ),
              _StatCard(
                icon: appState.darkMode
                    ? Icons.dark_mode_outlined
                    : Icons.light_mode_outlined,
                label: 'Giao diện',
                value: appState.darkMode ? 'Tối' : 'Sáng',
                tone: Colors.deepPurple,
              ),
            ],
          ),
          const SizedBox(height: 18),
          Card(
            child: Column(
              children: [
                SwitchListTile.adaptive(
                  value: appState.darkMode,
                  onChanged: (_) => context.read<AppState>().toggleDarkMode(),
                  title: const Text('Chế độ tối'),
                  subtitle: const Text('Đổi giao diện ngay trong app.'),
                  secondary: const Icon(Icons.dark_mode_outlined),
                ),
                const Divider(height: 1),
                _ActionTile(
                  icon: Icons.add_circle_outline_rounded,
                  title: 'Thêm giao dịch nhanh',
                  subtitle: 'Mở bảng nhập nhanh ở giữa màn hình.',
                  onTap: () => _showQuickCaptureSheet(context),
                ),
                const Divider(height: 1),
                _ActionTile(
                  icon: Icons.receipt_long_outlined,
                  title: 'Mở tab Giao dịch',
                  subtitle: 'Xem các giao dịch gần nhất của tháng.',
                  onTap: () => context.read<AppState>().setTab(AppTab.transactions),
                ),
                const Divider(height: 1),
                _ActionTile(
                  icon: Icons.account_balance_wallet_outlined,
                  title: 'Mở tab Hũ',
                  subtitle: 'Xem phân bổ và mức chi theo 6 hũ.',
                  onTap: () => context.read<AppState>().setTab(AppTab.jars),
                ),
                const Divider(height: 1),
                _ActionTile(
                  icon: Icons.sync_rounded,
                  title: 'Làm mới dữ liệu',
                  subtitle: 'Tải lại snapshot mới nhất từ API.',
                  onTap: onRefresh,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _TabHeader extends StatelessWidget {
  const _TabHeader({
    required this.icon,
    required this.title,
    required this.subtitle,
  });

  final IconData icon;
  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 44,
          height: 44,
          decoration: BoxDecoration(
            color: Theme.of(context).colorScheme.primary.withValues(alpha: 0.12),
            borderRadius: BorderRadius.circular(14),
          ),
          child: Icon(icon, color: Theme.of(context).colorScheme.primary),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 2),
              Text(
                subtitle,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({
    required this.icon,
    required this.label,
    required this.value,
    required this.tone,
  });

  final IconData icon;
  final String label;
  final String value;
  final Color tone;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 112,
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: Theme.of(context).cardColor,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(
            color: Theme.of(context).dividerColor.withValues(alpha: 0.18),
          ),
        ),
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(icon, size: 18, color: tone),
              const SizedBox(height: 14),
              Text(
                value,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                label,
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

class _TransactionCard extends StatelessWidget {
  const _TransactionCard({required this.transaction});

  final Transaction transaction;

  @override
  Widget build(BuildContext context) {
    final (icon, color) = switch (transaction.flow) {
      TransactionFlow.income => (Icons.arrow_downward_rounded, Colors.green),
      TransactionFlow.expense => (Icons.arrow_upward_rounded, Colors.red),
      TransactionFlow.transfer => (Icons.swap_horiz_rounded, Colors.blue),
      null => (Icons.receipt_long_outlined, Colors.blueGrey),
    };
    final meta = [
      if (transaction.date != null && transaction.date!.isNotEmpty) transaction.date!,
      if (transaction.time != null && transaction.time!.isNotEmpty) transaction.time!,
      if (transaction.jar != null && transaction.jar!.isNotEmpty)
        jarDefinitions[transaction.jar!]?.label ?? transaction.jar!,
    ].join(' · ');

    return Card(
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        leading: Container(
          width: 38,
          height: 38,
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.12),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(icon, color: color, size: 18),
        ),
        title: Text(
          transaction.description ?? transaction.category ?? 'Giao dịch',
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
        subtitle: Text(
          meta.isEmpty ? 'Không có thêm chi tiết' : meta,
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
        ),
        trailing: Text(
          formatSignedAmount(transaction.amountVnd, transaction.flow),
          style: Theme.of(context).textTheme.labelLarge?.copyWith(
            color: transaction.flow == TransactionFlow.income
                ? Colors.green.shade600
                : Theme.of(context).colorScheme.onSurface,
            fontWeight: FontWeight.w800,
          ),
        ),
      ),
    );
  }
}

class _JarBreakdownCard extends StatelessWidget {
  const _JarBreakdownCard({required this.jar});

  final JarMetric jar;

  @override
  Widget build(BuildContext context) {
    final progress = (jar.usagePct.clamp(0, 100)) / 100;
    final availableColor = jar.available >= 0 ? Colors.green : Colors.red;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 38,
                  height: 38,
                  decoration: BoxDecoration(
                    color: jar.color.withValues(alpha: 0.14),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(jar.icon, color: jar.color),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(jar.label, style: Theme.of(context).textTheme.titleMedium),
                      Text(
                        jar.key,
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: Theme.of(context).colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                ),
                Text(
                  '${jar.usagePct}%',
                  style: Theme.of(context).textTheme.labelLarge?.copyWith(
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),
            ClipRRect(
              borderRadius: BorderRadius.circular(999),
              child: LinearProgressIndicator(
                minHeight: 8,
                value: progress,
                backgroundColor: Theme.of(context).colorScheme.surfaceContainerHighest,
                color: jar.isOver ? Colors.red : jar.color,
              ),
            ),
            const SizedBox(height: 14),
            Row(
              children: [
                Expanded(
                  child: _InlineMetric(
                    label: 'Ngân sách',
                    value: formatCompactCurrency(jar.planned),
                  ),
                ),
                Expanded(
                  child: _InlineMetric(
                    label: 'Đã chi',
                    value: formatCompactCurrency(jar.spent),
                  ),
                ),
                Expanded(
                  child: _InlineMetric(
                    label: 'Còn lại',
                    value: formatCompactCurrency(jar.available),
                    valueColor: availableColor,
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

class _InlineMetric extends StatelessWidget {
  const _InlineMetric({
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

class _ActionTile extends StatelessWidget {
  const _ActionTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(icon, color: Theme.of(context).colorScheme.primary),
      title: Text(title),
      subtitle: Text(subtitle),
      trailing: const Icon(Icons.chevron_right_rounded),
      onTap: onTap,
    );
  }
}

class _EmptyCard extends StatelessWidget {
  const _EmptyCard({
    required this.icon,
    required this.title,
    required this.message,
  });

  final IconData icon;
  final String title;
  final String message;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            Icon(icon, size: 40, color: Theme.of(context).colorScheme.primary),
            const SizedBox(height: 12),
            Text(title, style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            Text(
              message,
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

class _BottomNavBar extends StatelessWidget {
  const _BottomNavBar();

  @override
  Widget build(BuildContext context) {
    final currentTab = context.select<AppState, AppTab>((state) {
      return state.currentTab;
    });

    return BottomAppBar(
      shape: const CircularNotchedRectangle(),
      notchMargin: 8,
      height: 76,
      child: SizedBox(
        height: 64,
        child: Row(
          children: [
            _NavButton(
              tab: AppTab.overview,
              activeTab: currentTab,
              icon: Icons.pie_chart_outline_rounded,
              label: 'Trang chủ',
            ),
            _NavButton(
              tab: AppTab.transactions,
              activeTab: currentTab,
              icon: Icons.list_alt_rounded,
              label: 'Giao dịch',
            ),
            const SizedBox(width: 72),
            _NavButton(
              tab: AppTab.jars,
              activeTab: currentTab,
              icon: Icons.account_balance_wallet_outlined,
              label: 'Hũ',
            ),
            _NavButton(
              tab: AppTab.more,
              activeTab: currentTab,
              icon: Icons.menu_rounded,
              label: 'Khác',
            ),
          ],
        ),
      ),
    );
  }
}

class _NavButton extends StatelessWidget {
  const _NavButton({
    required this.tab,
    required this.activeTab,
    required this.icon,
    required this.label,
  });

  final AppTab tab;
  final AppTab activeTab;
  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    final active = tab == activeTab;
    final color = active
        ? Theme.of(context).colorScheme.primary
        : Theme.of(context).colorScheme.onSurfaceVariant;

    return Expanded(
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: () => context.read<AppState>().setTab(tab),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 4),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, color: color, size: 20),
              const SizedBox(height: 2),
              Text(
                label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  color: color,
                  fontSize: 11,
                  fontWeight: active ? FontWeight.w700 : FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
