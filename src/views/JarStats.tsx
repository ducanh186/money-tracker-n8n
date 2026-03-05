import { TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import { formatCurrency, formatSignedAmount } from '../lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface JarSummary {
  jar: string;
  income: number;
  expense: number;
  net: number;
  count: number;
}

interface JarStatsProps {
  jarSummaries: JarSummary[];
  totalExpense: number;
}

export default function JarStats({ jarSummaries, totalExpense }: JarStatsProps) {
  // Chart data in millions
  const chartData = jarSummaries.map((j) => ({
    name: j.jar.length > 10 ? j.jar.slice(0, 10) + '…' : j.jar,
    'Thu nhập': +(j.income / 1_000_000).toFixed(1),
    'Chi tiêu': +(j.expense / 1_000_000).toFixed(1),
  }));

  return (
    <div className="flex flex-col gap-8">
      {/* Chart */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Thu nhập vs Chi tiêu theo Hũ</h3>
            <p className="text-sm text-slate-500">Đơn vị: Triệu VNĐ</p>
          </div>
        </div>
        
        {chartData.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center text-slate-400">
            Không có dữ liệu
          </div>
        ) : (
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip cursor={{ fill: '#f8fafc' }} />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                <Bar dataKey="Thu nhập" fill="#22c55e" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="Chi tiêu" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Details list */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-slate-900 mb-4">Chi tiết từng Hũ</h3>
        
        {jarSummaries.map((item) => {
          const expensePercent = totalExpense > 0 ? Math.round((item.expense / totalExpense) * 100) : 0;
          const isPositiveNet = item.net >= 0;

          return (
            <div key={item.jar} className="bg-white rounded-xl p-5 border border-slate-200 hover:shadow-md transition-shadow flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-center gap-4 min-w-[200px]">
                <div className="size-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Wallet className="size-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-lg">{item.jar}</h4>
                  <p className="text-sm text-slate-500">{item.count} giao dịch · {expensePercent}% tổng chi</p>
                </div>
              </div>
              
              <div className="flex flex-1 w-full md:w-auto grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex flex-col">
                  <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Thu nhập</span>
                  <span className="font-bold text-green-600 text-lg">{formatCurrency(item.income)}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Chi tiêu</span>
                  <span className="font-bold text-red-600 text-lg">{formatCurrency(item.expense)}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Net</span>
                  <span className={`font-bold text-lg ${isPositiveNet ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {formatSignedAmount(item.net)}
                  </span>
                </div>
                <div className="flex flex-col items-start md:items-end justify-center">
                  <div className={`px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1 ${
                    isPositiveNet ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                  }`}>
                    {isPositiveNet ? <TrendingUp className="size-4" /> : <TrendingDown className="size-4" />}
                    {expensePercent}%
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
