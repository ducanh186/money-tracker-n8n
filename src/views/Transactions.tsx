import { useState, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight, Loader2, AlertCircle, ArrowUpRight, ArrowDownLeft, ArrowLeftRight, CircleDot } from 'lucide-react';
import { formatCurrency, formatSignedAmount } from '../lib/utils';
import { useTransactions, useBudgetStatus } from '../lib/hooks';
import type { Transaction, TransactionsQuery } from '../lib/types';
import TransactionDetails from '../components/TransactionDetails';
import TxDetailPanel from '../components/TxDetailPanel';

const PAGE_SIZE = 20;

const FLOW_TABS: { label: string; value: TransactionsQuery['flow'] | undefined }[] = [
  { label: 'Tất cả', value: undefined },
  { label: 'Thu nhập', value: 'income' },
  { label: 'Chi tiêu', value: 'expense' },
  { label: 'Chuyển khoản', value: 'transfer' },
];

function flowIcon(flow: string | null) {
  switch (flow) {
    case 'income':
      return <ArrowDownLeft className="size-4 text-green-600" />;
    case 'expense':
      return <ArrowUpRight className="size-4 text-red-600" />;
    case 'transfer':
      return <ArrowLeftRight className="size-4 text-blue-600" />;
    default:
      return null;
  }
}

function flowLabel(flow: string | null) {
  switch (flow) {
    case 'income':
      return 'Thu nhập';
    case 'expense':
      return 'Chi tiêu';
    case 'transfer':
      return 'Chuyển khoản';
    default:
      return flow ?? '—';
  }
}

function flowColor(flow: string | null) {
  switch (flow) {
    case 'income':
      return 'bg-green-100 text-green-700 dark:bg-green-100 dark:text-green-400';
    case 'expense':
      return 'bg-red-100 text-red-700 dark:bg-red-100 dark:text-red-400';
    case 'transfer':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-100 dark:text-blue-400';
    default:
      return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
  }
}

function parseTxDate(value: string | null): Date | null {
  if (!value) return null;
  const match = /^(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?$/.exec(value.trim());
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3] ?? new Date().getFullYear());
  const parsed = new Date(year, month - 1, day);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function mobileDateLabel(value: string | null) {
  if (!value) return 'Không rõ ngày';

  const parsed = parseTxDate(value);
  if (!parsed) return value;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  parsed.setHours(0, 0, 0, 0);

  const base = parsed.toLocaleDateString('vi-VN', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
  });

  if (parsed.getTime() === today.getTime()) return `Hôm nay · ${base}`;
  if (parsed.getTime() === yesterday.getTime()) return `Hôm qua · ${base}`;
  return base;
}

export default function Transactions({ month, hideHeader = false }: { month: string; hideHeader?: boolean }) {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeFlow, setActiveFlow] = useState<TransactionsQuery['flow'] | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const { data: budgetStatus } = useBudgetStatus(month);

  // Map of jar_key → planned amounts for badge coloring
  const jarBudgetMap = useMemo(() => {
    const m = new Map<string, { planned: number; spent: number; available: number }>();
    if (budgetStatus?.jars) {
      for (const j of budgetStatus.jars) {
        m.set(j.key, { planned: j.planned, spent: j.spent, available: j.available });
      }
    }
    return m;
  }, [budgetStatus]);

  // Simple debounce for search
  const [timer, setTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const handleSearch = (value: string) => {
    setSearch(value);
    if (timer) clearTimeout(timer);
    const t = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, 400);
    setTimer(t);
  };

  const params: TransactionsQuery = useMemo(() => ({
    month,
    flow: activeFlow,
    q: debouncedSearch || undefined,
    page,
    pageSize: PAGE_SIZE,
    sort: 'datetime_desc',
  }), [month, activeFlow, debouncedSearch, page]);

  const { data, isPending, error } = useTransactions(params);

  const transactions = data?.data ?? [];
  const meta = data?.meta;
  const totalPages = meta ? Math.ceil(meta.total / meta.pageSize) : 1;
  const mobileGroups = useMemo(() => {
    const groups = new Map<string, Transaction[]>();

    for (const tx of transactions) {
      const date = tx.date ?? 'unknown';
      const items = groups.get(date) ?? [];
      items.push(tx);
      groups.set(date, items);
    }

    return Array.from(groups.entries()).map(([date, items]) => ({
      date,
      label: mobileDateLabel(date === 'unknown' ? null : date),
      total: items.reduce((sum, tx) => sum + tx.signed_amount_vnd, 0),
      items,
    }));
  }, [transactions]);

  return (
    <div className="grid w-full grid-cols-1 gap-6 min-[1460px]:grid-cols-[minmax(0,1fr)_320px]">
      <div className="flex flex-col gap-6 min-w-0">
      {!hideHeader && (
        <div className="flex flex-col gap-1">
          <h2 className="text-slate-900 dark:text-white text-3xl font-bold tracking-tight">Giao dịch</h2>
          <p className="text-slate-500 dark:text-slate-400 text-base">
            {meta ? `${meta.total} giao dịch` : 'Đang tải...'}
          </p>
        </div>
      )}

      {/* Summary cards */}
      {meta && (
        <div className="hidden md:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {(() => {
            const hasBudgetPlan = budgetStatus?.plan?.has_period ?? budgetStatus?.has_period ?? true;
            const remainingAmount = hasBudgetPlan
              ? (budgetStatus?.plan?.available_to_spend_vnd ?? budgetStatus?.available_to_spend_vnd ?? budgetStatus?.available_to_spend ?? meta.totals.net_vnd)
              : (budgetStatus?.suggestion?.available_to_spend_vnd ?? budgetStatus?.suggestion?.remaining_vnd ?? meta.totals.net_vnd);

            return <>
          <div className="bg-white dark:bg-[#1a2433] rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Tổng thu</p>
            <p className="text-xl font-bold text-green-600 dark:text-green-400">{formatCurrency(meta.totals.income_vnd)}</p>
          </div>
          <div className="bg-white dark:bg-[#1a2433] rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Tổng chi</p>
            <p className="text-xl font-bold text-red-600 dark:text-red-400">{formatCurrency(meta.totals.expense_vnd)}</p>
          </div>
          <div className="bg-white dark:bg-[#1a2433] rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">{hasBudgetPlan ? 'Còn chi được' : 'Còn theo gợi ý'}</p>
            <p className={`text-xl font-bold ${remainingAmount >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
              {formatCurrency(remainingAmount)}
            </p>
          </div>
          <div className="bg-white dark:bg-[#1a2433] rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Số dư cuối kỳ</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white">
              {meta.totals.ending_balance_vnd != null ? formatCurrency(meta.totals.ending_balance_vnd) : '—'}
            </p>
          </div>
            </>;
          })()}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Tìm kiếm giao dịch..."
            className="w-full pl-10 pr-4 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-[#1a2433] text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-400"
          />
        </div>

        {/* Flow tabs */}
        <div className="flex bg-slate-100 dark:bg-[#0c1222] p-1 rounded-lg self-start">
          {FLOW_TABS.map((tab) => (
            <button
              key={tab.label}
              onClick={() => { setActiveFlow(tab.value); setPage(1); }}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                activeFlow === tab.value
                  ? 'bg-white dark:bg-[#1a2433] text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/40 rounded-xl p-6 text-center">
          <AlertCircle className="size-8 text-red-400 dark:text-red-500 mx-auto mb-2" />
          <p className="text-red-700 dark:text-red-400 font-medium">{error?.message}</p>
        </div>
      )}

      {/* Loading state */}
      {isPending && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="size-8 text-blue-600 animate-spin" />
        </div>
      )}

      {/* Transactions table */}
      {!isPending && !error && (
        <>
          {transactions.length === 0 ? (
            <div className="bg-white dark:bg-[#1a2433] rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
              <p className="text-slate-400 dark:text-slate-500 text-lg">Không tìm thấy giao dịch nào</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-[#1a2433] rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-[#0c1222]/50">
                      <th className="text-left font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-xs px-5 py-3">Ngày</th>
                      <th className="text-left font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-xs px-5 py-3">Mô tả</th>
                      <th className="text-left font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-xs px-5 py-3">Danh mục</th>
                      <th className="text-left font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-xs px-5 py-3">Hũ</th>
                      <th className="text-left font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-xs px-5 py-3">Loại</th>
                      <th className="text-right font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-xs px-5 py-3">Số tiền</th>
                      <th className="text-left font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-xs px-5 py-3">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-700/60">
                    {transactions.map((tx, idx) => {
                      const isSelected = selectedTx === tx;
                      return (
                      <tr
                        key={tx.idempotency_key ?? idx}
                        onClick={() => setSelectedTx(tx)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-blue-50 dark:bg-blue-900/20'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-700/40'
                        }`}
                      >
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <div className="text-slate-900 dark:text-white font-medium">{tx.date ?? '—'}</div>
                          <div className="text-xs text-slate-400 dark:text-slate-500">{tx.time ?? ''}</div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-slate-900 dark:text-white font-medium truncate block max-w-[250px]">{tx.description ?? '—'}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-slate-600 dark:text-slate-300">{tx.category ?? '—'}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          {tx.jar ? (
                            tx.jar.toUpperCase() === 'LOAN' ? (
                              <span
                                className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-500/20 dark:text-amber-300"
                                title="Vay/Trả nợ — không tính vào kế hoạch hũ"
                              >
                                💳 LOAN
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-300">
                                {(() => {
                                  const jb = jarBudgetMap.get(tx.jar);
                                  if (!jb) return <CircleDot className="size-3 text-slate-400" />;
                                  if (jb.available < 0) return <CircleDot className="size-3 text-red-500" />;
                                  return <CircleDot className="size-3 text-green-500" />;
                                })()}
                                {tx.jar}
                              </span>
                            )
                          ) : (
                            <span className="inline-flex items-center gap-1 text-slate-400 italic">
                              <CircleDot className="size-3 text-slate-300" />
                              Chưa gán
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${flowColor(tx.flow)}`}>
                            {flowIcon(tx.flow)}
                            {flowLabel(tx.flow)}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right whitespace-nowrap">
                          <span className={`font-semibold ${
                            tx.flow === 'income' ? 'text-green-600' :
                            tx.flow === 'expense' ? 'text-red-600' :
                            'text-blue-600'
                          }`}>
                            {formatSignedAmount(tx.amount_vnd, tx.flow)}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center gap-1 text-xs font-medium ${
                            tx.status === 'done' ? 'text-green-600' :
                            tx.status === 'pending' ? 'text-amber-600' : 'text-slate-500'
                          }`}>
                            <span className={`size-1.5 rounded-full ${
                              tx.status === 'done' ? 'bg-green-500' :
                              tx.status === 'pending' ? 'bg-amber-500' : 'bg-slate-400'
                            }`}></span>
                            {tx.status ?? '—'}
                          </span>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile list */}
              <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-700/60">
                {mobileGroups.map((group, groupIndex) => (
                  <div key={`${group.date}-${groupIndex}`}>
                    <div className={`flex items-center justify-between px-4 py-3 ${groupIndex > 0 ? 'border-t border-slate-100 dark:border-slate-700/60' : ''}`}>
                      <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                        {group.label}
                      </span>
                      <span className={`text-xs font-bold tabular-nums ${group.total >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {group.total >= 0 ? '+' : '−'}{formatCurrency(Math.abs(group.total))}
                      </span>
                    </div>

                    {group.items.map((tx, idx) => (
                      <div
                        key={tx.idempotency_key ?? `${group.date}-${idx}`}
                        onClick={() => setSelectedTx(tx)}
                        className={`flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/40 ${idx > 0 ? 'border-t border-slate-100/70 dark:border-slate-700/50' : ''}`}
                      >
                        <div className={`size-10 rounded-full flex items-center justify-center shrink-0 ${
                          tx.flow === 'income' ? 'bg-green-100 dark:bg-green-900/30' :
                          tx.flow === 'expense' ? 'bg-red-100 dark:bg-red-900/30' : 'bg-blue-100 dark:bg-blue-900/30'
                        }`}>
                          {flowIcon(tx.flow)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{tx.description ?? tx.category ?? '—'}</p>
                          <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
                            {tx.time ?? '--:--'} · {tx.flow === 'income' ? 'Thu nhập' : tx.jar ?? tx.category ?? 'Chưa gán hũ'}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className={`text-sm font-semibold ${
                            tx.flow === 'income' ? 'text-green-600' :
                            tx.flow === 'expense' ? 'text-red-600' : 'text-blue-600'
                          }`}>
                            {formatSignedAmount(tx.amount_vnd, tx.flow)}
                          </p>
                          <p className="text-xs text-slate-400">{tx.category ?? tx.date ?? ''}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Trang {page} / {totalPages} ({meta?.total} kết quả)
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-[#1a2433] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="size-4" />
                </button>
                {/* Page number buttons */}
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`size-9 rounded-lg text-sm font-medium transition-colors ${
                        page === pageNum
                          ? 'bg-blue-600 text-white'
                          : 'bg-white dark:bg-[#1a2433] border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-[#1a2433] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      </div>

      {/* Desktop inline detail panel */}
      <TxDetailPanel tx={selectedTx} />

      {/* Overlay detail panel when inline desktop panel is unavailable */}
      {selectedTx && (
        <div className="min-[1460px]:hidden">
          <TransactionDetails tx={selectedTx} onClose={() => setSelectedTx(null)} />
        </div>
      )}
    </div>
  );
}
