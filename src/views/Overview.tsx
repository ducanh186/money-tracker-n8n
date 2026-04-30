import { TrendingUp, TrendingDown, Wallet, ArrowUpCircle, ArrowDownCircle, ArrowRightLeft, Loader2, RefreshCw, PiggyBank, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { formatCurrency, formatSignedAmount, cn } from '../lib/utils';
import { useDashboardSummary, useSyncStatus, useTriggerSync, useBudgetStatus, useInvestmentSummary } from '../lib/hooks';
import { IncomeExpenseChart } from '../components/IncomeExpenseChart';
import { ExpenseStructureChart } from '../components/ExpenseStructureChart';
import OverviewSidebar from '../components/OverviewSidebar';

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
  const { data: budgetStatus } = useBudgetStatus(month);
  const { data: investmentData } = useInvestmentSummary(month);

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
      title: 'Thu nhập thực nhận',
      amount: budgetStatus?.income ?? totals?.income_vnd ?? 0,
      color: 'text-green-600',
      bg: 'bg-green-50',
      icon: TrendingUp,
    },
    {
      title: 'Đã phân bổ',
      amount: budgetStatus?.assigned ?? totals?.income_vnd ?? 0,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      icon: PiggyBank,
    },
    {
      title: 'Chưa phân bổ',
      amount: budgetStatus?.unassigned ?? (totals ? totals.income_vnd - totals.expense_vnd : 0),
      color: (budgetStatus?.unassigned ?? 0) === 0 ? 'text-green-600' : 'text-red-600',
      bg: (budgetStatus?.unassigned ?? 0) === 0 ? 'bg-green-50' : 'bg-red-50',
      icon: (budgetStatus?.unassigned ?? 0) === 0 ? TrendingUp : AlertTriangle,
    },
    {
      title: 'Được phép chi',
      amount: budgetStatus?.available_to_spend ?? (totals ? totals.income_vnd - totals.expense_vnd : 0),
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      icon: Wallet,
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 max-w-7xl mx-auto">
      <div className="flex flex-col gap-6 min-w-0">
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {summaryCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="relative overflow-hidden rounded-xl bg-white dark:bg-[#1a2433] p-6 shadow-sm border border-slate-100 dark:border-slate-700">
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
            <span className="text-sm font-medium text-white/80">Đã chi thực tế</span>
            <h3 className="text-2xl font-bold tracking-tight">
              {formatCurrency(budgetStatus?.total_spent ?? totals?.expense_vnd ?? 0)}
            </h3>
            <div className="mt-2 flex items-center gap-1 text-sm font-medium text-white/90">
              <TrendingDown className="size-4" />
              <span>{totals?.ending_balance_vnd != null ? `Số dư: ${formatCurrency(totals.ending_balance_vnd)}` : 'Tháng này'}</span>
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

      {/* Budget Jar Breakdown */}
      {budgetStatus && budgetStatus.jars.length > 0 && (
        <div className="bg-white dark:bg-[#1a2433] rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm p-5">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Ngân sách theo hũ</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {budgetStatus.jars.map((jar) => {
              const usagePct = jar.planned > 0 ? Math.min(100, Math.round((jar.spent / jar.planned) * 100)) : 0;
              const isOver = jar.available < 0;
              return (
                <div key={jar.key} className="flex flex-col gap-2 p-3 rounded-lg bg-slate-50 dark:bg-[#0c1222] border border-slate-100 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">{jar.label}</span>
                    <span className={`text-xs font-bold ${isOver ? 'text-red-600' : 'text-emerald-600'}`}>
                      {isOver ? 'Vượt mức' : `${usagePct}%`}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${isOver ? 'bg-red-500' : usagePct >= 80 ? 'bg-amber-500' : 'bg-blue-500'}`} style={{ width: `${usagePct}%` }} />
                  </div>
                  <div className="grid grid-cols-2 gap-x-3 text-xs text-slate-500 dark:text-slate-400">
                    <span>Kế hoạch: {formatCurrency(jar.planned)}</span>
                    <span>Đã chi: {formatCurrency(jar.spent)}</span>
                    <span>Cam kết: {formatCurrency(jar.committed)}</span>
                    <span className={isOver ? 'text-red-600 font-semibold' : ''}>Còn lại: {formatCurrency(jar.available)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Investment Summary */}
      {investmentData && investmentData.data && investmentData.data.planned_allocation > 0 && (
        <div className="bg-white dark:bg-[#151b2b] rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800 lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Tiến độ Đầu tư</h3>
            <span className="text-xs font-semibold px-2 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
              Tháng {month}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Aggregate Progress */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0c1222] border border-slate-100 dark:border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-500 dark:text-slate-400">Tổng đầu tư so với kế hoạch</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {Math.round((investmentData.data.total_funded / investmentData.data.planned_allocation) * 100) || 0}%
                </span>
              </div>
              <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mb-3">
                <div 
                  className={`h-full rounded-full transition-all ${
                    investmentData.data.total_funded >= investmentData.data.planned_allocation 
                      ? 'bg-emerald-500' 
                      : 'bg-indigo-500'
                  }`}
                  style={{ width: `${Math.min(100, (investmentData.data.total_funded / investmentData.data.planned_allocation) * 100) || 0}%` }}
                />
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block">Kế hoạch:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{formatCurrency(investmentData.data.planned_allocation)}</span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block">Đã giải ngân:</span>
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">{formatCurrency(investmentData.data.total_funded)}</span>
                </div>
              </div>
            </div>

            {/* Individual Target Items */}
            <div className="flex flex-col gap-2">
              {investmentData.data.allocations.filter(a => a.planned > 0).map(allocation => (
                <div key={allocation.fund_id} className="flex flex-col gap-1 p-3 rounded-lg bg-slate-50 dark:bg-[#0c1222] border border-slate-100 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{allocation.fund_name}</span>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {formatCurrency(allocation.current_funded)} / {formatCurrency(allocation.planned)}
                    </div>
                  </div>
                  <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${allocation.current_funded >= allocation.planned ? 'bg-emerald-500' : 'bg-indigo-400'}`}
                      style={{ width: `${Math.min(100, (allocation.current_funded / allocation.planned) * 100) || 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

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
              <div key={idx} className="flex items-center justify-between rounded-xl bg-white dark:bg-[#1a2433] p-4 shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-shadow cursor-pointer">
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
                  {formatSignedAmount(tx.amount_vnd, tx.flow)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      </div>
      <OverviewSidebar month={month} />
    </div>
  );
}
