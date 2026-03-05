import React from 'react';
import { ArrowDownRight, ArrowUpRight, LucideIcon } from 'lucide-react';

interface SummaryCardProps {
  title: string;
  amount: string;
  trend: number;
  trendText: string;
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
}

export function SummaryCard({ title, amount, trend, trendText, icon: Icon, iconColor, iconBg }: SummaryCardProps) {
  const isPositive = trend >= 0;

  return (
    <div className="bg-[#1e293b] rounded-xl p-6 border border-slate-800 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-slate-400 font-medium text-sm">{title}</h3>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconBg}`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
      </div>
      
      <div className="mb-2">
        <span className="text-2xl font-bold text-white">{amount}</span>
        <span className="text-slate-400 ml-1">₫</span>
      </div>
      
      <div className="flex items-center gap-2 text-sm">
        <div className={`flex items-center ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
          {isPositive ? <ArrowUpRight className="w-4 h-4 mr-1" /> : <ArrowDownRight className="w-4 h-4 mr-1" />}
          <span className="font-medium">{Math.abs(trend)}%</span>
        </div>
        <span className="text-slate-500">{trendText}</span>
      </div>
    </div>
  );
}
