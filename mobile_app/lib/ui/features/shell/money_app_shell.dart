import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../data/repositories/money_repository.dart';
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
          return Scaffold(
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
              onPressed: () {
                showModalBottomSheet<void>(
                  context: context,
                  isScrollControlled: true,
                  useSafeArea: true,
                  backgroundColor: Colors.transparent,
                  builder: (_) => const QuickCaptureSheet(),
                );
              },
              shape: const CircleBorder(),
              child: const Icon(Icons.add),
            ),
            floatingActionButtonLocation:
                FloatingActionButtonLocation.centerDocked,
            bottomNavigationBar: const _BottomNavBar(),
          );
        },
      ),
    );
  }
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
          Container(
            width: 34,
            height: 34,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.primary,
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Text(
              '₫',
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w800,
              ),
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
      AppTab.transactions => const _PlaceholderScreen(
        icon: Icons.receipt_long_outlined,
        title: 'Giao dịch',
        message: 'Danh sách giao dịch sẽ được nối API ở bước tiếp theo.',
      ),
      AppTab.jars => const _PlaceholderScreen(
        icon: Icons.account_balance_wallet_outlined,
        title: 'Hũ',
        message: 'Màn quản lý 6 hũ đã có sẵn navigation để triển khai sau.',
      ),
      AppTab.more => const _PlaceholderScreen(
        icon: Icons.more_horiz_rounded,
        title: 'Khác',
        message: 'Chi tiêu, mục tiêu và nợ sẽ nằm ở khu vực này.',
      ),
    };
  }
}

class _PlaceholderScreen extends StatelessWidget {
  const _PlaceholderScreen({
    required this.icon,
    required this.title,
    required this.message,
  });

  final IconData icon;
  final String title;
  final String message;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 44, color: Theme.of(context).colorScheme.primary),
            const SizedBox(height: 16),
            Text(title, style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 8),
            Text(
              message,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyMedium,
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
