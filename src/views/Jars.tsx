import { useState, useMemo } from 'react';
import { Wallet, Loader2, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { useTransactions } from '../lib/hooks';
import type { Transaction } from '../lib/types';
import JarStats from './JarStats';

/** Aggregate amounts per jar from a list of transactions. */
interface JarSummary {
  jar: string;
  income: number;
  expense: number;
  net: number;
  count: number;
}

function aggregateByJar(transactions: Transaction[]): JarSummary[] {
  const map = new Map<string, JarSummary>();

  for (const tx of transactions) {
    const key = tx.jar ?? 'Không phân loại';
    if (!map.has(key)) {
      map.set(key, { jar: key, income: 0, expense: 0, net: 0, count: 0 });
    }
    const entry = map.get(key)!;
    entry.count++;
    if (tx.flow === 'income') {
      entry.income += tx.amount_vnd;
    } else if (tx.flow === 'expense') {
      entry.expense += tx.amount_vnd;
    }
    entry.net += tx.signed_amount_vnd;
  }

  return Array.from(map.values()).sort((a, b) => b.expense - a.expense);
}

const JAR_COLORS: Record<string, string> = {
  'Thiết yếu': 'bg-blue-500',
  'Giáo dục': 'bg-purple-500',
  'Tiết kiệm': 'bg-teal-500',
  'Hưởng thụ': 'bg-pink-500',
  'Cho đi': 'bg-amber-500',
  'Đầu tư': 'bg-green-500',
  'Du lịch': 'bg-cyan-500',
  'Giải trí': 'bg-red-500',
};

function getJarColor(jar: string): string {
  return JAR_COLORS[jar] ?? 'bg-slate-500';
}

function getJarIconBg(jar: string, selected: boolean): string {
  if (selected) return 'bg-blue-100 text-blue-600';
  const map: Record<string, string> = {
    'Thiết yếu': 'bg-blue-100 text-blue-600',
    'Giáo dục': 'bg-purple-100 text-purple-600',
    'Tiết kiệm': 'bg-teal-100 text-teal-600',
    'Hưởng thụ': 'bg-pink-100 text-pink-600',
    'Cho đi': 'bg-amber-100 text-amber-600',
    'Đầu tư': 'bg-green-100 text-green-600',
    'Du lịch': 'bg-cyan-100 text-cyan-600',
    'Giải trí': 'bg-red-100 text-red-600',
  };
  return map[jar] ?? 'bg-slate-100 text-slate-600';
}

export default function Jars({ month }: { month: string }) {
  const [activeTab, setActiveTab] = useState('list');
  const [selectedJar, setSelectedJar] = useState<JarSummary | null>(null);

  // Fetch ALL transactions for the month (large pageSize to get everything)
  const { data, isPending, error } = useTransactions({ month, pageSize: 200, sort: 'datetime_desc' });

  const transactions = data?.data ?? [];
  const totals = data?.meta?.totals;

  const jarSummaries = useMemo(() => aggregateByJar(transactions), [transactions]);

  const totalExpense = totals?.expense_vnd ?? 0;

  if (isPending) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="size-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center max-w-7xl mx-auto">
        <AlertCircle className="size-8 text-red-400 mx-auto mb-2" />
        <p className="text-red-700 font-medium">{error?.message}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto h-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-slate-900 text-3xl font-bold tracking-tight">Quản lý Ngân Sách Hũ</h2>
          <p className="text-slate-500 text-base">Theo dõi thực tế chi tiêu cho từng hũ trong tháng</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button 
              onClick={() => setActiveTab('list')}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Danh sách
            </button>
            <button 
              onClick={() => setActiveTab('stats')}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'stats' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Thống kê
            </button>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      {activeTab === 'list' && totals && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col gap-2">
            <div className="flex items-center gap-2 text-slate-500">
              <Wallet className="size-4 text-green-500" />
              <p className="text-sm font-medium uppercase tracking-wider">Tổng thu</p>
            </div>
            <p className="text-green-600 text-2xl font-bold leading-tight">{formatCurrency(totals.income_vnd)}</p>
          </div>
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col gap-2">
            <div className="flex items-center gap-2 text-slate-500">
              <Wallet className="size-4 text-red-500" />
              <p className="text-sm font-medium uppercase tracking-wider">Tổng chi</p>
            </div>
            <p className="text-red-600 text-2xl font-bold leading-tight">{formatCurrency(totals.expense_vnd)}</p>
          </div>
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col gap-2">
            <div className="flex items-center gap-2 text-slate-500">
              <Wallet className="size-4 text-blue-600" />
              <p className="text-sm font-medium uppercase tracking-wider">Net</p>
            </div>
            <p className={`text-2xl font-bold leading-tight ${totals.net_vnd >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {totals.net_vnd >= 0 ? '+' : ''}{formatCurrency(totals.net_vnd)}
            </p>
          </div>
        </div>
      )}

      {activeTab === 'stats' ? (
        <JarStats jarSummaries={jarSummaries} totalExpense={totalExpense} />
      ) : (
        <div className="flex flex-col lg:flex-row gap-6 h-full">
          <div className="flex-1 flex flex-col gap-4">
            {jarSummaries.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                <p className="text-slate-400 text-lg">Không có dữ liệu hũ</p>
              </div>
            ) : (
              jarSummaries.map((jar) => {
                const percent = totalExpense > 0 ? Math.round((jar.expense / totalExpense) * 100) : 0;
                const isSelected = selectedJar?.jar === jar.jar;
                
                return (
                  <div 
                    key={jar.jar}
                    onClick={() => setSelectedJar(jar)}
                    className={`group relative flex items-center gap-4 bg-white p-4 rounded-xl border cursor-pointer transition-all ${
                      isSelected ? 'border-blue-500 shadow-sm' : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
                    }`}
                  >
                    {isSelected && <div className="absolute right-0 top-0 h-full w-1.5 bg-blue-500 rounded-l-sm rounded-r-xl"></div>}
                    
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`flex items-center justify-center rounded-lg shrink-0 size-12 ${getJarIconBg(jar.jar, isSelected)}`}>
                        <Wallet className="size-6" />
                      </div>
                      <div className="flex flex-col justify-center">
                        <p className="text-slate-900 text-base font-semibold leading-normal">{jar.jar}</p>
                        <p className="text-sm text-slate-500 leading-normal mt-0.5">
                          Chi: {formatCurrency(jar.expense)} · Thu: {formatCurrency(jar.income)} · {jar.count} GD
                        </p>
                      </div>
                    </div>
                    
                    <div className="shrink-0 flex items-center gap-4">
                      <div className="flex flex-col items-end gap-1">
                        <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${getJarColor(jar.jar)}`} style={{ width: `${percent}%` }}></div>
                        </div>
                        <span className={`text-xs font-medium ${isSelected ? 'text-blue-600' : 'text-slate-500'}`}>
                          {percent}% chi
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          
          {selectedJar && (
            <div className="w-full lg:w-[400px] bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col p-6 h-fit sticky top-6">
              <div className="flex items-center gap-3 mb-6">
                <div className={`size-10 rounded-full flex items-center justify-center ${getJarIconBg(selectedJar.jar, true)}`}>
                  <Wallet className="size-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{selectedJar.jar}</h2>
                  <p className="text-sm text-slate-500">{selectedJar.count} giao dịch</p>
                </div>
              </div>
              
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 mb-6 space-y-4">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm font-medium text-slate-500">Thu nhập</span>
                  <span className="text-lg font-bold text-green-600">{formatCurrency(selectedJar.income)}</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-sm font-medium text-slate-500">Chi tiêu</span>
                  <span className="text-lg font-bold text-red-600">{formatCurrency(selectedJar.expense)}</span>
                </div>
                <div className="border-t border-slate-200 pt-4 flex justify-between items-baseline">
                  <span className="text-sm font-semibold text-slate-700">Net</span>
                  <span className={`text-xl font-bold ${selectedJar.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {selectedJar.net >= 0 ? '+' : ''}{formatCurrency(selectedJar.net)}
                  </span>
                </div>
              </div>

              {totalExpense > 0 && (
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-600">Tỷ trọng chi tiêu</span>
                    <span className="font-medium text-slate-900">{Math.round((selectedJar.expense / totalExpense) * 100)}%</span>
                  </div>
                  <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${getJarColor(selectedJar.jar)}`} style={{ width: `${Math.round((selectedJar.expense / totalExpense) * 100)}%` }}></div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
