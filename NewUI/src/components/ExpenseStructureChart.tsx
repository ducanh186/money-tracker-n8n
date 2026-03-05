import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const data = [
  { name: 'Thiết yếu (55%)', value: 6875000, color: '#3b82f6' },
  { name: 'Giáo dục (10%)', value: 1250000, color: '#8b5cf6' },
  { name: 'Tiết kiệm (10%)', value: 1250000, color: '#10b981' },
  { name: 'Hưởng thụ (10%)', value: 1250000, color: '#f59e0b' },
  { name: 'Đầu tư (10%)', value: 1250000, color: '#ec4899' },
  { name: 'Từ thiện (5%)', value: 625000, color: '#06b6d4' },
];

export function ExpenseStructureChart() {
  return (
    <div className="bg-[#1e293b] rounded-xl p-6 border border-slate-800 shadow-sm h-[400px] flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-white font-semibold text-lg">Cơ cấu chi tiêu - 6 Hũ</h3>
      </div>
      <p className="text-slate-400 text-sm mb-6">Tháng 6, 2024</p>
      
      <div className="flex-1 w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="45%"
              innerRadius={80}
              outerRadius={110}
              paddingAngle={2}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc', borderRadius: '8px' }}
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
          <div className="text-slate-400 text-xs">Tổng chi</div>
          <div className="text-white font-bold text-xl">12.5M</div>
        </div>
      </div>
    </div>
  );
}
