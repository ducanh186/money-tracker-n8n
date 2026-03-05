import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useDashboardSummary } from '../lib/hooks';
import { formatMonthLabel } from '../lib/api';
import { Loader2 } from 'lucide-react';

const JAR_COLORS: Record<string, string> = {
  'Thiết yếu': '#3b82f6',
  'Giáo dục': '#8b5cf6',
  'Tiết kiệm dài hạn': '#10b981',
  'Hưởng thụ': '#f59e0b',
  'Tự do tài chính': '#ec4899',
  'Từ thiện': '#06b6d4',
};

const formatShort = (value: number) => {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return value.toString();
};

export function ExpenseStructureChart({ month }: { month: string }) {
  const { data: summaryRes, isPending } = useDashboardSummary(month);

  const { chartData, total } = useMemo(() => {
    const expenseByJar = summaryRes?.data?.expense_by_jar ?? {};
    let tot = 0;
    const items = Object.entries(expenseByJar)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => {
        tot += value;
        return {
          name,
          value,
          color: JAR_COLORS[name] ?? '#64748b',
        };
      });
    return { chartData: items, total: tot };
  }, [summaryRes]);

  return (
    <div className="bg-white dark:bg-[#1e293b] rounded-xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm h-[400px] flex flex-col">
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
                cy="45%"
                innerRadius={70}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  color: '#f8fafc',
                  borderRadius: '8px',
                }}
                formatter={(value: number) => [`${value.toLocaleString('vi-VN')} ₫`, undefined]}
              />
              <Legend
                layout="vertical"
                verticalAlign="bottom"
                align="center"
                iconType="circle"
                wrapperStyle={{ fontSize: '12px', color: '#cbd5e1' }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Center Text */}
          <div className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
            <div className="text-slate-500 dark:text-slate-400 text-xs">Tổng chi</div>
            <div className="text-slate-900 dark:text-white font-bold text-xl">{formatShort(total)}</div>
          </div>
        </div>
      )}
    </div>
  );
}
