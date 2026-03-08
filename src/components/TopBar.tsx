import { useState } from 'react';
import { PieChart, List, Wallet, Target, Crosshair, User, Search, Sun, Moon, Menu, X, ChevronDown, AlertTriangle } from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';
import { getRecentMonths, formatMonthLabel } from '../lib/api';
import { useBudgetStatus } from '../lib/hooks';

interface TopBarProps {
  currentView: string;
  setCurrentView: (v: string) => void;
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

export default function TopBar({ currentView, setCurrentView, selectedMonth, onMonthChange, darkMode, toggleDarkMode }: TopBarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const months = getRecentMonths(12);
  const { data: budgetStatus } = useBudgetStatus(selectedMonth);

  const navItems = [
    { id: 'overview', label: 'Tổng quan', icon: PieChart },
    { id: 'transactions', label: 'Giao dịch', icon: List },
    { id: 'jars', label: 'Quản lý Hũ', icon: Wallet },
    { id: 'budget', label: 'Chi tiêu', icon: Target },
    { id: 'goals', label: 'Quỹ & Mục tiêu', icon: Crosshair },
    { id: 'account', label: 'Tài khoản', icon: User },
  ];

  return (
    <nav className="bg-white dark:bg-[#1a2433] border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Left: Logo + Desktop Nav */}
          <div className="flex items-center gap-3">
            {/* Logo */}
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="bg-blue-600 text-white rounded-lg size-8 flex items-center justify-center font-bold text-sm">
                💰
              </div>
            </div>

            {/* Desktop Nav */}
            <div className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentView(item.id)}
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer whitespace-nowrap",
                      isActive
                        ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400"
                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60 hover:text-blue-600 dark:hover:text-blue-400"
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Controls */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* Month selector */}
            <div className="relative">
              <select
                value={selectedMonth}
                onChange={(e) => onMonthChange(e.target.value)}
                className="appearance-none bg-slate-50 dark:bg-[#0c1222] border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 pl-3 pr-7 py-1.5 focus:ring-2 focus:ring-blue-500/20 focus:outline-none cursor-pointer transition-colors"
              >
                {months.map((m) => (
                  <option key={m} value={m}>{formatMonthLabel(m)}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 size-3.5 text-slate-400 pointer-events-none" />
            </div>

            {/* Search - desktop */}
            <div className="hidden md:flex relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="size-4 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Tìm kiếm..."
                className="pl-9 pr-4 py-1.5 bg-slate-50 dark:bg-[#0c1222] border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:outline-none w-48 lg:w-56 transition-colors"
              />
            </div>

            {/* Search - mobile */}
            <button className="md:hidden flex size-9 items-center justify-center rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors">
              <Search className="size-5" />
            </button>

            {/* Dark mode toggle */}
            <button
              onClick={toggleDarkMode}
              className="flex size-9 items-center justify-center rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors cursor-pointer"
              title={darkMode ? 'Chế độ sáng' : 'Chế độ tối'}
            >
              {darkMode ? <Sun className="size-5" /> : <Moon className="size-5" />}
            </button>

            {/* Mobile menu toggle */}
            <button
              className="lg:hidden flex size-9 items-center justify-center rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors cursor-pointer"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 dark:border-slate-700 py-2 pb-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => { setCurrentView(item.id); setMobileMenuOpen(false); }}
                  className={cn(
                    "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60"
                  )}
                >
                  <Icon className="size-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Budget Status Strip */}
      {budgetStatus && (
        <div className="border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#0c1222]">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-1.5 flex items-center gap-4 md:gap-6 text-xs overflow-x-auto">
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-slate-500 dark:text-slate-400">Thu nhập:</span>
              <span className="font-semibold text-slate-700 dark:text-slate-200">{formatCurrency(budgetStatus.income)}</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-slate-500 dark:text-slate-400">Đã phân bổ:</span>
              <span className="font-semibold text-blue-600 dark:text-blue-400">{formatCurrency(budgetStatus.assigned)}</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-slate-500 dark:text-slate-400">Chưa phân bổ:</span>
              <span className={cn(
                "font-semibold",
                budgetStatus.unassigned === 0
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              )}>
                {formatCurrency(budgetStatus.unassigned)}
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-slate-500 dark:text-slate-400">Được phép chi:</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(budgetStatus.available_to_spend)}</span>
            </div>
            {budgetStatus.overspent_jars && budgetStatus.overspent_jars.length > 0 && (
              <div className="flex items-center gap-1.5 shrink-0 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="size-3.5" />
                <span className="font-medium">
                  {budgetStatus.overspent_jars.length} hũ vượt mức
                </span>
              </div>
            )}
            {budgetStatus.period_status === 'open' && (
              <div className="flex items-center gap-1.5 shrink-0 text-slate-400 dark:text-slate-500">
                <span>Tháng đang mở</span>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
