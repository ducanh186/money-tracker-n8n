import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useDashboardSummary } from '../lib/hooks';
import { useDarkMode } from '../lib/hooks';
import { formatMonthLabel } from '../lib/api';
import { Loader2 } from 'lucide-react';
import { getJar } from '../lib/jars';
import type { JarKey } from '../lib/jars';

// Fallback palette for custom jars (non-standard jar keys from API)
const FALLBACK_PALETTE = [
  '#60a5fa', '#c084fc', '#4ade80', '#facc15',
  '#f87171', '#22d3ee', '#e879f9', '#a3e635',
];

function jarColorFor(name: string, mode: 'light' | 'dark', index: number): string {
  const jar = getJar(name as JarKey);
  if (jar) return mode === 'dark' ? jar.hex_dark : jar.hex_light;
  return FALLBACK_PALETTE[index % FALLBACK_PALETTE.length];
}

const formatShort = (value: number) => {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return value.toString();
};

// Custom legend with percentage
function renderLegend({ payload }: { payload?: Array<{ value: string; color: string; payload: { value: number; pct: number } }> }) {
  if (!payload) return null;
  return (
    <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2 px-2">
      {payload.map((entry, i) => (
        <li key={i} className="flex items-center gap-1.5 text-xs" style={{ color: entry.color }}>
          <span className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
          <span className="font-semibold">{entry.value}</span>
          <span className="opacity-70">{entry.payload?.pct ?? 0}%</span>
        </li>
      ))}
    </ul>
  );
}

export function ExpenseStructureChart({ month }: { month: string }) {
  const { data: summaryRes, isPending } = useDashboardSummary(month);
  const isDark = useDarkMode();

  const { chartData, total } = useMemo(() => {
    const expenseByJar = summaryRes?.data?.expense_by_jar ?? {};
    let tot = 0;
    const items = Object.entries(expenseByJar)
      .filter(([, v]) => v !== 0)
      .map(([name, value], index) => {
        const absValue = Math.abs(value);
        tot += absValue;
        return {
          name,
          value: absValue,
          color: jarColorFor(name, isDark ? 'dark' : 'light', index),
          pct: 0, // filled after tot is known
        };
      });
    // fill pct now that tot is known
    items.forEach(item => { item.pct = tot > 0 ? Math.round((item.value / tot) * 100) : 0; });
    return { chartData: items, total: tot };
  }, [summaryRes, isDark]);

  const bgColor = isDark ? '#0f172a' : '#ffffff';
  const borderColor = isDark ? '#334155' : '#e2e8f0';

  const tooltipStyle = {
    backgroundColor: bgColor,
    borderColor,
    color: isDark ? '#f1f5f9' : '#0f172a',
    borderRadius: '10px',
    fontSize: '13px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
  };

  return (
    <div className="bg-white dark:bg-[#1a2433] rounded-xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm h-[400px] flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-slate-900 dark:text-white font-semibold text-lg">Cơ cấu chi tiêu - 6 Hũ</h3>
      </div>
      <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">{formatMonthLabel(month)}</p>

      {isPending ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="size-6 text-blue-500 animate-spin" />
        </div>
      ) : chartData.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
          Không có dữ liệu chi tiêu
        </div>
      ) : (
        <div className="flex-1 w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="42%"
                innerRadius={68}
                outerRadius={105}
                paddingAngle={3}
                dataKey="value"
                stroke={isDark ? '#1a2433' : '#ffffff'}
                strokeWidth={2}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value: number, name: string) => [
                  `${value.toLocaleString('vi-VN')} ₫`,
                  name,
                ]}
              />
              <Legend content={renderLegend as any} />
            </PieChart>
          </ResponsiveContainer>

          {/* Center Text */}
          <div className="absolute top-[37%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
            <div className="text-slate-400 dark:text-slate-500 text-xs font-medium tracking-wide uppercase">Tổng chi</div>
            <div className="text-slate-900 dark:text-white font-extrabold text-2xl leading-tight">{formatShort(total)}</div>
          </div>
        </div>
      )}
    </div>
  );
}
