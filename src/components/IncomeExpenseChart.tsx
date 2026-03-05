import { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useQueries } from '@tanstack/react-query';
import { getRecentMonths, fetchDashboardSummary, fetchTransactions } from '../lib/api';
import type { Transaction } from '../lib/types';
import { Loader2, ZoomIn, ZoomOut } from 'lucide-react';

const MAX_RETRIES = 2;

/* ------------------------------------------------------------------ */
/*  Formatters                                                         */
/* ------------------------------------------------------------------ */

const formatAxis = (value: number) => {
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (abs >= 1_000_000) {
    const m = abs / 1_000_000;
    return `${sign}${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M`;
  }
  if (abs >= 1_000) {
    const k = abs / 1_000;
    return `${sign}${k % 1 === 0 ? k.toFixed(0) : k.toFixed(0)}K`;
  }
  return value.toString();
};

const SHORT_MONTH: Record<string, string> = {
  Jan: 'Thg 1', Feb: 'Thg 2', Mar: 'Thg 3', Apr: 'Thg 4',
  May: 'Thg 5', Jun: 'Thg 6', Jul: 'Thg 7', Aug: 'Thg 8',
  Sep: 'Thg 9', Oct: 'Thg 10', Nov: 'Thg 11', Dec: 'Thg 12',
};

const MONTH_ABBRS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/* ------------------------------------------------------------------ */
/*  Range configuration                                                */
/* ------------------------------------------------------------------ */

type RangeKey = '1d' | '3d' | '1w' | '2w' | '1m' | '3m' | '6m' | '9m' | '12m';

const RANGE_OPTIONS: { key: RangeKey; label: string }[] = [
  { key: '1d', label: '1 ngày' },
  { key: '3d', label: '3 ngày' },
  { key: '1w', label: '1 tuần' },
  { key: '2w', label: '2 tuần' },
  { key: '1m', label: '1 tháng' },
  { key: '3m', label: '3 tháng' },
  { key: '6m', label: '6 tháng gần nhất' },
  { key: '9m', label: '9 tháng gần nhất' },
  { key: '12m', label: '12 tháng' },
];

const MONTH_RANGES = new Set<RangeKey>(['1m', '3m', '6m', '9m', '12m']);
const MONTH_COUNT: Record<string, number> = { '1m': 1, '3m': 3, '6m': 6, '9m': 9, '12m': 12 };
const DAY_COUNT: Record<string, number> = { '1d': 1, '3d': 3, '1w': 7, '2w': 14 };

/* ------------------------------------------------------------------ */
/*  Y-axis scale presets                                               */
/* ------------------------------------------------------------------ */

function buildTicks(min: number, max: number, step: number): number[] {
  const t: number[] = [];
  for (let v = min; v <= max + step * 0.01; v += step) t.push(Math.round(v));
  return t;
}

interface ScalePreset {
  label: string;
  domain?: [number, number];
  ticks?: number[];
}

const SCALE_PRESETS: ScalePreset[] = [
  { label: 'Tự động' },
  { label: '±5M', domain: [-5_000_000, 5_000_000], ticks: buildTicks(-5_000_000, 5_000_000, 1_000_000) },
  { label: '±2M', domain: [-2_000_000, 2_000_000], ticks: buildTicks(-2_000_000, 2_000_000, 500_000) },
  { label: '±1M', domain: [-1_000_000, 1_000_000], ticks: buildTicks(-1_000_000, 1_000_000, 200_000) },
  { label: '±500K', domain: [-500_000, 500_000], ticks: buildTicks(-500_000, 500_000, 100_000) },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function toMonthKey(d: Date): string {
  return `${MONTH_ABBRS[d.getMonth()]}-${d.getFullYear()}`;
}

function dateSortKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function shortDateLabel(d: Date): string {
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

function buildDayRange(days: number): { key: string; label: string }[] {
  const result: { key: string; label: string }[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    result.push({ key: dateSortKey(d), label: shortDateLabel(d) });
  }
  return result;
}

function txDateKey(tx: Transaction): string | null {
  if (tx.datetime_iso) return tx.datetime_iso.slice(0, 10);
  if (tx.date) {
    const parts = tx.date.split('/');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
  }
  return null;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function IncomeExpenseChart({ currentMonth }: { currentMonth: string }) {
  const [range, setRange] = useState<RangeKey>('6m');
  const [scaleIdx, setScaleIdx] = useState(0);

  const isMonthly = MONTH_RANGES.has(range);
  const scale = SCALE_PRESETS[scaleIdx];

  /* ---- Monthly data ---- */
  const months = useMemo(() => {
    if (!isMonthly) return [];
    return [...getRecentMonths(MONTH_COUNT[range] ?? 6)].reverse();
  }, [isMonthly, range]);

  const monthQueries = useQueries({
    queries: months.map(m => ({
      queryKey: ['dashboard-summary', m],
      queryFn: () => fetchDashboardSummary(m),
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      retry: MAX_RETRIES,
    })),
  });

  /* ---- Daily data (sub-month ranges) ---- */
  const dailyMonths = useMemo(() => {
    if (isMonthly) return [];
    const days = DAY_COUNT[range] ?? 7;
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - days + 1);
    const set = new Set<string>();
    set.add(currentMonth);
    set.add(toMonthKey(start));
    return [...set];
  }, [isMonthly, range, currentMonth]);

  const txQueries = useQueries({
    queries: dailyMonths.map(m => ({
      queryKey: ['transactions', m, 'chart-daily'],
      queryFn: () => fetchTransactions({ month: m, pageSize: 500, sort: 'datetime_asc' }),
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      retry: MAX_RETRIES,
    })),
  });

  const isPending = isMonthly
    ? monthQueries.some(q => q.isPending)
    : txQueries.some(q => q.isPending);

  /* ---- Build chart data ---- */
  const chartData = useMemo(() => {
    if (isMonthly) {
      return months.map((m, i) => {
        const totals = monthQueries[i]?.data?.data?.totals;
        const abbr = m.split('-')[0];
        return {
          name: SHORT_MONTH[abbr] ?? abbr,
          income: totals?.income_vnd ?? 0,
          expense: totals?.expense_vnd ?? 0,
        };
      });
    }

    // Daily mode
    const allTxs = txQueries.flatMap(q => q.data?.data ?? []);
    const days = DAY_COUNT[range] ?? 7;
    const dayRange = buildDayRange(days);
    const startKey = dayRange[0]?.key ?? '';

    const byDate: Record<string, { income: number; expense: number }> = {};
    for (const tx of allTxs) {
      const key = txDateKey(tx);
      if (!key || key < startKey || !tx.flow) continue;
      if (!byDate[key]) byDate[key] = { income: 0, expense: 0 };
      if (tx.flow === 'income') byDate[key].income += tx.signed_amount_vnd;
      if (tx.flow === 'expense') byDate[key].expense += tx.signed_amount_vnd;
    }

    return dayRange.map(({ key, label }) => ({
      name: label,
      income: byDate[key]?.income ?? 0,
      expense: byDate[key]?.expense ?? 0,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMonthly, months, range, ...monthQueries.map(q => q.data), ...txQueries.map(q => q.data)]);

  return (
    <div className="bg-white dark:bg-[#1e293b] rounded-xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm h-[400px] flex flex-col">
      <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
        <h3 className="text-slate-900 dark:text-white font-semibold text-lg whitespace-nowrap">
          Thu nhập vs Chi tiêu
        </h3>
        <div className="flex items-center gap-2">
          {/* Scale controls */}
          <div className="flex items-center bg-slate-100 dark:bg-[#0f172a] rounded-lg px-1 py-0.5">
            <button
              onClick={() => setScaleIdx(i => Math.max(i - 1, 0))}
              disabled={scaleIdx === 0}
              className="p-1 rounded text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white disabled:opacity-30 transition-colors"
              title="Thu nhỏ"
            >
              <ZoomOut className="size-3.5" />
            </button>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 min-w-[44px] text-center select-none">
              {scale.label}
            </span>
            <button
              onClick={() => setScaleIdx(i => Math.min(i + 1, SCALE_PRESETS.length - 1))}
              disabled={scaleIdx === SCALE_PRESETS.length - 1}
              className="p-1 rounded text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white disabled:opacity-30 transition-colors"
              title="Phóng to"
            >
              <ZoomIn className="size-3.5" />
            </button>
          </div>
          {/* Range dropdown */}
          <select
            value={range}
            onChange={e => setRange(e.target.value as RangeKey)}
            className="bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            {RANGE_OPTIONS.map(o => (
              <option key={o.key} value={o.key}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {isPending ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="size-6 text-blue-500 animate-spin" />
        </div>
      ) : (
        <div className="flex-1 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                tickFormatter={formatAxis}
                {...(scale.domain
                  ? { domain: scale.domain, ticks: scale.ticks, allowDataOverflow: true }
                  : {})}
              />
              <Tooltip
                cursor={{ fill: '#334155', opacity: 0.4 }}
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  color: '#f8fafc',
                  borderRadius: '8px',
                }}
                formatter={(value: number) => [`${value.toLocaleString('vi-VN')} ₫`, undefined]}
              />
              <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
              <Bar dataKey="income" name="Thu nhập" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
              <Bar dataKey="expense" name="Chi tiêu" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
