import { Search, Bell, Menu, Wallet, ChevronDown } from 'lucide-react';
import { getRecentMonths, formatMonthLabel } from '../lib/api';

interface HeaderProps {
  toggleMobileMenu?: () => void;
  selectedMonth: string;
  onMonthChange: (month: string) => void;
}

export default function Header({ toggleMobileMenu, selectedMonth, onMonthChange }: HeaderProps) {
  const months = getRecentMonths(12);

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 md:px-8">
      <div className="flex items-center gap-4">
        <button className="lg:hidden text-slate-500 hover:text-slate-900" onClick={toggleMobileMenu}>
          <Menu className="size-6" />
        </button>
        <div className="hidden md:flex items-center gap-4">
          <div className="size-8 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <Wallet className="size-5" />
          </div>
          <h2 className="text-lg font-bold leading-tight tracking-tight">Tài chính</h2>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        {/* Month selector */}
        <div className="relative">
          <select
            value={selectedMonth}
            onChange={(e) => onMonthChange(e.target.value)}
            className="appearance-none bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 pl-4 pr-8 py-2 focus:ring-2 focus:ring-blue-500/20 focus:outline-none cursor-pointer"
          >
            {months.map((m) => (
              <option key={m} value={m}>{formatMonthLabel(m)}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
        </div>

        <div className="hidden md:flex relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="size-4" />
          </div>
          <input 
            type="text" 
            placeholder="Tìm kiếm giao dịch..." 
            className="pl-10 pr-4 py-2 bg-slate-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:outline-none w-64"
          />
        </div>
        
        <button className="md:hidden flex size-10 items-center justify-center rounded-full bg-slate-50 text-slate-700 hover:bg-slate-100">
          <Search className="size-5" />
        </button>
        
        <button className="relative flex size-10 items-center justify-center rounded-full bg-slate-50 text-slate-700 hover:bg-slate-100">
          <Bell className="size-5" />
          <span className="absolute top-2 right-2 size-2 rounded-full bg-red-500 ring-2 ring-white"></span>
        </button>
        
        <div 
          className="size-10 rounded-full bg-slate-200 bg-cover bg-center ring-2 ring-white shadow-sm" 
          style={{ backgroundImage: 'url("https://i.pravatar.cc/150?img=68")' }}
        />
      </div>
    </header>
  )
}
