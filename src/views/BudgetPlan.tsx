import { useState, useEffect, useCallback } from 'react';
import {
  Loader2,
  AlertCircle,
  Wallet,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Pencil,
  Check,
  X,
  Lock,
  Plus,
} from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { cn } from '../lib/utils';
import {
  useBudgetPlan,
  useTransactions,
  useJars,
  useUpdateJar,
  useBudgetStatus,
  useCreateBudgetPeriod,
  useCloseBudgetPeriod,
  useBudgetSetting,
  useUpdateBudgetSetting,
  useInvestmentSummary,
} from '../lib/hooks';
import type { BudgetJar, Transaction, Jar } from '../lib/types';

// ── Jar styling ──────────────────────────────────────────────

const JAR_STYLES: Record<string, { color: string; bg: string; iconBg: string; progressBg: string; darkIconBg: string }> = {
  NEC:  { color: 'text-blue-600',   bg: 'bg-blue-50',   iconBg: 'bg-blue-100 text-blue-600',   progressBg: 'bg-blue-500',   darkIconBg: 'dark:bg-blue-500/20 dark:text-blue-400' },
  EDU:  { color: 'text-purple-600', bg: 'bg-purple-50', iconBg: 'bg-purple-100 text-purple-600', progressBg: 'bg-purple-500', darkIconBg: 'dark:bg-purple-500/20 dark:text-purple-400' },
  LTSS: { color: 'text-teal-600',   bg: 'bg-teal-50',   iconBg: 'bg-teal-100 text-teal-600',   progressBg: 'bg-teal-500',   darkIconBg: 'dark:bg-teal-500/20 dark:text-teal-400' },
  PLAY: { color: 'text-pink-600',   bg: 'bg-pink-50',   iconBg: 'bg-pink-100 text-pink-600',   progressBg: 'bg-pink-500',   darkIconBg: 'dark:bg-pink-500/20 dark:text-pink-400' },
  FFA:  { color: 'text-green-600',  bg: 'bg-green-50',  iconBg: 'bg-green-100 text-green-600',  progressBg: 'bg-green-500',  darkIconBg: 'dark:bg-green-500/20 dark:text-green-400' },
  GIVE: { color: 'text-amber-600',  bg: 'bg-amber-50',  iconBg: 'bg-amber-100 text-amber-600',  progressBg: 'bg-amber-500',  darkIconBg: 'dark:bg-amber-500/20 dark:text-amber-400' },
};

function getJarStyle(key: string) {
  return JAR_STYLES[key] ?? {
    color: 'text-slate-600', bg: 'bg-slate-50', iconBg: 'bg-slate-100 text-slate-600',
    progressBg: 'bg-slate-500', darkIconBg: 'dark:bg-slate-500/20 dark:text-slate-400',
  };
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'OK':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
          <CheckCircle2 className="size-3.5" /> Tốt
        </span>
      );
    case 'WARN':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">
          <AlertTriangle className="size-3.5" /> Cảnh báo
        </span>
      );
    case 'OVER':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400">
          <XCircle className="size-3.5" /> Vượt mức
        </span>
      );
    default:
      return null;
  }
}

// ── Editable percent inline ────────────────────────────────────

function EditablePercent({
  jar,
  dbJar,
  onSave,
  isSaving,
}: {
  jar: BudgetJar;
  dbJar: Jar | undefined;
  onSave: (jarId: number, percent: number) => void;
  isSaving: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(jar.percent));

  const handleSave = () => {
    const num = parseFloat(value);
    if (!isNaN(num) && num >= 0 && num <= 100 && dbJar) {
      onSave(dbJar.id, num);
      setEditing(false);
    }
  };

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors cursor-pointer"
        title="Sửa phần trăm"
      >
        {jar.key} · {jar.percent}%
        <Pencil className="size-3" />
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <input
        type="number"
        min={0}
        max={100}
        step={0.5}
        value={value}
        onChange={e => setValue(e.target.value)}
        className="w-14 text-xs px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-[#0c1222] text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
        autoFocus
        onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditing(false); }}
      />
      <span className="text-xs text-slate-500">%</span>
      <button onClick={handleSave} disabled={isSaving} className="text-green-600 hover:text-green-700 cursor-pointer">
        <Check className="size-3.5" />
      </button>
      <button onClick={() => setEditing(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
        <X className="size-3.5" />
      </button>
    </div>
  );
}

// ── Drill-down panel ──────────────────────────────────────────

function JarDrillDown({ jar, month }: { jar: BudgetJar; month: string }) {
  const { data, isPending } = useTransactions({
    month,
    flow: 'expense',
    jar: jar.key,
    pageSize: 100,
    sort: 'datetime_desc',
  });

  const txs = data?.data ?? [];

  if (isPending) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="size-5 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (txs.length === 0) {
    return <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-4">Không có giao dịch chi tiêu</p>;
  }

  return (
    <div className="divide-y divide-slate-100 dark:divide-slate-700 max-h-64 overflow-y-auto">
      {txs.map((tx: Transaction, idx: number) => (
        <div key={tx.idempotency_key ?? idx} className="flex items-center justify-between py-2.5 px-1">
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
              {tx.description ?? tx.category ?? '—'}
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500">{tx.date} {tx.time ? `· ${tx.time}` : ''}</span>
          </div>
          <span className="text-sm font-bold text-red-600 dark:text-red-400 shrink-0 ml-3">
            {formatCurrency(tx.amount_vnd)}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────

export default function BudgetPlan({ month }: { month: string }) {
  const [expandedJar, setExpandedJar] = useState<string | null>(null);

  // Editable total plan (base_income override) — persisted to DB
  const [editingPlan, setEditingPlan] = useState(false);
  const [planValue, setPlanValue] = useState('');

  const { data: settingRes } = useBudgetSetting(month);
  const updateSettingMutation = useUpdateBudgetSetting();
  const planOverride = settingRes?.data?.base_income_override ?? null;

  const { data, isPending, error } = useBudgetPlan(month, planOverride);
  const { data: jarsRes } = useJars();
  const updateJarMutation = useUpdateJar();
  const { data: budgetStatus } = useBudgetStatus(month);
  const createPeriodMutation = useCreateBudgetPeriod();
  const closePeriodMutation = useCloseBudgetPeriod();
  const { data: investmentData } = useInvestmentSummary(month);

  useEffect(() => {
    if (data?.data?.base_income) {
      setPlanValue(String(data.data.base_income));
    }
  }, [data?.data?.base_income]);

  const dbJars = jarsRes?.data ?? [];

  const handleSavePercent = useCallback((jarId: number, percent: number) => {
    updateJarMutation.mutate({ id: jarId, payload: { percent } });
  }, [updateJarMutation]);

  if (isPending) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="size-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl p-6 text-center max-w-7xl mx-auto">
        <AlertCircle className="size-8 text-red-400 mx-auto mb-2" />
        <p className="text-red-700 dark:text-red-400 font-medium">{error?.message}</p>
      </div>
    );
  }

  if (!data) return null;

  const plan = data.data;
  const { summary, jars } = plan;

  const toggleJar = (key: string) => {
    setExpandedJar(expandedJar === key ? null : key);
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-slate-900 dark:text-white text-3xl font-bold tracking-tight">
            Phân bổ Ngân sách tháng
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {budgetStatus && !budgetStatus.has_period && (
            <button
              onClick={() => createPeriodMutation.mutate({ month, total_income: budgetStatus.income })}
              disabled={createPeriodMutation.isPending}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 disabled:opacity-50"
            >
              {createPeriodMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              Tạo kỳ ngân sách
            </button>
          )}
          {budgetStatus && budgetStatus.has_period && budgetStatus.period_status === 'open' && (
            <button
              onClick={() => {
                if (budgetStatus.unassigned !== 0) {
                  alert(`Chưa phân bổ hết: ${formatCurrency(budgetStatus.unassigned)} còn dư. Hãy phân bổ hết trước khi đóng tháng.`);
                  return;
                }
                const periodId = (budgetStatus as any).period_id;
                if (periodId) closePeriodMutation.mutate(periodId);
              }}
              disabled={closePeriodMutation.isPending}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 disabled:opacity-50"
            >
              {closePeriodMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Lock className="size-4" />}
              Đóng tháng
            </button>
          )}
        </div>
      </div>

      {/* Allocation Status Bar */}
      {budgetStatus && (
        <div className="bg-white dark:bg-[#1a2433] rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-slate-700 dark:text-slate-200">Trạng thái phân bổ</span>
              <span className={cn(
                "font-bold text-sm",
                budgetStatus.unassigned === 0
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              )}>
                {budgetStatus.unassigned === 0 ? '✓ Đã cân bằng' : `Còn ${formatCurrency(budgetStatus.unassigned)} chưa phân bổ`}
              </span>
            </div>
            <div className="flex items-center gap-1 h-4 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-700">
              {budgetStatus.income > 0 && (
                <>
                  <div
                    className="h-full bg-blue-500 rounded-l-full"
                    style={{ width: `${Math.min(100, (budgetStatus.assigned / budgetStatus.income) * 100)}%` }}
                    title={`Đã phân bổ: ${formatCurrency(budgetStatus.assigned)}`}
                  />
                  {budgetStatus.unassigned > 0 && (
                    <div
                      className="h-full bg-red-400 rounded-r-full"
                      style={{ width: `${(budgetStatus.unassigned / budgetStatus.income) * 100}%` }}
                      title={`Chưa phân bổ: ${formatCurrency(budgetStatus.unassigned)}`}
                    />
                  )}
                </>
              )}
            </div>
            <div className="grid grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-400 dark:text-slate-500">Thu nhập</span>
                <p className="font-bold text-slate-800 dark:text-slate-200">{formatCurrency(budgetStatus.income)}</p>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500">Đã phân bổ</span>
                <p className="font-bold text-blue-600 dark:text-blue-400">{formatCurrency(budgetStatus.assigned)}</p>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500">Chưa phân bổ</span>
                <p className={cn("font-bold", budgetStatus.unassigned === 0 ? "text-green-600" : "text-red-600")}>
                  {formatCurrency(budgetStatus.unassigned)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* BASE INCOME — read-only from Sheet */}
        <div className="relative overflow-hidden rounded-xl bg-white dark:bg-[#1a2433] p-6 shadow-sm border border-slate-100 dark:border-slate-700">
          <div className="absolute right-0 top-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full bg-blue-50 dark:bg-blue-500/10" />
          <div className="relative z-10 flex flex-col gap-1">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Thu nhập gốc</span>
            <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {formatCurrency(plan.sheet_income ?? plan.base_income)}
            </h3>
            <div className="mt-2 flex items-center gap-1 text-sm font-medium text-blue-600 dark:text-blue-400">
              <Wallet className="size-4" />
              <span>Từ Sheet (tự động)</span>
            </div>
          </div>
        </div>

        {/* TOTAL PLANNED — editable */}
        <div className="relative overflow-hidden rounded-xl bg-white dark:bg-[#1a2433] p-6 shadow-sm border border-slate-100 dark:border-slate-700">
          <div className="absolute right-0 top-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full bg-green-50 dark:bg-green-500/10" />
          <div className="relative z-10 flex flex-col gap-1">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Tổng kế hoạch</span>
            {editingPlan ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  value={planValue}
                  onChange={e => {
                    const raw = e.target.value.replace(/\D/g, '');
                    setPlanValue(raw);
                  }}
                  className="w-36 text-lg font-bold px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-[#0c1222] text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  autoFocus
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      const num = Number(planValue);
                      if (num > 0) {
                        updateSettingMutation.mutate({ month, baseIncomeOverride: num });
                      }
                      setEditingPlan(false);
                    }
                    if (e.key === 'Escape') {
                      setPlanValue(String(plan.base_income));
                      setEditingPlan(false);
                    }
                  }}
                />
                <button
                  onClick={() => {
                    const num = Number(planValue);
                    if (num > 0) {
                      updateSettingMutation.mutate({ month, baseIncomeOverride: num });
                    }
                    setEditingPlan(false);
                  }}
                  className="text-green-600 hover:text-green-700 cursor-pointer"
                >
                  <Check className="size-5" />
                </button>
                <button
                  onClick={() => {
                    setPlanValue(String(plan.base_income));
                    updateSettingMutation.mutate({ month, baseIncomeOverride: null });
                    setEditingPlan(false);
                  }}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="size-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h3 className="text-2xl font-bold tracking-tight text-green-600 dark:text-green-400">
                  {formatCurrency(summary.total_planned)}
                </h3>
                <button
                  onClick={() => {
                    setPlanValue(String(plan.base_income));
                    setEditingPlan(true);
                  }}
                  className="text-slate-400 hover:text-blue-500 cursor-pointer"
                  title="Sửa tổng kế hoạch"
                >
                  <Pencil className="size-4" />
                </button>
              </div>
            )}
            <div className="mt-2 flex items-center gap-1 text-sm font-medium text-green-600 dark:text-green-400">
              <TrendingUp className="size-4" />
              <span>{planOverride ? 'Đã tuỳ chỉnh' : `~${Math.round((summary.total_planned / (plan.sheet_income || plan.base_income)) * 100)}%`}</span>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-xl bg-white dark:bg-[#1a2433] p-6 shadow-sm border border-slate-100 dark:border-slate-700">
          <div className="absolute right-0 top-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full bg-red-50 dark:bg-red-500/10" />
          <div className="relative z-10 flex flex-col gap-1">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Đã chi thực tế</span>
            <h3 className="text-2xl font-bold tracking-tight text-red-600 dark:text-red-400">
              {formatCurrency(summary.total_actual)}
            </h3>
            <div className="mt-2 flex items-center gap-1 text-sm font-medium text-red-600 dark:text-red-400">
              <TrendingDown className="size-4" />
              <span>{Math.round(summary.usage_pct * 100) / 100}%</span>
            </div>
          </div>
        </div>

        <div className={`relative overflow-hidden rounded-xl p-6 shadow-sm border ${summary.total_remaining >= 0 ? 'bg-gradient-to-br from-emerald-600 to-emerald-800 text-white' : 'bg-gradient-to-br from-red-600 to-red-800 text-white'}`}>
          <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-white/10" />
          <div className="relative z-10 flex flex-col gap-1">
            <span className="text-sm font-medium text-white/80">Còn lại</span>
            <h3 className="text-2xl font-bold tracking-tight">
              {formatCurrency(summary.total_remaining)}
            </h3>
            <div className="mt-2 flex items-center gap-1 text-sm font-medium text-white/90">
              <Wallet className="size-4" />
              <span>{Math.round((100 - summary.usage_pct) * 100) / 100}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Investment Allocation Card */}
      {investmentData?.data && investmentData.data.funds.length > 0 && (() => {
        const inv = investmentData.data;
        const varianceColor = inv.total_variance === 0
          ? 'text-green-600 dark:text-green-400'
          : inv.total_variance > 0
            ? 'text-amber-600 dark:text-amber-400'
            : 'text-red-600 dark:text-red-400';
        const actualPct = inv.total_monthly_planned > 0
          ? Math.round((inv.total_monthly_actual / inv.total_monthly_planned) * 100)
          : 0;

        return (
          <div className="bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-500/10 dark:to-violet-500/10 rounded-xl border border-indigo-200 dark:border-indigo-500/30 shadow-sm overflow-hidden">
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-lg flex items-center justify-center bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
                    <TrendingUp className="size-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white">Đầu tư</h3>
                    <span className="text-xs text-slate-400 dark:text-slate-500">Investment Allocation</span>
                  </div>
                </div>
                {inv.total_monthly_actual >= inv.total_monthly_planned && inv.total_monthly_planned > 0 ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
                    <CheckCircle2 className="size-3.5" /> Đã đủ
                  </span>
                ) : inv.total_monthly_actual > 0 ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">
                    <AlertTriangle className="size-3.5" /> Đang tích
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 dark:bg-slate-500/20 dark:text-slate-400">
                    Chưa bắt đầu
                  </span>
                )}
              </div>

              {/* Progress bar */}
              <div className="mb-4">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Tiến độ {actualPct}%</span>
                  <span className="text-slate-500 dark:text-slate-400 font-medium">
                    {formatCurrency(inv.total_monthly_actual)} / {formatCurrency(inv.total_monthly_planned)}
                  </span>
                </div>
                <div className="h-2.5 w-full bg-white/60 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500 bg-indigo-500"
                    style={{ width: `${Math.min(actualPct, 100)}%` }}
                  />
                </div>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-4 gap-3">
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold">Kế hoạch</span>
                  <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{formatCurrency(inv.total_monthly_planned)}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold">Thực tế</span>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{formatCurrency(inv.total_monthly_actual)}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold">Chênh lệch</span>
                  <span className={cn("text-sm font-bold", varianceColor)}>
                    {inv.total_variance >= 0 ? '' : '-'}{formatCurrency(Math.abs(inv.total_variance))}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold">Tích lũy</span>
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(inv.total_cumulative_contributed)}</span>
                </div>
              </div>

              {/* Per-fund breakdown (if multiple investment funds) */}
              {inv.funds.length > 1 && (
                <div className="mt-4 pt-4 border-t border-indigo-200/50 dark:border-indigo-500/20 space-y-2">
                  {inv.funds.map((fund) => {
                    const pct = fund.monthly_planned > 0
                      ? Math.round((fund.monthly_actual / fund.monthly_planned) * 100)
                      : 0;
                    return (
                      <div key={fund.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-medium text-slate-700 dark:text-slate-200 truncate">{fund.name}</span>
                          {fund.jar && (
                            <span className="text-xs text-slate-400 dark:text-slate-500">({fund.jar.label})</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-xs text-slate-400">{pct}%</span>
                          <span className="font-bold text-slate-700 dark:text-slate-200">
                            {formatCurrency(fund.monthly_actual)} / {formatCurrency(fund.monthly_planned)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Jar cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {jars.map((jar) => {
          const style = getJarStyle(jar.key);
          const isExpanded = expandedJar === jar.key;
          const progressWidth = Math.min(jar.usage_pct, 100);
          const dbJar = dbJars.find((j: Jar) => j.key === jar.key);

          return (
            <div
              key={jar.key}
              className="bg-white dark:bg-[#1a2433] rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden transition-shadow hover:shadow-md"
            >
              {/* Card header */}
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`size-10 rounded-lg flex items-center justify-center ${style.iconBg} ${style.darkIconBg}`}>
                      <Wallet className="size-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white">{jar.label}</h3>
                      <EditablePercent
                        jar={jar}
                        dbJar={dbJar}
                        onSave={handleSavePercent}
                        isSaving={updateJarMutation.isPending}
                      />
                    </div>
                  </div>
                  <StatusBadge status={jar.status} />
                </div>

                {/* Progress bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">Đã dùng {Math.round(jar.usage_pct * 100) / 100}%</span>
                    <span className="text-slate-500 dark:text-slate-400 font-medium">
                      {formatCurrency(jar.actual_amount)} / {formatCurrency(jar.planned_amount)}
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        jar.status === 'OVER'
                          ? 'bg-red-500'
                          : jar.status === 'WARN'
                            ? 'bg-amber-500'
                            : style.progressBg
                      }`}
                      style={{ width: `${progressWidth}%` }}
                    />
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold">Kế hoạch</span>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{formatCurrency(jar.planned_amount)}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold">Thực tế</span>
                    <span className="text-sm font-bold text-red-600 dark:text-red-400">{formatCurrency(jar.actual_amount)}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold">Còn lại</span>
                    <span className={`text-sm font-bold ${jar.remaining >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                      {jar.remaining >= 0 ? '' : '-'}{formatCurrency(Math.abs(jar.remaining))}
                    </span>
                  </div>
                </div>
              </div>

              {/* Drill-down toggle */}
              <button
                onClick={() => toggleJar(jar.key)}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-[#0c1222] hover:bg-slate-100 dark:hover:bg-slate-800 border-t border-slate-100 dark:border-slate-700 transition-colors cursor-pointer"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="size-3.5" /> Thu gọn
                  </>
                ) : (
                  <>
                    <ChevronDown className="size-3.5" /> Xem giao dịch
                  </>
                )}
              </button>

              {/* Drill-down transactions */}
              {isExpanded && (
                <div className="border-t border-slate-100 dark:border-slate-700 px-5 py-3 bg-slate-50/50 dark:bg-[#0c1222]/50">
                  <JarDrillDown jar={jar} month={month} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

