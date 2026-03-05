import { X, Store, ArrowUpRight, ArrowDownLeft, ArrowLeftRight, Calendar, Clock, Tag, Wallet, Building2, CheckCircle2, FileText, Hash } from 'lucide-react';
import { formatCurrency, formatSignedAmount } from '../lib/utils';
import type { Transaction } from '../lib/types';

function flowLabel(flow: string | null) {
  switch (flow) {
    case 'income': return 'Thu nhập';
    case 'expense': return 'Chi tiêu';
    case 'transfer': return 'Chuyển khoản';
    default: return flow ?? '—';
  }
}

function FlowIcon({ flow }: { flow: string | null }) {
  switch (flow) {
    case 'income': return <ArrowDownLeft className="size-4" />;
    case 'expense': return <ArrowUpRight className="size-4" />;
    case 'transfer': return <ArrowLeftRight className="size-4" />;
    default: return null;
  }
}

function flowBadgeColor(flow: string | null) {
  switch (flow) {
    case 'income': return 'bg-green-100 text-green-700 dark:bg-green-100 dark:text-green-400';
    case 'expense': return 'bg-red-100 text-red-700 dark:bg-red-100 dark:text-red-400';
    case 'transfer': return 'bg-blue-100 text-blue-700 dark:bg-blue-100 dark:text-blue-400';
    default: return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
  }
}

export default function TransactionDetails({ tx, onClose }: { tx: Transaction; onClose: () => void }) {
  return (
    <>
      <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-[1px] z-40" onClick={onClose}></div>
      <aside className="fixed top-0 right-0 bottom-0 w-full max-w-[480px] bg-white shadow-2xl z-50 flex flex-col border-l border-slate-200 transform transition-transform duration-300 ease-in-out">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Chi tiết Giao dịch</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors group">
            <X className="size-5 group-hover:text-blue-600" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {/* Title / Description */}
          <div className="flex items-start gap-4 mb-8">
            <div className="size-14 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
              <Store className="size-7 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <h3 className="text-lg font-bold text-slate-900 truncate">{tx.description ?? '—'}</h3>
              <p className="text-sm text-slate-500 truncate">{tx.category ?? '—'}</p>
            </div>
          </div>
          
          {/* Amount & Flow */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="col-span-2 sm:col-span-1 p-4 rounded-xl bg-slate-50 border border-slate-100">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Số tiền</p>
              <div className="flex items-baseline gap-1">
                <span className={`text-2xl font-bold ${
                  tx.flow === 'income' ? 'text-green-600' :
                  tx.flow === 'expense' ? 'text-red-600' :
                  'text-slate-900'
                }`}>
                  {formatSignedAmount(tx.amount_vnd, tx.flow)}
                </span>
              </div>
              {tx.amount_k !== tx.amount_vnd && (
                <p className="text-xs text-slate-400 mt-1">{tx.amount_k}K</p>
              )}
            </div>
            <div className="col-span-2 sm:col-span-1 p-4 rounded-xl bg-slate-50 border border-slate-100">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Dòng tiền</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${flowBadgeColor(tx.flow)}`}>
                  <FlowIcon flow={tx.flow} />
                  {flowLabel(tx.flow)}
                </span>
              </div>
            </div>
          </div>
          
          <div className="space-y-6">
            {/* Time */}
            <div>
              <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-3">Thời gian</h4>
              <div className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-100">
                <div className="flex justify-between items-center p-3.5">
                  <span className="text-sm text-slate-500 flex items-center gap-2"><Calendar className="size-4" /> Ngày</span>
                  <span className="text-sm font-medium text-slate-900">{tx.date ?? '—'}</span>
                </div>
                <div className="flex justify-between items-center p-3.5">
                  <span className="text-sm text-slate-500 flex items-center gap-2"><Clock className="size-4" /> Giờ</span>
                  <span className="text-sm font-medium text-slate-900">{tx.time ?? '—'}</span>
                </div>
              </div>
            </div>
            
            {/* Classification */}
            <div>
              <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-3">Phân loại</h4>
              <div className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-100">
                <div className="flex justify-between items-center p-3.5">
                  <span className="text-sm text-slate-500 flex items-center gap-2"><Tag className="size-4" /> Danh mục</span>
                  <div className="flex items-center gap-2">
                    <div className="size-2 rounded-full bg-green-500"></div>
                    <span className="text-sm font-medium text-slate-900">{tx.category ?? '—'}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center p-3.5">
                  <span className="text-sm text-slate-500 flex items-center gap-2"><Wallet className="size-4" /> Hũ</span>
                  <span className="text-sm font-medium text-slate-900">{tx.jar ?? '—'}</span>
                </div>
              </div>
            </div>
            
            {/* Account & Status */}
            <div>
              <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-3">Tài khoản & Trạng thái</h4>
              <div className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-100">
                <div className="flex justify-between items-center p-3.5">
                  <span className="text-sm text-slate-500 flex items-center gap-2"><Building2 className="size-4" /> Tài khoản</span>
                  <span className="text-sm font-medium text-slate-900">{tx.account ?? '—'}</span>
                </div>
                <div className="flex justify-between items-center p-3.5">
                  <span className="text-sm text-slate-500 flex items-center gap-2"><CheckCircle2 className="size-4" /> Trạng thái</span>
                  <span className={`inline-flex items-center gap-1 text-sm font-medium ${
                    tx.status === 'done' ? 'text-green-600' :
                    tx.status === 'pending' ? 'text-amber-600' : 'text-slate-600'
                  }`}>
                    <span className={`size-2 rounded-full mr-1 ${
                      tx.status === 'done' ? 'bg-green-500' :
                      tx.status === 'pending' ? 'bg-amber-500' : 'bg-slate-400'
                    }`}></span>
                    {tx.status ?? '—'}
                  </span>
                </div>
                {tx.balance_vnd != null && (
                  <div className="flex justify-between items-center p-3.5">
                    <span className="text-sm text-slate-500 flex items-center gap-2"><Wallet className="size-4" /> Số dư</span>
                    <span className="text-sm font-medium text-slate-900">{formatCurrency(tx.balance_vnd)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Note */}
            {tx.note && (
              <div>
                <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-3">Ghi chú</h4>
                <div className="bg-white border border-slate-200 rounded-lg p-3.5">
                  <div className="flex items-start gap-2">
                    <FileText className="size-4 text-slate-400 mt-0.5 shrink-0" />
                    <p className="text-sm text-slate-700">{tx.note}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Idempotency Key */}
            {tx.idempotency_key && (
              <div>
                <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-3">Mã giao dịch</h4>
                <div className="bg-white border border-slate-200 rounded-lg p-3.5">
                  <div className="flex items-center gap-2">
                    <Hash className="size-4 text-slate-400 shrink-0" />
                    <span className="text-xs font-mono text-slate-500 truncate">{tx.idempotency_key}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
