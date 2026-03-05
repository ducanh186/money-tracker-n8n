import { PieChart, List, Wallet, User, Settings, LogOut, Target, Crosshair } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Sidebar({ currentView, setCurrentView }: { currentView: string, setCurrentView: (v: string) => void }) {
  const navItems = [
    { id: 'overview', label: 'Tổng quan', icon: PieChart },
    { id: 'transactions', label: 'Giao dịch', icon: List },
    { id: 'jars', label: 'Quản lý Hũ', icon: Wallet },
    { id: 'budget', label: 'Kế hoạch chi tiêu', icon: Target },
    { id: 'goals', label: 'Quỹ mục tiêu', icon: Crosshair },
    { id: 'account', label: 'Tài khoản & Chuyển khoản', icon: User },
  ];

  return (
    <div className="w-64 border-r border-slate-200 bg-white flex flex-col justify-between shrink-0 h-full overflow-y-auto">
      <div className="flex flex-col gap-4 p-4">
        <div className="flex gap-3 items-center mb-4 px-2">
          <div className="bg-blue-600 text-white rounded-xl size-10 flex items-center justify-center font-bold text-xl">
            💰
          </div>
          <div className="flex flex-col">
            <h1 className="text-slate-900 text-base font-bold leading-normal">Money Tracker</h1>
            <p className="text-slate-500 text-sm font-normal leading-normal">Quản lý tài chính</p>
          </div>
        </div>
        
        <div className="flex flex-col gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors cursor-pointer w-full text-left",
                  isActive 
                    ? "bg-blue-50 text-blue-600 font-semibold" 
                    : "text-slate-600 hover:bg-slate-50 hover:text-blue-600 font-medium"
                )}
              >
                <Icon className="size-5" />
                <span className="text-sm leading-normal">{item.label}</span>
              </button>
            )
          })}
        </div>
      </div>
      
      <div className="p-4 border-t border-slate-100">
        <button className="flex items-center gap-3 px-3 py-2 text-slate-600 hover:text-slate-900 cursor-pointer w-full text-left">
          <Settings className="size-5" />
          <span className="text-sm font-medium">Cài đặt</span>
        </button>
        <button className="flex items-center gap-3 px-3 py-2 text-slate-600 hover:text-slate-900 cursor-pointer w-full text-left mt-1">
          <LogOut className="size-5" />
          <span className="text-sm font-medium">Đăng xuất</span>
        </button>
      </div>
    </div>
  )
}
