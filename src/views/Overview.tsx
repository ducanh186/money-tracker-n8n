import { ArrowUpCircle, ArrowDownCircle, ArrowRightLeft, Loader2, RefreshCw } from 'lucide-react';
import { formatCurrency, formatSignedAmount } from '../lib/utils';
import { useDashboardSummary, useSyncStatus, useTriggerSync, useInvestmentSummary } from '../lib/hooks';
import { IncomeExpenseChart } from '../components/IncomeExpenseChart';
import { ExpenseStructureChart } from '../components/ExpenseStructureChart';
import OverviewSidebar from '../components/OverviewSidebar';
import HeroCard from '../components/HeroCard';
import JarMiniGrid from '../components/JarMiniGrid';
import { getJar, JAR_ORDER } from '../lib/jars';

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
  const { data: summaryRes, isPending, error } = useDashboardSummary(month);
  const { data: syncRes } = useSyncStatus();
  const syncMutation = useTriggerSync();
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
  const recentTxs = summary?.recent_transactions ?? [];
  const syncStatus = syncRes?.data;
  const expenseByJar = summary?.expense_by_jar ?? {};
  const totalJarExpense = Object.values(expenseByJar).reduce((sum, value) => sum + Math.abs(value), 0);
  const topJars = JAR_ORDER
    .map((key) => ({ key, amount: Math.abs(expenseByJar[key] ?? 0) }))
    .filter((item) => item.amount > 0)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 max-w-7xl mx-auto">
      <div className="flex flex-col gap-5 min-w-0">
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

      {/* Hero card with 3-mode toggle */}
      <HeroCard month={month} />

      {/* 6-jar mini grid */}
      <JarMiniGrid month={month} />

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3">
          <IncomeExpenseChart currentMonth={month} />
        </div>
        <div className="lg:col-span-2">
          <ExpenseStructureChart month={month} />
        </div>
      </div>

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

      <div className="lg:hidden flex flex-col gap-3 mt-1">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Top ăn tiền</h3>
        </div>

        <div className="rounded-2xl bg-white dark:bg-[#1a2433] border border-slate-100 dark:border-slate-700 shadow-sm p-4">
          {topJars.length === 0 ? (
            <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-4">Chưa có chi tiêu theo hũ trong tháng này</p>
          ) : (
            <div className="flex flex-col gap-3">
              {topJars.map((item) => {
                const jar = getJar(item.key);
                if (!jar) return null;
                const pct = totalJarExpense > 0 ? Math.round((item.amount / totalJarExpense) * 100) : 0;
                return (
                  <div key={item.key} className="rounded-xl bg-slate-50 dark:bg-[#0c1222] border border-slate-100 dark:border-slate-700 p-3">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="flex min-w-0 items-center gap-3">
                        <span
                          className="inline-flex size-10 shrink-0 items-center justify-center rounded-full"
                          style={{ backgroundColor: jar.bg_light, color: jar.hex_light }}
                        >
                          <jar.icon className="size-4.5" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{jar.label_vi}</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">{jar.key}</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{formatCurrency(item.amount)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: jar.hex_light }} />
                      </div>
                      <span className="w-9 text-right text-[11px] text-slate-500 dark:text-slate-400">{pct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="lg:hidden flex flex-col gap-4 mt-4">
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
