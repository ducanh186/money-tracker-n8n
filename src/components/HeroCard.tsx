import { useState } from 'react';
import { ArrowRight, CircleAlert, CircleCheck } from 'lucide-react';
import { cn } from '../lib/utils';
import { useDashboardSummary, useBudgetStatus } from '../lib/hooks';

type HeroMode = 'remaining' | 'spent' | 'savings';

const full = (v: number): string => v.toLocaleString('vi-VN');

export default function HeroCard({ month }: { month: string }) {
  const [mode, setMode] = useState<HeroMode>('remaining');
  const { data: summaryRes } = useDashboardSummary(month);
  const { data: budgetStatus } = useBudgetStatus(month);

  const totals = summaryRes?.data?.totals;
  const income = budgetStatus?.income ?? totals?.income_vnd ?? 0;
  const totalSpent = budgetStatus?.total_spent ?? totals?.expense_vnd ?? 0;
  const spendableBudget = budgetStatus?.jars?.reduce(
    (sum, jar) => sum + jar.planned + jar.rollover - jar.committed,
    0,
  ) ?? income;
  const remaining = budgetStatus?.available_to_spend ?? (income - totalSpent);
  const netAfterSpend = income - totalSpent;
  const savingsRate = income > 0 ? Math.round((netAfterSpend / income) * 100) : 0;
  const planUsage = spendableBudget > 0 ? Math.round((totalSpent / spendableBudget) * 100) : 0;
  const onTrack = remaining >= 0 && (spendableBudget <= 0 || planUsage <= 100);

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
        <span className="tabular-nums">{planUsage}% ngân sách chi</span>
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
