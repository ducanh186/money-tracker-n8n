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
import { getRecentMonths, fetchDashboardSummary } from '../lib/api';
import { Loader2 } from 'lucide-react';

const MAX_RETRIES = 2;

const formatAxis = (value: number) => {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(0)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return value.toString();
};

const SHORT_MONTH: Record<string, string> = {
  Jan: 'Thg 1', Feb: 'Thg 2', Mar: 'Thg 3', Apr: 'Thg 4',
  May: 'Thg 5', Jun: 'Thg 6', Jul: 'Thg 7', Aug: 'Thg 8',
  Sep: 'Thg 9', Oct: 'Thg 10', Nov: 'Thg 11', Dec: 'Thg 12',
};

type Range = 6 | 12;

export function IncomeExpenseChart({ currentMonth }: { currentMonth: string }) {
  const [range, setRange] = useState<Range>(6);

  // Build list of months in chronological order (oldest first)
  const months = useMemo(() => {
    const all = getRecentMonths(range); // latest first
    return [...all].reverse(); // oldest first for chart
  }, [range]);

  // Use useQueries for dynamic parallel queries (safe with Rules of Hooks)
  const queries = useQueries({
    queries: months.map(m => ({
      queryKey: ['dashboard-summary', m],
      queryFn: () => fetchDashboardSummary(m),
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      retry: MAX_RETRIES,
    })),
  });

  const isPending = queries.some(q => q.isPending);

  const chartData = useMemo(() => {
    return months.map((m, i) => {
      const totals = queries[i]?.data?.data?.totals;
      const abbr = m.split('-')[0];
      return {
        name: SHORT_MONTH[abbr] ?? abbr,
        income: totals?.income_vnd ?? 0,
        expense: totals?.expense_vnd ?? 0,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [months, ...queries.map(q => q.data)]);

  return (
    <div className="bg-white dark:bg-[#1e293b] rounded-xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm h-[400px] flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-slate-900 dark:text-white font-semibold text-lg">Thu nhập vs Chi tiêu</h3>
        <select
          value={range}
          onChange={e => setRange(Number(e.target.value) as Range)}
          className="bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500 cursor-pointer"
        >
          <option value={6}>6 tháng gần nhất</option>
          <option value={12}>12 tháng</option>
        </select>
      </div>

      {isPending ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="size-6 text-blue-500 animate-spin" />
        </div>
      ) : (
        <div className="flex-1 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                tickFormatter={formatAxis}
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
