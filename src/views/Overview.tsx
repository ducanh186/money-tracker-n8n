import { TrendingUp, TrendingDown, Wallet, ArrowUpCircle, ArrowDownCircle, ArrowRightLeft, Loader2, RefreshCw } from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { useDashboardSummary, useSyncStatus, useTriggerSync } from '../lib/hooks';
import { IncomeExpenseChart } from '../components/IncomeExpenseChart';
import { ExpenseStructureChart } from '../components/ExpenseStructureChart';

const flowIcon = (flow: string | null) => {
  if (flow === 'income') return ArrowUpCircle;
  if (flow === 'expense') return ArrowDownCircle;
  return ArrowRightLeft;
};

const flowColors = (flow: string | null) => {
  if (flow === 'income') return { color: 'text-green-600', bg: 'bg-green-100' };
  if (flow === 'expense') return { color: 'text-orange-600', bg: 'bg-orange-100' };
  return { color: 'text-blue-600', bg: 'bg-blue-100' };
};

export default function Overview({ month }: { month: string }) {
  // Lightweight summary endpoint — no full transaction list
  const { data: summaryRes, isPending, error, refetch } = useDashboardSummary(month);
  const { data: syncRes } = useSyncStatus();
  const syncMutation = useTriggerSync();

  if (isPending) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="size-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-500">{error.message}</p>
      </div>
    );
  }

  const summary = summaryRes?.data;
  const totals = summary?.totals;
  const recentTxs = summary?.recent_transactions ?? [];
  const syncStatus = syncRes?.data;

  const summaryCards = [
    {
      title: 'Tổng thu',
      amount: totals?.income_vnd ?? 0,
      color: 'text-green-600',
      bg: 'bg-green-50',
      icon: TrendingUp,
    },
    {
      title: 'Tổng chi',
      amount: totals?.expense_vnd ?? 0,
      color: 'text-red-600',
      bg: 'bg-red-50',
      icon: TrendingDown,
    },
    {
      title: 'Chênh lệch',
      amount: totals?.net_vnd ?? 0,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      icon: (totals?.net_vnd ?? 0) >= 0 ? TrendingUp : TrendingDown,
    },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Sync status bar */}
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>
          {syncStatus?.last_sync_at
            ? `Đồng bộ lần cuối: ${new Date(syncStatus.last_sync_at).toLocaleTimeString('vi-VN')} (${syncStatus.row_count} dòng, ${syncStatus.elapsed_ms}ms)`
            : 'Chưa đồng bộ'}
        </span>
        <button
          onClick={() => syncMutation.mutate()}
          disabled={syncMutation.isPending}
          className="flex items-center gap-1 text-blue-500 hover:text-blue-700 disabled:opacity-50"
        >
          <RefreshCw className={`size-3.5 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
          {syncMutation.isPending ? 'Đang đồng bộ...' : 'Làm mới'}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="relative overflow-hidden rounded-xl bg-white dark:bg-slate-800 p-6 shadow-sm border border-slate-100 dark:border-slate-700">
              <div className={`absolute right-0 top-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full ${card.bg}`}></div>
              <div className="relative z-10 flex flex-col gap-1">
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{card.title}</span>
                <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{formatCurrency(card.amount)}</h3>
                <div className={`mt-2 flex items-center gap-1 text-sm font-medium ${card.color}`}>
                  <Icon className="size-4" />
                </div>
              </div>
            </div>
          );
        })}
        
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 p-6 shadow-md text-white">
          <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-white/10"></div>
          <div className="relative z-10 flex flex-col gap-1">
            <span className="text-sm font-medium text-white/80">Số dư cuối kỳ</span>
            <h3 className="text-2xl font-bold tracking-tight">
              {totals?.ending_balance_vnd != null ? formatCurrency(totals.ending_balance_vnd) : '—'}
            </h3>
            <div className="mt-2 flex items-center gap-1 text-sm font-medium text-white/90">
              <Wallet className="size-4" />
              <span>Balance</span>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction count badge */}
      <div className="text-sm text-slate-500 dark:text-slate-400">
        {summary?.transaction_count ?? 0} giao dịch trong tháng
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3">
          <IncomeExpenseChart currentMonth={month} />
        </div>
        <div className="lg:col-span-2">
          <ExpenseStructureChart month={month} />
        </div>
      </div>

      <div className="flex flex-col gap-4 mt-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Giao dịch gần đây</h3>
        </div>
        
        {recentTxs.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-8">Không có giao dịch nào trong tháng này</p>
        )}

        <div className="flex flex-col gap-3">
          {recentTxs.map((tx, idx) => {
            const Icon = flowIcon(tx.flow);
            const colors = flowColors(tx.flow);
            return (
              <div key={idx} className="flex items-center justify-between rounded-xl bg-white dark:bg-slate-800 p-4 shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className={`flex size-12 shrink-0 items-center justify-center rounded-full ${colors.bg} ${colors.color}`}>
                    <Icon className="size-6" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-900 dark:text-white">{tx.description ?? tx.category ?? '—'}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">{tx.time} • {tx.date}</span>
                  </div>
                </div>
                <span className={`font-bold ${tx.flow === 'income' ? 'text-green-600' : 'text-slate-900 dark:text-white'}`}>
                  {tx.flow === 'income' ? '+' : '-'}{formatCurrency(tx.amount_vnd)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
