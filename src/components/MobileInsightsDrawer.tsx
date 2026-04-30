import { ArrowDownCircle, ArrowRightLeft, ArrowUpCircle, Loader2, TrendingDown, TrendingUp, X } from 'lucide-react';
import { useEffect } from 'react';
import { useDashboardSummary } from '../lib/hooks';
import { getJar, JAR_ORDER } from '../lib/jars';
import { formatCurrency, formatSignedAmount } from '../lib/utils';

function flowIcon(flow: string | null) {
  if (flow === 'income') return ArrowUpCircle;
  if (flow === 'expense') return ArrowDownCircle;
  return ArrowRightLeft;
}

export default function MobileInsightsDrawer({
  month,
  open,
  onClose,
}: {
  month: string;
  open: boolean;
  onClose: () => void;
}) {
  const { data: summaryRes, isPending } = useDashboardSummary(month);
  const summary = summaryRes?.data;

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const totals = summary?.totals;
  const income = totals?.income_vnd ?? 0;
  const expense = totals?.expense_vnd ?? 0;
  const net = totals?.net_vnd ?? income - expense;
  const savingsRate = income > 0 ? Math.round((net / income) * 100) : 0;
  const expenseByJar = summary?.expense_by_jar ?? {};
  const totalJarExpense = Object.values(expenseByJar).reduce((sum, value) => sum + Math.abs(value), 0);
  const topJars = JAR_ORDER
    .map((key) => ({ key, amount: Math.abs(expenseByJar[key] ?? 0) }))
    .filter((item) => item.amount > 0)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 4);
  const recent = (summary?.recent_transactions ?? []).slice(0, 5);

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={onClose}
      />
      <div
        className={`fixed inset-x-0 bottom-0 z-50 max-h-[86vh] overflow-hidden rounded-t-[28px] border border-slate-200 bg-white shadow-2xl transition-transform duration-300 dark:border-slate-700 dark:bg-[#1a2433] ${open ? 'translate-y-0' : 'translate-y-full'}`}
      >
        <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-slate-200 dark:bg-slate-700" />
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4 dark:border-slate-700">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Phân tích tháng</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Snapshot ngân sách và giao dịch gần đây</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Đóng phân tích"
            className="inline-flex size-9 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="flex max-h-[calc(86vh-72px)] flex-col gap-4 overflow-y-auto px-4 py-4">
          {isPending && (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="size-6 animate-spin text-blue-600" />
            </div>
          )}

          {!isPending && (
            <>
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-2xl border border-slate-200/80 bg-slate-50 px-3 py-3 dark:border-slate-700 dark:bg-[#0c1222]">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Thu</span>
                  <div className="mt-2 inline-flex items-center gap-1 text-green-600 dark:text-green-400">
                    <TrendingUp className="size-3.5" />
                    <span className="text-sm font-bold">{formatCurrency(income)}</span>
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200/80 bg-slate-50 px-3 py-3 dark:border-slate-700 dark:bg-[#0c1222]">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Chi</span>
                  <div className="mt-2 inline-flex items-center gap-1 text-red-600 dark:text-red-400">
                    <TrendingDown className="size-3.5" />
                    <span className="text-sm font-bold">{formatCurrency(expense)}</span>
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200/80 bg-slate-50 px-3 py-3 dark:border-slate-700 dark:bg-[#0c1222]">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Tiết kiệm</span>
                  <div className={`mt-2 text-sm font-bold ${savingsRate >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                    {savingsRate}%
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-4 shadow-sm dark:border-slate-700 dark:bg-[#111827]">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Top ăn tiền</h4>
                {topJars.length === 0 ? (
                  <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">Chưa có dữ liệu chi tiêu theo hũ.</p>
                ) : (
                  <div className="mt-3 flex flex-col gap-3">
                    {topJars.map((item) => {
                      const jar = getJar(item.key);
                      if (!jar) return null;
                      const pct = totalJarExpense > 0 ? Math.round((item.amount / totalJarExpense) * 100) : 0;
                      return (
                        <div key={item.key} className="rounded-xl bg-slate-50 px-3 py-3 dark:bg-[#0c1222]">
                          <div className="mb-2 flex items-center justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-2">
                              <span
                                className="inline-flex size-8 shrink-0 items-center justify-center rounded-full"
                                style={{ backgroundColor: jar.bg_light, color: jar.hex_light }}
                              >
                                <jar.icon className="size-4" />
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

              <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-4 shadow-sm dark:border-slate-700 dark:bg-[#111827]">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Gần đây</h4>
                {recent.length === 0 ? (
                  <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">Chưa có giao dịch gần đây.</p>
                ) : (
                  <div className="mt-3 flex flex-col gap-2">
                    {recent.map((tx, index) => {
                      const Icon = flowIcon(tx.flow);
                      return (
                        <div key={`${tx.date ?? 'unknown'}-${tx.time ?? 'unknown'}-${index}`} className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-3 dark:bg-[#0c1222]">
                          <span className={`inline-flex size-9 shrink-0 items-center justify-center rounded-full ${tx.flow === 'income' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : tx.flow === 'expense' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                            <Icon className="size-4" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{tx.description ?? tx.category ?? '—'}</p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">{tx.time ?? ''}{tx.date ? ` · ${tx.date}` : ''}</p>
                          </div>
                          <span className={`text-xs font-bold ${tx.flow === 'income' ? 'text-green-600 dark:text-green-400' : 'text-slate-700 dark:text-slate-200'}`}>
                            {formatSignedAmount(tx.amount_vnd, tx.flow)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}