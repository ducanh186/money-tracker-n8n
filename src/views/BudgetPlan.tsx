import { useState } from 'react';
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
} from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { useBudgetPlan } from '../lib/hooks';
import { useTransactions } from '../lib/hooks';
import type { BudgetJar, Transaction } from '../lib/types';

// ── Jar styling ──────────────────────────────────────────────

const JAR_STYLES: Record<string, { color: string; bg: string; iconBg: string; progressBg: string }> = {
  NEC:  { color: 'text-blue-600',   bg: 'bg-blue-50',   iconBg: 'bg-blue-100 text-blue-600',   progressBg: 'bg-blue-500' },
  EDU:  { color: 'text-purple-600', bg: 'bg-purple-50', iconBg: 'bg-purple-100 text-purple-600', progressBg: 'bg-purple-500' },
  LTSS: { color: 'text-teal-600',   bg: 'bg-teal-50',   iconBg: 'bg-teal-100 text-teal-600',   progressBg: 'bg-teal-500' },
  PLAY: { color: 'text-pink-600',   bg: 'bg-pink-50',   iconBg: 'bg-pink-100 text-pink-600',   progressBg: 'bg-pink-500' },
  FFA:  { color: 'text-green-600',  bg: 'bg-green-50',  iconBg: 'bg-green-100 text-green-600',  progressBg: 'bg-green-500' },
  GIVE: { color: 'text-amber-600',  bg: 'bg-amber-50',  iconBg: 'bg-amber-100 text-amber-600',  progressBg: 'bg-amber-500' },
};

function getJarStyle(key: string) {
  return JAR_STYLES[key] ?? { color: 'text-slate-600', bg: 'bg-slate-50', iconBg: 'bg-slate-100 text-slate-600', progressBg: 'bg-slate-500' };
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'OK':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
          <CheckCircle2 className="size-3.5" /> Tốt
        </span>
      );
    case 'WARN':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
          <AlertTriangle className="size-3.5" /> Cảnh báo
        </span>
      );
    case 'OVER':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">
          <XCircle className="size-3.5" /> Vượt mức
        </span>
      );
    default:
      return null;
  }
}

// ── Drill-down panel ──────────────────────────────────────────

function JarDrillDown({ jar, month }: { jar: BudgetJar; month: string }) {
  const { data, isPending } = useTransactions({
    month,
    flow: 'expense',
    jar: jar.label,
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
    return <p className="text-sm text-slate-400 text-center py-4">Không có giao dịch chi tiêu</p>;
  }

  return (
    <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
      {txs.map((tx: Transaction, idx: number) => (
        <div key={tx.idempotency_key ?? idx} className="flex items-center justify-between py-2.5 px-1">
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-medium text-slate-800 truncate">
              {tx.description ?? tx.category ?? '—'}
            </span>
            <span className="text-xs text-slate-400">{tx.date} {tx.time ? `· ${tx.time}` : ''}</span>
          </div>
          <span className="text-sm font-bold text-red-600 shrink-0 ml-3">
            {formatCurrency(tx.amount_vnd)}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────

export default function BudgetPlan({ month }: { month: string }) {
  const { data, isPending, error } = useBudgetPlan(month);
  const [expandedJar, setExpandedJar] = useState<string | null>(null);

  if (isPending) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="size-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center max-w-7xl mx-auto">
        <AlertCircle className="size-8 text-red-400 mx-auto mb-2" />
        <p className="text-red-700 font-medium">{error?.message}</p>
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
      <div className="flex flex-col gap-1">
        <h2 className="text-slate-900 text-3xl font-bold tracking-tight">
          Đối chiếu Kế hoạch Chi tiêu
        </h2>
        <p className="text-slate-500 text-base">
          So sánh kế hoạch ngân sách với thực tế chi tiêu theo hũ
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative overflow-hidden rounded-xl bg-white p-6 shadow-sm border border-slate-100">
          <div className="absolute right-0 top-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full bg-blue-50" />
          <div className="relative z-10 flex flex-col gap-1">
            <span className="text-sm font-medium text-slate-500">Thu nhập gốc</span>
            <h3 className="text-2xl font-bold tracking-tight text-slate-900">
              {formatCurrency(plan.base_income)}
            </h3>
            <div className="mt-2 flex items-center gap-1 text-sm font-medium text-blue-600">
              <Wallet className="size-4" />
              <span>Base</span>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-xl bg-white p-6 shadow-sm border border-slate-100">
          <div className="absolute right-0 top-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full bg-green-50" />
          <div className="relative z-10 flex flex-col gap-1">
            <span className="text-sm font-medium text-slate-500">Tổng kế hoạch</span>
            <h3 className="text-2xl font-bold tracking-tight text-green-600">
              {formatCurrency(summary.total_planned)}
            </h3>
            <div className="mt-2 flex items-center gap-1 text-sm font-medium text-green-600">
              <TrendingUp className="size-4" />
              <span>100%</span>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-xl bg-white p-6 shadow-sm border border-slate-100">
          <div className="absolute right-0 top-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full bg-red-50" />
          <div className="relative z-10 flex flex-col gap-1">
            <span className="text-sm font-medium text-slate-500">Đã chi thực tế</span>
            <h3 className="text-2xl font-bold tracking-tight text-red-600">
              {formatCurrency(summary.total_actual)}
            </h3>
            <div className="mt-2 flex items-center gap-1 text-sm font-medium text-red-600">
              <TrendingDown className="size-4" />
              <span>{summary.usage_pct}%</span>
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
              <span>{100 - summary.usage_pct}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Jar cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {jars.map((jar) => {
          const style = getJarStyle(jar.key);
          const isExpanded = expandedJar === jar.key;
          const progressWidth = Math.min(jar.usage_pct, 100);

          return (
            <div
              key={jar.key}
              className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-shadow hover:shadow-md"
            >
              {/* Card header */}
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`size-10 rounded-lg flex items-center justify-center ${style.iconBg}`}>
                      <Wallet className="size-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">{jar.label}</h3>
                      <p className="text-xs text-slate-400 font-medium">{jar.key} · {jar.percent}%</p>
                    </div>
                  </div>
                  <StatusBadge status={jar.status} />
                </div>

                {/* Progress bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-500 font-medium">Đã dùng {jar.usage_pct}%</span>
                    <span className="text-slate-500 font-medium">
                      {formatCurrency(jar.actual_amount)} / {formatCurrency(jar.planned_amount)}
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
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
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Kế hoạch</span>
                    <span className="text-sm font-bold text-slate-700">{formatCurrency(jar.planned_amount)}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Thực tế</span>
                    <span className="text-sm font-bold text-red-600">{formatCurrency(jar.actual_amount)}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Còn lại</span>
                    <span className={`text-sm font-bold ${jar.remaining >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {jar.remaining >= 0 ? '' : '-'}{formatCurrency(Math.abs(jar.remaining))}
                    </span>
                  </div>
                </div>
              </div>

              {/* Drill-down toggle */}
              <button
                onClick={() => toggleJar(jar.key)}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-slate-500 bg-slate-50 hover:bg-slate-100 border-t border-slate-100 transition-colors"
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
                <div className="border-t border-slate-100 px-5 py-3 bg-slate-50/50">
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
