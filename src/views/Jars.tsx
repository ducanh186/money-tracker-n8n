import { useState, useMemo } from 'react';
import { Wallet, Loader2, AlertCircle, ChevronDown, ChevronUp, PiggyBank, Plus, X } from 'lucide-react';
import { formatCurrency, formatSignedAmount } from '../lib/utils';
import { useTransactions, useBudgetStatus, useFunds, useJars, useCreateFund } from '../lib/hooks';
import type { Transaction, BudgetStatusJarMetric, Fund, CreateFundPayload } from '../lib/types';
import JarStats from './JarStats';

/** Aggregate amounts per jar from a list of transactions. */
interface JarSummary {
  jar: string;    // short key: NEC, PLAY, …
  label: string;  // Vietnamese display name
  income: number;
  expense: number;
  net: number;
  count: number;
}

function aggregateByJar(transactions: Transaction[]): Map<string, Omit<JarSummary, 'label'>> {
  const map = new Map<string, Omit<JarSummary, 'label'>>();

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

  return map;
}

// Keyed by jar short-code (NEC, PLAY, etc.)
const JAR_COLORS: Record<string, string> = {
  NEC:  'bg-sky-500',
  EDU:  'bg-violet-500',
  LTSS: 'bg-emerald-500',
  PLAY: 'bg-orange-500',
  FFA:  'bg-amber-500',
  GIVE: 'bg-pink-500',
};

const JAR_ICON_BG: Record<string, string> = {
  NEC:  'bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400',
  EDU:  'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400',
  LTSS: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
  PLAY: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
  FFA:  'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  GIVE: 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400',
};

function getJarColor(key: string): string {
  return JAR_COLORS[key] ?? 'bg-slate-500';
}

function getJarIconBg(key: string, selected: boolean): string {
  if (selected) return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
  return JAR_ICON_BG[key] ?? 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400';
}

function CreateFundForm({ onClose }: { onClose: () => void }) {
  const { data: jarsRes } = useJars();
  const createMutation = useCreateFund();

  const [form, setForm] = useState<CreateFundPayload>({
    name: '',
    type: 'sinking_fund',
    jar_id: 0,
    target_amount: 0,
    monthly_reserve: 0,
    notes: '',
  });
  const [targetStr, setTargetStr] = useState('');
  const [reserveStr, setReserveStr] = useState('');

  const jars = jarsRes?.data ?? [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || form.jar_id === 0) return;
    createMutation.mutate(form, {
      onSuccess: () => onClose(),
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#1a2433] rounded-2xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Tạo Quỹ con mới</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Tên quỹ *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="VD: Mua xe, Tiết kiệm, Đầu tư chứng khoán..."
              className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-[#0c1222] text-slate-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Loại quỹ</label>
              <select
                value={form.type ?? 'sinking_fund'}
                onChange={(e) => setForm({ ...form, type: e.target.value as 'sinking_fund' | 'investment' })}
                className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-[#0c1222] text-slate-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="sinking_fund">Tích luỹ (Sinking Fund)</option>
                <option value="investment">Đầu tư (Investment)</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Thuộc hũ (Jar) *</label>
              <select
                value={form.jar_id || ''}
                required
                onChange={(e) => setForm({ ...form, jar_id: Number(e.target.value) })}
                className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-[#0c1222] text-slate-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="" disabled>--- Chọn hũ ---</option>
                {jars.map((j) => (
                  <option key={j.id} value={j.id}>{j.label} ({j.key})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Mục tiêu (tuỳ chọn)</label>
              <input
                type="text"
                inputMode="numeric"
                value={targetStr}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, '');
                  setTargetStr(raw ? Number(raw).toLocaleString('vi-VN') : '');
                  setForm({ ...form, target_amount: Number(raw) || 0 });
                }}
                placeholder="0"
                className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-[#0c1222] text-slate-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Góp mỗi tháng (tuỳ chọn)</label>
              <input
                type="text"
                inputMode="numeric"
                value={reserveStr}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, '');
                  setReserveStr(raw ? Number(raw).toLocaleString('vi-VN') : '');
                  setForm({ ...form, monthly_reserve: Number(raw) || 0 });
                }}
                placeholder="0"
                className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-[#0c1222] text-slate-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Ghi chú</label>
            <input
              type="text"
              value={form.notes ?? ''}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-[#0c1222] text-slate-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || !form.name || form.jar_id === 0}
              className="flex items-center justify-center min-w-[100px] px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
            >
              {createMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : 'Tạo quỹ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Jars({ month }: { month: string }) {
  const [activeTab, setActiveTab] = useState('list');
  const [selectedJar, setSelectedJar] = useState<JarSummary | null>(null);
  const [expandedFundsJar, setExpandedFundsJar] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Fetch ALL transactions for the month (large pageSize to get everything)
  const { data, isPending, error } = useTransactions({ month, pageSize: 200, sort: 'datetime_desc' });
  const { data: budgetStatus } = useBudgetStatus(month);
  const { data: fundsRes } = useFunds();

  const transactions = data?.data ?? [];
  const totals = data?.meta?.totals;
  const funds = fundsRes?.data ?? [];

  const txByJar = useMemo(() => aggregateByJar(transactions), [transactions]);

  // Map jarKey → budget metrics
  const jarMetrics = useMemo(() => {
    const m = new Map<string, BudgetStatusJarMetric>();
    if (budgetStatus?.jars) {
      for (const j of budgetStatus.jars) m.set(j.key, j);
    }
    return m;
  }, [budgetStatus]);

  // Merged list: start from all budget jars (preserves order, shows empty jars),
  // then append any transaction jars not in budget (e.g. INCOME, uncategorized)
  const jarSummaries = useMemo((): JarSummary[] => {
    const result: JarSummary[] = [];
    const seen = new Set<string>();

    if (budgetStatus?.jars?.length) {
      for (const metric of budgetStatus.jars) {
        seen.add(metric.key);
        const tx = txByJar.get(metric.key);
        result.push({
          jar: metric.key,
          label: metric.label,
          income: tx?.income ?? 0,
          expense: tx?.expense ?? 0,
          net: tx?.net ?? 0,
          count: tx?.count ?? 0,
        });
      }
    }

    // Jars that have transactions but no budget config (e.g. INCOME row)
    for (const [key, tx] of txByJar) {
      if (!seen.has(key)) {
        result.push({ jar: key, label: key, ...tx });
      }
    }

    return result;
  }, [budgetStatus, txByJar]);

  // Map jarKey → funds
  const fundsByJar = useMemo(() => {
    const m = new Map<string, Fund[]>();
    for (const f of funds) {
      const jk = f.jar?.key;
      if (jk) {
        if (!m.has(jk)) m.set(jk, []);
        m.get(jk)!.push(f);
      }
    }
    return m;
  }, [funds]);

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
      {isCreateOpen && <CreateFundForm onClose={() => setIsCreateOpen(false)} />}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-slate-900 text-3xl font-bold tracking-tight">Quản lý Ngân Sách Hũ</h2>
          <p className="text-slate-500 text-base">Theo dõi thực tế chi tiêu cho từng hũ trong tháng</p>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="size-4" />
            Tạo quỹ con
          </button>
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
      {activeTab === 'list' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-[#1a2433] rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-2">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
              <Wallet className="size-4 text-blue-500" />
              <p className="text-sm font-medium uppercase tracking-wider">Kế hoạch</p>
            </div>
            <p className="text-blue-600 dark:text-blue-400 text-xl font-bold leading-tight">
              {formatCurrency(budgetStatus?.assigned ?? totals?.income_vnd ?? 0)}
            </p>
          </div>
          <div className="bg-white dark:bg-[#1a2433] rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-2">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
              <PiggyBank className="size-4 text-purple-500" />
              <p className="text-sm font-medium uppercase tracking-wider">Cam kết</p>
            </div>
            <p className="text-purple-600 dark:text-purple-400 text-xl font-bold leading-tight">
              {formatCurrency(budgetStatus?.committed ?? 0)}
            </p>
          </div>
          <div className="bg-white dark:bg-[#1a2433] rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-2">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
              <Wallet className="size-4 text-red-500" />
              <p className="text-sm font-medium uppercase tracking-wider">Đã chi</p>
            </div>
            <p className="text-red-600 dark:text-red-400 text-xl font-bold leading-tight">
              {formatCurrency(budgetStatus?.total_spent ?? totals?.expense_vnd ?? 0)}
            </p>
          </div>
          <div className="bg-white dark:bg-[#1a2433] rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-2">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
              <Wallet className="size-4 text-emerald-500" />
              <p className="text-sm font-medium uppercase tracking-wider">Còn lại</p>
            </div>
            <p className={`text-xl font-bold leading-tight ${(budgetStatus?.available_to_spend ?? (totals?.net_vnd ?? 0)) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
              {formatCurrency(budgetStatus?.available_to_spend ?? totals?.net_vnd ?? 0)}
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
                const metrics = jarMetrics.get(jar.jar);
                const jarFunds = fundsByJar.get(jar.jar) ?? [];
                const isExpandedFunds = expandedFundsJar === jar.jar;
                
                return (
                  <div key={jar.jar} className="flex flex-col">
                    <div 
                      onClick={() => setSelectedJar(jar)}
                      className={`group relative flex items-center gap-4 bg-white dark:bg-[#1a2433] p-4 rounded-xl border cursor-pointer transition-all ${
                        isSelected ? 'border-blue-500 shadow-sm' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 hover:shadow-sm'
                      }`}
                    >
                      {isSelected && <div className="absolute right-0 top-0 h-full w-1.5 bg-blue-500 rounded-l-sm rounded-r-xl"></div>}
                      
                      <div className="flex items-center gap-4 flex-1">
                        <div className={`flex items-center justify-center rounded-lg shrink-0 size-12 ${getJarIconBg(jar.jar, isSelected)}`}>
                          <Wallet className="size-6" />
                        </div>
                        <div className="flex flex-col justify-center flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-slate-900 dark:text-white text-base font-semibold leading-normal">{jar.label}</p>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 leading-none">{jar.jar}</span>
                          </div>
                          {metrics ? (
                            <div className="grid grid-cols-4 gap-2 mt-1.5 text-xs">
                              <div>
                                <span className="text-slate-400 dark:text-slate-500 block">Kế hoạch</span>
                                <span className="font-semibold text-blue-600 dark:text-blue-400">{formatCurrency(metrics.planned)}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 dark:text-slate-500 block">Cam kết</span>
                                <span className="font-semibold text-purple-600 dark:text-purple-400">{formatCurrency(metrics.committed)}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 dark:text-slate-500 block">Đã chi</span>
                                <span className="font-semibold text-red-600 dark:text-red-400">{formatCurrency(metrics.spent)}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 dark:text-slate-500 block">Còn lại</span>
                                <span className={`font-semibold ${metrics.available >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>{formatCurrency(metrics.available)}</span>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-slate-500 dark:text-slate-400 leading-normal mt-0.5">
                              Chi: {formatCurrency(jar.expense)} · Thu: {formatCurrency(jar.income)} · {jar.count} GD
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="shrink-0 flex flex-col items-end gap-1">
                        <div className="flex flex-col items-end gap-1">
                          <div className="w-24 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${
                              metrics && metrics.available < 0 ? 'bg-red-500' : getJarColor(jar.jar)
                            }`} style={{ width: `${Math.min(100, percent)}%` }}></div>
                          </div>
                          <span className={`text-xs font-medium ${isSelected ? 'text-blue-600' : 'text-slate-500 dark:text-slate-400'}`}>
                            {percent}% chi
                          </span>
                        </div>
                        {jarFunds.length > 0 && (
                          <button
                            onClick={(e) => { e.stopPropagation(); setExpandedFundsJar(isExpandedFunds ? null : jar.jar); }}
                            className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 mt-1"
                          >
                            <PiggyBank className="size-3" />
                            {jarFunds.length} quỹ con
                            {isExpandedFunds ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {/* Funds expansion */}
                    {isExpandedFunds && jarFunds.length > 0 && (
                      <div className="ml-16 mt-1 mb-2 flex flex-col gap-1.5">
                        {jarFunds.map((fund) => (
                          <div key={fund.id} className="flex items-center justify-between bg-slate-50 dark:bg-[#0c1222] rounded-lg px-3 py-2 border border-slate-100 dark:border-slate-700 text-xs">
                            <div className="flex flex-col">
                              <span className="font-medium text-slate-700 dark:text-slate-200">{fund.name}</span>
                              <span className="text-slate-400 dark:text-slate-500">
                                {fund.status === 'active' ? 'Đang hoạt động' : fund.status === 'completed' ? 'Hoàn thành' : 'Tạm dừng'}
                              </span>
                            </div>
                            <div className="flex flex-col items-end">
                              <span className="font-bold text-slate-700 dark:text-slate-200">{formatCurrency(fund.reserved_amount)}</span>
                              <span className="text-slate-400">/ {formatCurrency(fund.target_amount)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
          
          {selectedJar && (
            <div className="w-full lg:w-[400px] bg-white dark:bg-[#1a2433] rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col p-6 h-fit sticky top-6">
              <div className="flex items-center gap-3 mb-6">
                <div className={`size-10 rounded-full flex items-center justify-center ${getJarIconBg(selectedJar.jar, true)}`}>
                  <Wallet className="size-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">{selectedJar.label}</h2>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500">{selectedJar.jar}</span>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{selectedJar.count} giao dịch</p>
                </div>
              </div>
              
              {/* Budget-aware metrics */}
              {(() => {
                const metrics = jarMetrics.get(selectedJar.jar);
                if (metrics) {
                  return (
                    <div className="bg-slate-50 dark:bg-[#0c1222] p-5 rounded-xl border border-slate-100 dark:border-slate-700 mb-6 space-y-3">
                      <div className="flex justify-between items-baseline">
                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Kế hoạch</span>
                        <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{formatCurrency(metrics.planned)}</span>
                      </div>
                      <div className="flex justify-between items-baseline">
                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Cam kết</span>
                        <span className="text-lg font-bold text-purple-600 dark:text-purple-400">{formatCurrency(metrics.committed)}</span>
                      </div>
                      <div className="flex justify-between items-baseline">
                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Đã chi</span>
                        <span className="text-lg font-bold text-red-600 dark:text-red-400">{formatCurrency(metrics.spent)}</span>
                      </div>
                      {metrics.rollover > 0 && (
                        <div className="flex justify-between items-baseline">
                          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Dư kỳ trước</span>
                          <span className="text-lg font-bold text-teal-600 dark:text-teal-400">{formatCurrency(metrics.rollover)}</span>
                        </div>
                      )}
                      <div className="border-t border-slate-200 dark:border-slate-600 pt-3 flex justify-between items-baseline">
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Còn lại</span>
                        <span className={`text-xl font-bold ${metrics.available >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                          {formatCurrency(metrics.available)}
                        </span>
                      </div>
                      {metrics.funds_count > 0 && (
                        <p className="text-xs text-slate-400 dark:text-slate-500">{metrics.funds_count} quỹ con gắn với hũ này</p>
                      )}
                    </div>
                  );
                }
                return (
                  <div className="bg-slate-50 dark:bg-[#0c1222] p-5 rounded-xl border border-slate-100 dark:border-slate-700 mb-6 space-y-4">
                    <div className="flex justify-between items-baseline">
                      <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Thu nhập</span>
                      <span className="text-lg font-bold text-green-600">{formatCurrency(selectedJar.income)}</span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Chi tiêu</span>
                      <span className="text-lg font-bold text-red-600">{formatCurrency(selectedJar.expense)}</span>
                    </div>
                    <div className="border-t border-slate-200 dark:border-slate-600 pt-4 flex justify-between items-baseline">
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Net</span>
                      <span className={`text-xl font-bold ${selectedJar.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatSignedAmount(selectedJar.net)}
                      </span>
                    </div>
                  </div>
                );
              })()}

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
