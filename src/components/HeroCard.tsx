import { useState } from 'react';
import { ArrowRight, CircleAlert, CircleCheck } from 'lucide-react';
import { cn } from '../lib/utils';
import { useDashboardSummary, useBudgetStatus } from '../lib/hooks';

type HeroMode = 'remaining' | 'spent' | 'savings';

const compact = (v: number): string => {
  const a = Math.abs(v);
  if (a >= 1_000_000) return `${(v / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (a >= 1_000) return `${Math.round(v / 1_000)}K`;
  return v.toLocaleString('vi-VN');
};

const full = (v: number): string => v.toLocaleString('vi-VN');

export default function HeroCard({ month }: { month: string }) {
  const [mode, setMode] = useState<HeroMode>('remaining');
  const { data: summaryRes } = useDashboardSummary(month);
  const { data: budgetStatus } = useBudgetStatus(month);

  const totals = summaryRes?.data?.totals;
  const income = budgetStatus?.income ?? totals?.income_vnd ?? 0;
  const totalSpent = budgetStatus?.total_spent ?? totals?.expense_vnd ?? 0;
  const totalPlanned =
    budgetStatus?.jars?.reduce((s, j) => s + j.planned, 0) ?? income;
  const remaining = income - totalSpent;
  const savingsRate = income > 0 ? Math.round((remaining / income) * 100) : 0;
  const planUsage = totalPlanned > 0 ? Math.round((totalSpent / totalPlanned) * 100) : 0;
  const onTrack = planUsage <= 100 && remaining >= 0;

  let big: number;
  let label: string;
  let suffix: string | null = ' ₫';
  if (mode === 'remaining') {
    big = remaining;
    label = 'Còn chi được';
  } else if (mode === 'spent') {
    big = totalSpent;
    label = 'Đã chi tháng này';
  } else {
    big = savingsRate;
    label = 'Tỷ lệ tiết kiệm';
    suffix = '%';
  }

  return (
    <div className="bg-white dark:bg-[#1a2433] rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-5 lg:p-6">
      {/* Mode toggle */}
      <div className="inline-flex items-center bg-slate-100 dark:bg-[#0c1222] rounded-lg p-0.5 mb-4">
        {(['remaining', 'spent', 'savings'] as HeroMode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={cn(
              'px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap',
              mode === m
                ? 'bg-white dark:bg-[#1a2433] text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            )}
          >
            {m === 'remaining' ? 'Còn lại' : m === 'spent' ? 'Đã chi' : 'Tiết kiệm'}
          </button>
        ))}
      </div>

      {/* Label + status pill */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-slate-500 dark:text-slate-400">{label}</span>
        <span
          className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold',
            onTrack
              ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
              : 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
          )}
        >
          {onTrack ? <CircleCheck className="size-3" /> : <CircleAlert className="size-3" />}
          {onTrack ? 'Đúng tiến độ' : 'Chậm tiến độ'}
        </span>
      </div>

      {/* Big money */}
      <div className="flex items-baseline gap-1.5 mb-3">
        <span
          className={cn(
            'font-extrabold tracking-tight tabular-nums text-4xl lg:text-5xl',
            mode === 'remaining' && remaining < 0
              ? 'text-red-600 dark:text-red-400'
              : 'text-slate-900 dark:text-white'
          )}
        >
          {mode === 'savings' ? big : full(big)}
        </span>
        {suffix && (
          <span className="text-base lg:text-lg font-semibold text-slate-400 dark:text-slate-500">
            {suffix.trim()}
          </span>
        )}
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-3 text-[13px] text-slate-500 dark:text-slate-400 mb-4 flex-wrap">
        <span>
          Thu <strong className="text-slate-900 dark:text-white tabular-nums">+{compact(income)}</strong>
        </span>
        <span className="text-slate-300 dark:text-slate-600">·</span>
        <span>
          Chi <strong className="text-slate-900 dark:text-white tabular-nums">−{compact(totalSpent)}</strong>
        </span>
        <span className="text-slate-300 dark:text-slate-600">·</span>
        <span>
          KH <strong className="text-slate-900 dark:text-white tabular-nums">{compact(totalPlanned)}</strong>
        </span>
      </div>

      {/* Progress */}
      <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all',
            planUsage > 100
              ? 'bg-red-500'
              : planUsage >= 80
              ? 'bg-amber-500'
              : 'bg-blue-500'
          )}
          style={{ width: `${Math.min(100, planUsage)}%` }}
        />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-2 text-xs text-slate-500 dark:text-slate-400">
        <span className="tabular-nums">{planUsage}% kế hoạch tháng</span>
        <a
          href="#jars"
          onClick={(e) => {
            e.preventDefault();
            window.location.hash = '#jars';
          }}
          className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 font-semibold hover:underline"
        >
          Phân tích <ArrowRight className="size-3" />
        </a>
      </div>
    </div>
  );
}
