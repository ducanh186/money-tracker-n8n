import { ArrowLeft, Bell, ChevronDown, House, Layers3, Menu, Moon, Plus, ReceiptText, Sun } from 'lucide-react';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { formatMonthLabel, getRecentMonths } from '../lib/api';
import { cn } from '../lib/utils';
import MobileInsightsDrawer from './MobileInsightsDrawer';

type MobileAppShellProps = {
  currentView: string;
  setCurrentView: (view: string) => void;
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  onOpenAdd: () => void;
  children: ReactNode;
};

const navItems = [
  { id: 'overview', label: 'Trang chủ', icon: House },
  { id: 'transactions', label: 'Giao dịch', icon: ReceiptText },
  { id: 'jars', label: 'Hũ', icon: Layers3 },
  { id: 'more', label: 'Khác', icon: Menu },
];

function compactMonthLabel(month: string): string {
  const fullLabel = formatMonthLabel(month);
  const match = /Tháng\s+(\d+),\s+(\d+)/.exec(fullLabel);
  if (!match) return month;
  return `Th ${match[1]}/${match[2]}`;
}

export default function MobileAppShell({
  currentView,
  setCurrentView,
  selectedMonth,
  onMonthChange,
  darkMode,
  toggleDarkMode,
  onOpenAdd,
  children,
}: MobileAppShellProps) {
  const months = getRecentMonths(12);
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
  const [insightsOpen, setInsightsOpen] = useState(false);
  const activeTab = ['overview', 'transactions', 'jars'].includes(currentView) ? currentView : 'more';

  useEffect(() => {
    setMonthPickerOpen(false);
  }, [currentView]);

  const backTarget = useMemo(() => {
    if (['budget', 'goals', 'debts'].includes(currentView)) return 'more';
    if (['transactions', 'jars'].includes(currentView)) return 'overview';
    return 'overview';
  }, [currentView]);

  const title = useMemo(() => {
    const shortMonth = compactMonthLabel(selectedMonth);
    if (currentView === 'transactions') return `Giao dịch · ${shortMonth}`;
    if (currentView === 'jars') return `Hũ · ${shortMonth}`;
    if (currentView === 'budget') return `Chi tiêu · ${shortMonth}`;
    if (currentView === 'more') return `Khác · ${shortMonth}`;
    return shortMonth;
  }, [currentView, selectedMonth]);

  const showHeader = !['goals', 'debts'].includes(currentView);
  const showBack = !['overview', 'more'].includes(currentView);

  return (
    <div className="min-h-screen bg-[var(--color-surface-alt)] text-[var(--color-text-primary)] lg:hidden">
      {showHeader && (
        <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-slate-50/95 backdrop-blur-md dark:border-slate-700/80 dark:bg-[#0c1222]/95">
          <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3">
            <div className="relative flex min-w-0 items-center gap-2">
              {showBack ? (
                <button
                  onClick={() => setCurrentView(backTarget)}
                  className="inline-flex size-9 items-center justify-center rounded-full text-slate-600 transition-colors hover:bg-slate-200/70 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-700/60 dark:hover:text-white"
                >
                  <ArrowLeft className="size-5" />
                </button>
              ) : (
                <span className="inline-flex size-8 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white shadow-sm shadow-blue-600/20">
                  ₫
                </span>
              )}

              <div className="relative min-w-0">
                <button
                  onClick={() => setMonthPickerOpen((value) => !value)}
                  className="inline-flex min-w-0 items-center gap-1 rounded-full px-2 py-1 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-200/70 dark:text-white dark:hover:bg-slate-700/60"
                >
                  <span className="truncate">{title}</span>
                  <ChevronDown className={cn('size-4 shrink-0 text-slate-400 transition-transform dark:text-slate-500', monthPickerOpen && 'rotate-180')} />
                </button>

                {monthPickerOpen && (
                  <div className="absolute left-0 top-full mt-2 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-[#1a2433]">
                    {months.map((month) => (
                      <button
                        key={month}
                        onClick={() => {
                          onMonthChange(month);
                          setMonthPickerOpen(false);
                        }}
                        className={cn(
                          'flex w-full items-center justify-between px-4 py-3 text-left text-sm transition-colors',
                          selectedMonth === month
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300'
                            : 'text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800',
                        )}
                      >
                        <span>{formatMonthLabel(month)}</span>
                        {selectedMonth === month && <span className="text-xs font-bold uppercase tracking-wide">Now</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button className="inline-flex size-9 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-200/70 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-700/60 dark:hover:text-white">
                <Bell className="size-4.5" />
              </button>
              <button
                onClick={() => setInsightsOpen(true)}
                className="inline-flex size-9 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-200/70 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-700/60 dark:hover:text-white"
              >
                <Layers3 className="size-4.5" />
              </button>
              <button
                onClick={toggleDarkMode}
                className="inline-flex size-9 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-200/70 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-700/60 dark:hover:text-white"
              >
                {darkMode ? <Sun className="size-4.5" /> : <Moon className="size-4.5" />}
              </button>
            </div>
          </div>
        </header>
      )}

      <main className="mx-auto max-w-md px-4 pb-24 pt-4">{children}</main>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/80 bg-white/92 px-4 pb-[calc(env(safe-area-inset-bottom)+10px)] pt-2 backdrop-blur-md dark:border-slate-700/80 dark:bg-[#111827]/92">
        <div className="mx-auto grid max-w-md grid-cols-[1fr_1fr_auto_1fr_1fr] items-end gap-1">
          {navItems.slice(0, 2).map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={cn(
                  'flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-medium transition-colors',
                  active ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400',
                )}
              >
                <Icon className={cn('size-5', active && 'stroke-[2.3]')} />
                <span>{item.label}</span>
              </button>
            );
          })}

          <button
            onClick={onOpenAdd}
            aria-label="Thêm giao dịch"
            className="mx-auto -mt-5 inline-flex size-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/30 transition-transform hover:-translate-y-0.5 hover:bg-blue-700"
          >
            <Plus className="size-6" />
          </button>

          {navItems.slice(2).map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={cn(
                  'flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-medium transition-colors',
                  active ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400',
                )}
              >
                <Icon className={cn('size-5', active && 'stroke-[2.3]')} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <MobileInsightsDrawer month={selectedMonth} open={insightsOpen} onClose={() => setInsightsOpen(false)} />
    </div>
  );
}