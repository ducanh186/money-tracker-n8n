import React from 'react';
import { ShoppingBag, Coffee, GraduationCap, Heart, Home, ArrowRight } from 'lucide-react';

const transactions = [
  {
    id: 1,
    title: 'Siêu thị Vinmart',
    category: 'Thiết yếu',
    date: 'Hôm nay, 14:30',
    amount: -450000,
    icon: ShoppingBag,
    color: 'text-blue-400',
    bg: 'bg-blue-400/10',
  },
  {
    id: 2,
    title: 'The Coffee House',
    category: 'Hưởng thụ',
    date: 'Hôm nay, 09:15',
    amount: -65000,
    icon: Coffee,
    color: 'text-amber-400',
    bg: 'bg-amber-400/10',
  },
  {
    id: 3,
    title: 'Khóa học Udemy',
    category: 'Giáo dục',
    date: 'Hôm qua, 20:00',
    amount: -299000,
    icon: GraduationCap,
    color: 'text-purple-400',
    bg: 'bg-purple-400/10',
  },
  {
    id: 4,
    title: 'Quyển sách "Nhà giả kim"',
    category: 'Giáo dục',
    date: 'Hôm qua, 15:45',
    amount: -120000,
    icon: GraduationCap,
    color: 'text-purple-400',
    bg: 'bg-purple-400/10',
  },
  {
    id: 5,
    title: 'Quyên góp Quỹ Trẻ em',
    category: 'Từ thiện',
    date: '12 Thg 6, 10:00',
    amount: -500000,
    icon: Heart,
    color: 'text-cyan-400',
    bg: 'bg-cyan-400/10',
  },
  {
    id: 6,
    title: 'Tiền điện tháng 5',
    category: 'Thiết yếu',
    date: '10 Thg 6, 08:30',
    amount: -1250000,
    icon: Home,
    color: 'text-blue-400',
    bg: 'bg-blue-400/10',
  },
];

export function RecentTransactions() {
  return (
    <div className="bg-[#1e293b] rounded-xl border border-slate-800 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-800 flex items-center justify-between">
        <h3 className="text-white font-semibold text-lg">Giao dịch gần đây</h3>
        <button className="text-blue-400 text-sm font-medium hover:text-blue-300 flex items-center gap-1 transition-colors">
          Xem tất cả <ArrowRight className="w-4 h-4" />
        </button>
      </div>
      
      <div className="divide-y divide-slate-800/50">
        {transactions.map((tx) => (
          <div key={tx.id} className="p-4 px-6 flex items-center justify-between hover:bg-slate-800/30 transition-colors cursor-pointer">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${tx.bg}`}>
                <tx.icon className={`w-6 h-6 ${tx.color}`} />
              </div>
              <div>
                <h4 className="text-slate-200 font-medium">{tx.title}</h4>
                <div className="flex items-center gap-2 text-sm text-slate-500 mt-0.5">
                  <span>{tx.category}</span>
                  <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                  <span>{tx.date}</span>
                </div>
              </div>
            </div>
            
            <div className={`font-semibold ${tx.amount > 0 ? 'text-emerald-400' : 'text-white'}`}>
              {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString('vi-VN')} ₫
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
