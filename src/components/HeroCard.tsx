import { useState } from 'react';
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
  const actuals = budgetStatus?.actuals;
  const account = budgetStatus?.account;
  const plan = budgetStatus?.plan;
  const suggestion = budgetStatus?.suggestion;
  const expectedIncome = suggestion?.expected_income_vnd ?? budgetStatus?.expected_income_vnd ?? budgetStatus?.income ?? totals?.income_vnd ?? 0;
  const actualIncome = actuals?.income_vnd ?? budgetStatus?.actual_income_vnd ?? budgetStatus?.sheet_income ?? totals?.income_vnd ?? 0;
  const totalSpent = actuals?.expense_vnd ?? budgetStatus?.actual_expense_vnd ?? budgetStatus?.total_spent ?? totals?.expense_vnd ?? 0;
  const accountBalance =
    account?.account_balance_vnd ??
    budgetStatus?.account_balance_vnd ??
    totals?.account_balance_vnd ??
    totals?.ending_balance_vnd ??
    0;
  const hasBudgetPlan = plan?.has_period ?? budgetStatus?.has_period ?? true;
  const usesSuggestedPlan = !hasBudgetPlan && (suggestion?.enabled || expectedIncome > 0);
  const remaining = hasBudgetPlan
    ? (plan?.available_to_spend_vnd ?? budgetStatus?.available_to_spend_vnd ?? budgetStatus?.available_to_spend ?? (expectedIncome - totalSpent))
    : (suggestion?.available_to_spend_vnd ?? suggestion?.remaining_vnd ?? accountBalance);
  const netAfterSpend = (actualIncome > 0 ? actualIncome : expectedIncome) - totalSpent;
  const savingsRate = expectedIncome > 0 ? Math.round((netAfterSpend / expectedIncome) * 100) : 0;

  let big: number;
  let label: string;
  let suffix: string | null = ' ₫';
  if (mode === 'remaining') {
    big = hasBudgetPlan ? remaining : accountBalance;
    label = hasBudgetPlan ? 'Còn chi được' : 'Số dư tài khoản';
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

      <div className="mb-2 text-sm text-slate-500 dark:text-slate-400">{label}</div>

      {/* Big money */}
      <div className="flex items-baseline gap-1.5 mb-3">
        <span
          className={cn(
            'font-extrabold tracking-tight tabular-nums text-4xl lg:text-5xl',
            mode === 'remaining' && hasBudgetPlan && remaining < 0
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

      <div className="text-sm text-slate-500 dark:text-slate-400">
        {hasBudgetPlan
          ? `Kế hoạch đã lưu · Thực thu ${compact(actualIncome)} · Chi ${compact(totalSpent)}`
          : usesSuggestedPlan
          ? `Đang dùng Plan gợi ý ${compact(expectedIncome)} · Thực thu ${compact(actualIncome)} · Chi ${compact(totalSpent)}`
          : `Chưa lưu Plan tháng này · Thực thu ${compact(actualIncome)} · Chi ${compact(totalSpent)}`}
      </div>
    </div>
  );
}
