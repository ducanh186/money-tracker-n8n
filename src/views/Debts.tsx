import { useState } from 'react';
import {
  Loader2,
  Plus,
  X,
  CreditCard,
  TrendingDown,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  DollarSign,
} from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { useDebts, useCreateDebt, useUpdateDebt, useDeleteDebt, usePayDebt } from '../lib/hooks';
import type { Debt, CreateDebtPayload, PayDebtPayload } from '../lib/types';

// ── Debt Card ──────────────────────────────────────────────

function DebtCard({
  debt,
  onPay,
  onEdit,
  onDelete,
}: {
  debt: Debt;
  onPay: (d: Debt) => void;
  onEdit: (d: Debt) => void;
  onDelete: (id: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const isActive = debt.status === 'active';

  return (
    <div className="rounded-xl bg-white dark:bg-[#1a2433] border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h4 className="font-bold text-slate-900 dark:text-white truncate">{debt.name}</h4>
              {debt.priority > 0 && (
                <span className="px-1.5 py-0.5 rounded text-xs font-bold bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400">
                  P{debt.priority}
                </span>
              )}
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                debt.status === 'active' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
                : debt.status === 'paid_off' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
              }`}>
                {debt.status === 'active' ? 'Đang trả' : debt.status === 'paid_off' ? 'Đã trả xong' : 'Quá hạn'}
              </span>
            </div>
            {debt.creditor && (
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">Chủ nợ: {debt.creditor}</p>
            )}

            {/* Progress bar */}
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-500 dark:text-slate-400">Tiến độ</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">{debt.progress_pct}%</span>
              </div>
              <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    debt.progress_pct >= 100 ? 'bg-emerald-500' : debt.progress_pct >= 50 ? 'bg-blue-500' : 'bg-amber-500'
                  }`}
                  style={{ width: `${Math.min(100, debt.progress_pct)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="text-right shrink-0">
            <p className="text-lg font-bold text-red-600 dark:text-red-400">{formatCurrency(debt.remaining_amount)}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500">/ {formatCurrency(debt.total_amount)}</p>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3 mt-3 text-xs">
          <div className="bg-slate-50 dark:bg-[#0c1222] rounded-lg p-2">
            <div className="text-slate-400 dark:text-slate-500">Thanh toán tối thiểu</div>
            <div className="font-semibold text-slate-700 dark:text-slate-300">{formatCurrency(debt.minimum_payment)}</div>
          </div>
          <div className="bg-slate-50 dark:bg-[#0c1222] rounded-lg p-2">
            <div className="text-slate-400 dark:text-slate-500">Lãi suất</div>
            <div className="font-semibold text-slate-700 dark:text-slate-300">{debt.interest_rate}%/năm</div>
          </div>
          <div className="bg-slate-50 dark:bg-[#0c1222] rounded-lg p-2">
            <div className="text-slate-400 dark:text-slate-500">
              {debt.days_until_due !== null ? 'Ngày đến hạn' : 'Đã trả'}
            </div>
            <div className="font-semibold text-slate-700 dark:text-slate-300">
              {debt.days_until_due !== null ? `Còn ${debt.days_until_due} ngày` : formatCurrency(debt.total_paid)}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-3">
          {isActive && (
            <button
              onClick={() => onPay(debt)}
              className="flex-1 flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <DollarSign className="size-4" />
              Thanh toán
            </button>
          )}
          <button
            onClick={() => onEdit(debt)}
            className="px-3 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            Sửa
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            className="px-2 py-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </button>
        </div>
      </div>

      {/* Expanded payment history */}
      {expanded && debt.payments && debt.payments.length > 0 && (
        <div className="border-t border-slate-100 dark:border-slate-700 p-4 bg-slate-50 dark:bg-[#0c1222]">
          <h5 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Lịch sử thanh toán</h5>
          <div className="flex flex-col gap-1.5">
            {debt.payments.map((p) => (
              <div key={p.id} className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">{p.paid_at?.slice(0, 10) ?? '—'}</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">{formatCurrency(p.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Create Debt Form ──────────────────────────────────────

function CreateDebtForm({ onClose }: { onClose: () => void }) {
  const mutation = useCreateDebt();
  const [form, setForm] = useState<CreateDebtPayload>({
    name: '',
    creditor: '',
    total_amount: 0,
    remaining_amount: 0,
    interest_rate: 0,
    minimum_payment: 0,
    due_day_of_month: null,
    strategy: 'snowball',
    priority: 1,
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || form.total_amount <= 0) return;
    mutation.mutate(form, { onSuccess: () => onClose() });
  };

  const numField = (label: string, key: keyof CreateDebtPayload, placeholder = '0') => (
    <div>
      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>
      <input
        type="text"
        inputMode="numeric"
        value={(form[key] as number) || ''}
        onChange={(e) => setForm({ ...form, [key]: Number(e.target.value.replace(/\D/g, '')) || 0 })}
        placeholder={placeholder}
        className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-[#0c1222] text-slate-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );

  return (
    <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#1a2433] rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Thêm khoản nợ</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"><X className="size-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Tên khoản nợ *</label>
            <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="VD: Trả góp laptop, Vay bạn..."
              className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-[#0c1222] text-slate-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Chủ nợ</label>
            <input type="text" value={form.creditor ?? ''} onChange={(e) => setForm({ ...form, creditor: e.target.value })}
              placeholder="VD: Ngân hàng, Bạn A..."
              className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-[#0c1222] text-slate-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            {numField('Tổng nợ gốc *', 'total_amount')}
            {numField('Còn phải trả *', 'remaining_amount')}
          </div>
          <div className="grid grid-cols-3 gap-4">
            {numField('Thanh toán tối thiểu/tháng', 'minimum_payment')}
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Lãi suất (%/năm)</label>
              <input type="number" step="0.1" min="0" max="100" value={form.interest_rate ?? 0}
                onChange={(e) => setForm({ ...form, interest_rate: parseFloat(e.target.value) || 0 })}
                className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-[#0c1222] text-slate-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {numField('Ngày đến hạn (1-31)', 'due_day_of_month')}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Chiến lược</label>
              <select value={form.strategy} onChange={(e) => setForm({ ...form, strategy: e.target.value as 'snowball' | 'avalanche' })}
                className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-[#0c1222] text-slate-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="snowball">Snowball (nợ nhỏ trước)</option>
                <option value="avalanche">Avalanche (lãi cao trước)</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Ưu tiên</label>
              <select value={form.priority} onChange={(e) => setForm({ ...form, priority: parseInt(e.target.value) })}
                className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-[#0c1222] text-slate-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value={1}>P1 — Cao nhất</option>
                <option value={2}>P2 — Cao</option>
                <option value={3}>P3 — Trung bình</option>
                <option value={4}>P4 — Thấp</option>
                <option value={0}>Không ưu tiên</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Ghi chú</label>
            <input type="text" value={form.notes ?? ''} onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-[#0c1222] text-slate-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="pt-2 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg">Hủy</button>
            <button type="submit" disabled={mutation.isPending || !form.name || form.total_amount <= 0}
              className="flex items-center justify-center min-w-[100px] px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg">
              {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : 'Tạo nợ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Pay Debt Modal ──────────────────────────────────────

function PayDebtModal({ debt, onClose }: { debt: Debt; onClose: () => void }) {
  const mutation = usePayDebt();
  const [amount, setAmount] = useState(debt.minimum_payment || 0);
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) return;
    const payload: PayDebtPayload = { amount, notes: notes || undefined };
    mutation.mutate({ id: debt.id, payload }, { onSuccess: () => onClose() });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#1a2433] rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Thanh toán: {debt.name}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"><X className="size-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <div className="bg-slate-50 dark:bg-[#0c1222] rounded-xl p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Còn nợ:</span>
              <span className="font-bold text-red-600 dark:text-red-400">{formatCurrency(debt.remaining_amount)}</span>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-slate-500 dark:text-slate-400">Tối thiểu/tháng:</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">{formatCurrency(debt.minimum_payment)}</span>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Số tiền thanh toán *</label>
            <input type="text" inputMode="numeric" required
              value={amount || ''} onChange={(e) => setAmount(Number(e.target.value.replace(/\D/g, '')) || 0)}
              className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-[#0c1222] text-slate-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Ghi chú</label>
            <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-[#0c1222] text-slate-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="pt-2 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg">Hủy</button>
            <button type="submit" disabled={mutation.isPending || amount <= 0}
              className="flex items-center justify-center min-w-[100px] px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg">
              {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : 'Thanh toán'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Debts Page ──────────────────────────────────────

export default function Debts({ month: _month }: { month: string }) {
  const [showCreate, setShowCreate] = useState(false);
  const [payingDebt, setPayingDebt] = useState<Debt | null>(null);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('active');
  const deleteMutation = useDeleteDebt();

  const { data, isPending, error } = useDebts(filterStatus || undefined);
  const debts = data?.data ?? [];
  const summary = data?.summary;

  if (isPending) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="size-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-500">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-slate-900 dark:text-white text-3xl font-bold tracking-tight">Quản lý Nợ</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Theo dõi và trả nợ theo chiến lược</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus className="size-4" />
          Thêm khoản nợ
        </button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-[#1a2433] rounded-xl p-5 shadow-sm border border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-red-100 dark:bg-red-500/20">
                <CreditCard className="size-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Tổng nợ còn lại</p>
                <p className="text-xl font-bold text-red-600 dark:text-red-400">{formatCurrency(summary.total_debt)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-[#1a2433] rounded-xl p-5 shadow-sm border border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-500/20">
                <TrendingDown className="size-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Thanh toán tối thiểu/tháng</p>
                <p className="text-xl font-bold text-amber-600 dark:text-amber-400">{formatCurrency(summary.total_minimum)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-[#1a2433] rounded-xl p-5 shadow-sm border border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-500/20">
                <AlertTriangle className="size-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Khoản nợ đang trả</p>
                <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{summary.count_active}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center gap-2">
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
          {[
            { value: 'active', label: 'Đang trả' },
            { value: '', label: 'Tất cả' },
            { value: 'paid_off', label: 'Đã xong' },
          ].map((f) => (
            <button key={f.value} onClick={() => setFilterStatus(f.value)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                filterStatus === f.value
                  ? 'bg-white dark:bg-[#1a2433] text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Debt List */}
      {debts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <CheckCircle2 className="size-16 text-emerald-300 dark:text-emerald-700 mb-3" />
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            {filterStatus === 'active' ? 'Không có khoản nợ đang trả!' : 'Không có khoản nợ nào'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {debts
            .sort((a, b) => (b.priority || 0) - (a.priority || 0) || a.remaining_amount - b.remaining_amount)
            .map((debt) => (
              <DebtCard
                key={debt.id}
                debt={debt}
                onPay={setPayingDebt}
                onEdit={setEditingDebt}
                onDelete={(id) => {
                  if (confirm('Xóa khoản nợ này?')) deleteMutation.mutate(id);
                }}
              />
            ))}
        </div>
      )}

      {/* Modals */}
      {showCreate && <CreateDebtForm onClose={() => setShowCreate(false)} />}
      {payingDebt && <PayDebtModal debt={payingDebt} onClose={() => setPayingDebt(null)} />}
    </div>
  );
}
