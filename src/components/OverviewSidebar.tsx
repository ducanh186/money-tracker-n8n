import { TrendingUp, TrendingDown, ArrowUpCircle, ArrowDownCircle, ArrowRightLeft } from 'lucide-react';
import { formatCurrency, formatSignedAmount } from '../lib/utils';
import { useDashboardSummary, useDarkMode } from '../lib/hooks';
import { getJar, JAR_ORDER } from '../lib/jars';
import type { JarKey } from '../lib/jars';

const compact = (v: number): string => {
  const a = Math.abs(v);
  if (a >= 1_000_000) return `${(v / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (a >= 1_000) return `${Math.round(v / 1_000)}K`;
  return v.toLocaleString('vi-VN');
};

function flowIcon(flow: string | null) {
  if (flow === 'income') return ArrowUpCircle;
  if (flow === 'expense') return ArrowDownCircle;
  return ArrowRightLeft;
}

function parseTxDate(value: string | null | undefined): Date | null {
  if (!value) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const parsed = new Date(`${value}T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const match = /^(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?$/.exec(value.trim());
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3] ?? new Date().getFullYear());
  const parsed = new Date(year, month - 1, day);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function recentLabel(value: string | null | undefined): string {
  if (!value) return 'Không rõ ngày';
  const parsed = parseTxDate(value);
  if (!parsed) return value;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  parsed.setHours(0, 0, 0, 0);

  const base = parsed.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
  });

  if (parsed.getTime() === today.getTime()) return `Hôm nay · ${base}`;
  if (parsed.getTime() === yesterday.getTime()) return `Hôm qua · ${base}`;
  return base;
}

function signedAmount(amount: number, flow: string | null): number {
  if (flow === 'income') return amount;
  if (flow === 'expense') return -amount;
  return 0;
}

export default function OverviewSidebar({ month }: { month: string }) {
  const { data: summaryRes } = useDashboardSummary(month);
  const isDark = useDarkMode();
  const summary = summaryRes?.data;

  const totals = summary?.totals;
  const income = totals?.income_vnd ?? 0;
  const expense = totals?.expense_vnd ?? 0;
  const net = totals?.net_vnd ?? income - expense;
  const savingsRate = income > 0 ? Math.round((net / income) * 100) : 0;

  const expenseByJar = summary?.expense_by_jar ?? {};
  const totalJarExpense = Object.values(expenseByJar).reduce((s, v) => s + Math.abs(v), 0);

  const topJars = JAR_ORDER
    .map((k) => ({ key: k, amount: Math.abs(expenseByJar[k] ?? 0) }))
    .filter((x) => x.amount > 0)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3);

  const recent = (summary?.recent_transactions ?? []).slice(0, 4);
  const recentGroups = Object.entries(
    recent.reduce<Record<string, typeof recent>>((groups, tx) => {
      const key = tx.date ?? 'unknown';
      if (!groups[key]) groups[key] = [];
      groups[key].push(tx);
      return groups;
    }, {})
  ).map(([date, txs]) => ({
    date,
    label: recentLabel(date === 'unknown' ? null : date),
    total: txs.reduce((sum, tx) => sum + signedAmount(tx.amount_vnd, tx.flow), 0),
    txs,
  }));

  return (
    <aside className="hidden lg:flex flex-col gap-4">
      {/* This Month */}
      <div className="bg-white dark:bg-[#1a2433] rounded-xl border border-slate-100 dark:border-slate-700 p-4 shadow-sm">
        <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Tháng này</h4>
        <div className="flex flex-col">
          <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700">
            <span className="text-sm text-slate-600 dark:text-slate-400 inline-flex items-center gap-1.5">
              <TrendingUp className="size-3.5 text-green-600" /> Thu
            </span>
            <span className="text-sm font-semibold text-green-600 dark:text-green-400 tabular-nums">
              +{compact(income)}
            </span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700">
            <span className="text-sm text-slate-600 dark:text-slate-400 inline-flex items-center gap-1.5">
              <TrendingDown className="size-3.5 text-orange-600" /> Chi
            </span>
            <span className="text-sm font-semibold text-orange-600 dark:text-orange-400 tabular-nums">
              −{compact(expense)}
            </span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-slate-600 dark:text-slate-400">Tiết kiệm</span>
            <span
              className={`text-sm font-semibold tabular-nums ${
                savingsRate >= 20
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : savingsRate >= 0
                  ? 'text-slate-700 dark:text-slate-200'
                  : 'text-red-600 dark:text-red-400'
              }`}
            >
              {savingsRate}%
            </span>
          </div>
        </div>
      </div>

      {/* Top categories (top 3 jars by expense) */}
      <div className="bg-white dark:bg-[#1a2433] rounded-xl border border-slate-100 dark:border-slate-700 p-4 shadow-sm">
        <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Top ăn tiền</h4>
        {topJars.length === 0 ? (
          <p className="text-xs text-slate-400 dark:text-slate-500 py-2">Chưa có chi tiêu</p>
        ) : (
          <div className="flex flex-col">
            {topJars.map((item, i) => {
              const jar = getJar(item.key as JarKey);
              if (!jar) return null;
              const pct = totalJarExpense > 0 ? Math.round((item.amount / totalJarExpense) * 100) : 0;
              const dotColor = isDark ? jar.hex_dark : jar.hex_light;
              const bgColor = isDark ? jar.bg_dark : jar.bg_light;
              const textColor = isDark ? jar.hex_dark : jar.hex_light;
              return (
                <div key={item.key} className={`py-2.5 ${i < topJars.length - 1 ? 'border-b border-slate-100 dark:border-slate-700' : ''}`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{jar.label_vi}</span>
                    <span className="text-sm font-semibold text-slate-900 dark:text-white tabular-nums">
                      −{compact(item.amount)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide"
                      style={{ backgroundColor: bgColor, color: textColor }}
                    >
                      <span className="size-1.5 rounded-full" style={{ backgroundColor: dotColor }} />
                      {jar.key}
                    </span>
                    <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, backgroundColor: dotColor }}
                      />
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums w-8 text-right">{pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent transactions */}
      <div className="bg-white dark:bg-[#1a2433] rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
        <h4 className="text-sm font-semibold text-slate-900 dark:text-white px-4 pt-4 pb-3">Gần đây</h4>
        {recent.length === 0 ? (
          <p className="text-xs text-slate-400 dark:text-slate-500 px-4 pb-4">Chưa có giao dịch</p>
        ) : (
          <div className="flex flex-col">
            {recentGroups.map((group, groupIndex) => (
              <div key={`${group.date}-${groupIndex}`} className={groupIndex > 0 ? 'border-t border-slate-100 dark:border-slate-700' : ''}>
                <div className="flex items-center justify-between px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">
                  <span>{group.label}</span>
                  <span className="tabular-nums">{group.total >= 0 ? '+' : '−'}{compact(Math.abs(group.total))}</span>
                </div>

                {group.txs.map((tx, txIndex) => {
                  const Icon = flowIcon(tx.flow);
                  const iconColor =
                    tx.flow === 'income'
                      ? 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400'
                      : tx.flow === 'expense'
                      ? 'text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400'
                      : 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400';

                  return (
                    <div
                      key={`${group.date}-${tx.time ?? txIndex}-${txIndex}`}
                      className={`flex items-center gap-3 px-4 py-2.5 ${
                        txIndex < group.txs.length - 1 ? 'border-b border-slate-100 dark:border-slate-700' : ''
                      }`}
                    >
                      <div className={`size-8 rounded-full flex items-center justify-center shrink-0 ${iconColor}`}>
                        <Icon className="size-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-900 dark:text-white truncate">
                          {tx.description ?? tx.category ?? '—'}
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500">
                          {tx.time ?? '--:--'}
                          {tx.flow === 'income'
                            ? ' · Thu nhập'
                            : ` · ${getJar((tx.jar ?? '') as JarKey)?.label_vi ?? tx.jar ?? 'Chưa gán hũ'}`}
                        </p>
                      </div>
                      <span
                        className={`text-xs font-semibold tabular-nums shrink-0 ${
                          tx.flow === 'income'
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        {formatSignedAmount(tx.amount_vnd, tx.flow)}
                      </span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
