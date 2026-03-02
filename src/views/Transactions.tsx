import { useState, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight, Loader2, AlertCircle, ArrowUpRight, ArrowDownLeft, ArrowLeftRight } from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { useTransactions } from '../lib/hooks';
import type { Transaction, TransactionsQuery } from '../lib/types';
import TransactionDetails from '../components/TransactionDetails';

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
      return 'bg-green-100 text-green-700';
    case 'expense':
      return 'bg-red-100 text-red-700';
    case 'transfer':
      return 'bg-blue-100 text-blue-700';
    default:
      return 'bg-slate-100 text-slate-700';
  }
}

export default function Transactions({ month }: { month: string }) {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeFlow, setActiveFlow] = useState<TransactionsQuery['flow'] | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

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

  const { data, loading, error } = useTransactions(params);

  const transactions = data?.data ?? [];
  const meta = data?.meta;
  const totalPages = meta ? Math.ceil(meta.total / meta.pageSize) : 1;

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h2 className="text-slate-900 text-3xl font-bold tracking-tight">Giao dịch</h2>
        <p className="text-slate-500 text-base">
          {meta ? `${meta.total} giao dịch` : 'Đang tải...'}
        </p>
      </div>

      {/* Summary cards */}
      {meta && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Tổng thu</p>
            <p className="text-xl font-bold text-green-600">{formatCurrency(meta.totals.income_vnd)}</p>
          </div>
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Tổng chi</p>
            <p className="text-xl font-bold text-red-600">{formatCurrency(meta.totals.expense_vnd)}</p>
          </div>
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Net</p>
            <p className={`text-xl font-bold ${meta.totals.net_vnd >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {meta.totals.net_vnd >= 0 ? '+' : ''}{formatCurrency(meta.totals.net_vnd)}
            </p>
          </div>
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Số dư cuối kỳ</p>
            <p className="text-xl font-bold text-slate-900">
              {meta.totals.ending_balance_vnd != null ? formatCurrency(meta.totals.ending_balance_vnd) : '—'}
            </p>
          </div>
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
            className="w-full pl-10 pr-4 py-2.5 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-400"
          />
        </div>

        {/* Flow tabs */}
        <div className="flex bg-slate-100 p-1 rounded-lg self-start">
          {FLOW_TABS.map((tab) => (
            <button
              key={tab.label}
              onClick={() => { setActiveFlow(tab.value); setPage(1); }}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                activeFlow === tab.value
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <AlertCircle className="size-8 text-red-400 mx-auto mb-2" />
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="size-8 text-blue-600 animate-spin" />
        </div>
      )}

      {/* Transactions table */}
      {!loading && !error && (
        <>
          {transactions.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <p className="text-slate-400 text-lg">Không tìm thấy giao dịch nào</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50">
                      <th className="text-left font-semibold text-slate-500 uppercase tracking-wider text-xs px-5 py-3">Ngày</th>
                      <th className="text-left font-semibold text-slate-500 uppercase tracking-wider text-xs px-5 py-3">Mô tả</th>
                      <th className="text-left font-semibold text-slate-500 uppercase tracking-wider text-xs px-5 py-3">Danh mục</th>
                      <th className="text-left font-semibold text-slate-500 uppercase tracking-wider text-xs px-5 py-3">Hũ</th>
                      <th className="text-left font-semibold text-slate-500 uppercase tracking-wider text-xs px-5 py-3">Loại</th>
                      <th className="text-right font-semibold text-slate-500 uppercase tracking-wider text-xs px-5 py-3">Số tiền</th>
                      <th className="text-left font-semibold text-slate-500 uppercase tracking-wider text-xs px-5 py-3">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {transactions.map((tx, idx) => (
                      <tr
                        key={tx.idempotency_key ?? idx}
                        onClick={() => setSelectedTx(tx)}
                        className="hover:bg-slate-50 cursor-pointer transition-colors"
                      >
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <div className="text-slate-900 font-medium">{tx.date ?? '—'}</div>
                          <div className="text-xs text-slate-400">{tx.time ?? ''}</div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-slate-900 font-medium truncate block max-w-[250px]">{tx.description ?? '—'}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-slate-600">{tx.category ?? '—'}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-slate-600">{tx.jar ?? '—'}</span>
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
                            {tx.flow === 'income' ? '+' : tx.flow === 'expense' ? '-' : ''}
                            {formatCurrency(tx.amount_vnd)}
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
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile list */}
              <div className="md:hidden divide-y divide-slate-100">
                {transactions.map((tx, idx) => (
                  <div
                    key={tx.idempotency_key ?? idx}
                    onClick={() => setSelectedTx(tx)}
                    className="flex items-center gap-3 px-4 py-3.5 cursor-pointer hover:bg-slate-50 transition-colors"
                  >
                    <div className={`size-10 rounded-full flex items-center justify-center shrink-0 ${
                      tx.flow === 'income' ? 'bg-green-100' :
                      tx.flow === 'expense' ? 'bg-red-100' : 'bg-blue-100'
                    }`}>
                      {flowIcon(tx.flow)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{tx.description ?? '—'}</p>
                      <p className="text-xs text-slate-400">{tx.category ?? ''} · {tx.date ?? ''}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-sm font-semibold ${
                        tx.flow === 'income' ? 'text-green-600' :
                        tx.flow === 'expense' ? 'text-red-600' : 'text-blue-600'
                      }`}>
                        {tx.flow === 'income' ? '+' : tx.flow === 'expense' ? '-' : ''}
                        {formatCurrency(tx.amount_vnd)}
                      </p>
                      <p className="text-xs text-slate-400">{tx.jar ?? ''}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">
                Trang {page} / {totalPages} ({meta?.total} kết quả)
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Transaction Detail Drawer */}
      {selectedTx && (
        <TransactionDetails tx={selectedTx} onClose={() => setSelectedTx(null)} />
      )}
    </div>
  );
}
