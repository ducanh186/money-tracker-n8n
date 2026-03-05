import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const data = [
  { name: 'Thg 1', income: 24000000, expense: 18000000 },
  { name: 'Thg 2', income: 22000000, expense: 20000000 },
  { name: 'Thg 3', income: 26000000, expense: 19000000 },
  { name: 'Thg 4', income: 25000000, expense: 17000000 },
  { name: 'Thg 5', income: 28000000, expense: 21000000 },
  { name: 'Thg 6', income: 25000000, expense: 12500000 },
];

const formatCurrency = (value: number) => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(0)}M`;
  }
  return value.toString();
};

export function IncomeExpenseChart() {
  return (
    <div className="bg-[#1e293b] rounded-xl p-6 border border-slate-800 shadow-sm h-[400px] flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-white font-semibold text-lg">Thu nhập vs Chi tiêu</h3>
        <select className="bg-[#0f172a] border border-slate-700 text-slate-300 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500">
          <option>6 tháng gần nhất</option>
          <option>Năm nay</option>
          <option>Năm trước</option>
        </select>
      </div>
      
      <div className="flex-1 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
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
              tickFormatter={formatCurrency}
            />
            <Tooltip 
              cursor={{ fill: '#334155', opacity: 0.4 }}
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc', borderRadius: '8px' }}
              formatter={(value: number) => [`${value.toLocaleString('vi-VN')} ₫`, undefined]}
            />
            <Legend 
              iconType="circle" 
              wrapperStyle={{ paddingTop: '20px' }}
            />
            <Bar dataKey="income" name="Thu nhập" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
            <Bar dataKey="expense" name="Chi tiêu" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
