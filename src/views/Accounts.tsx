import { useState } from 'react';
import {
  Loader2,
  Building2,
  Plus,
  X,
  ArrowRightLeft,
  Wallet,
  CreditCard,
  Banknote,
  Smartphone,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Target,
} from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import {
  useAccounts,
  useNetWorth,
  useCreateAccount,
  useTransfers,
  useCreateTransfer,
  useGoals,
  useJars,
} from '../lib/hooks';
import type { Account, CreateAccountPayload, CreateTransferPayload } from '../lib/types';

// ── Account type helpers ──────────────────────────

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  checking: 'Tài khoản thanh toán',
  savings: 'Tài khoản tiết kiệm',
  cash: 'Tiền mặt',
  ewallet: 'Ví điện tử',
  investment: 'Đầu tư',
};

const ACCOUNT_TYPE_ICONS: Record<string, React.ElementType> = {
  checking: CreditCard,
  savings: Building2,
  cash: Banknote,
  ewallet: Smartphone,
  investment: TrendingUp,
};

const ACCOUNT_TYPE_COLORS: Record<string, string> = {
  checking: 'bg-blue-100 text-blue-600',
  savings: 'bg-emerald-100 text-emerald-600',
  cash: 'bg-amber-100 text-amber-600',
  ewallet: 'bg-purple-100 text-purple-600',
  investment: 'bg-green-100 text-green-600',
};

// ── Create Account Form ──────────────────────────

function CreateAccountForm({ onClose }: { onClose: () => void }) {
  const createMutation = useCreateAccount();
  const [form, setForm] = useState<CreateAccountPayload>({
    name: '',
    type: 'checking',
    institution: null,
    balance: 0,
    currency: 'VND',
  });
  const [balanceStr, setBalanceStr] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) return;
    createMutation.mutate(form, { onSuccess: () => onClose() });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">Thêm tài khoản</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="size-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Tên tài khoản *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="VD: VCB Lương, TPBank Tiết kiệm..."
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-slate-700">Loại</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as Account['type'] })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(ACCOUNT_TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Ngân hàng / Tổ chức</label>
              <input
                type="text"
                value={form.institution ?? ''}
                onChange={(e) => setForm({ ...form, institution: e.target.value || null })}
                placeholder="VD: Vietcombank"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Số dư ban đầu</label>
            <input
              type="text"
              inputMode="numeric"
              value={balanceStr}
              onChange={(e) => {
                const raw = e.target.value.replace(/\D/g, '');
                setBalanceStr(raw ? Number(raw).toLocaleString('vi-VN') : '');
                setForm({ ...form, balance: Number(raw) || 0 });
              }}
              placeholder="0"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100">Huỷ</button>
            <button
              type="submit"
              disabled={createMutation.isPending || !form.name}
              className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {createMutation.isPending && <Loader2 className="size-4 animate-spin" />}
              Thêm tài khoản
            </button>
          </div>

          {createMutation.isError && (
            <p className="text-sm text-red-500">{createMutation.error.message}</p>
          )}
        </form>
      </div>
    </div>
  );
}

// ── Transfer Form ──────────────────────────────────

function TransferForm({ accounts, onClose }: { accounts: Account[]; onClose: () => void }) {
  const createMutation = useCreateTransfer();
  const { data: goalsRes } = useGoals('active');
  const { data: jarsRes } = useJars();
  const goals = goalsRes?.data ?? [];
  const jars = jarsRes?.data ?? [];

  const [form, setForm] = useState<CreateTransferPayload>({
    from_account_id: accounts[0]?.id ?? 0,
    to_account_id: accounts[1]?.id ?? 0,
    amount: 0,
    goal_id: null,
    jar_id: null,
    description: null,
  });
  const [amountStr, setAmountStr] = useState('');

  const selectedGoal = goals.find((g) => g.id === form.goal_id);
  const fromAccount = accounts.find((a) => a.id === form.from_account_id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.amount <= 0 || form.from_account_id === form.to_account_id) return;
    createMutation.mutate(form, {
      onSuccess: () => {
        alert('Chuyển khoản thành công! Số dư đã được cập nhật.');
        onClose();
      },
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">Chuyển khoản</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="size-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          {/* Info banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
            <strong>Lưu ý:</strong> Đây là chuyển khoản giữa các tài khoản, không ảnh hưởng tổng chi tiêu.
          </div>

          {/* From / To */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-slate-700">Từ tài khoản *</label>
              <select
                value={form.from_account_id}
                onChange={(e) => setForm({ ...form, from_account_id: Number(e.target.value) })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id} disabled={a.id === form.to_account_id}>
                    {a.name} ({formatCurrency(a.balance)})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Đến tài khoản *</label>
              <select
                value={form.to_account_id}
                onChange={(e) => setForm({ ...form, to_account_id: Number(e.target.value) })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id} disabled={a.id === form.from_account_id}>
                    {a.name} ({formatCurrency(a.balance)})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {form.from_account_id === form.to_account_id && (
            <p className="text-xs text-red-500">Tài khoản nguồn và đích không được trùng nhau</p>
          )}

          {/* Amount */}
          <div>
            <label className="text-sm font-medium text-slate-700">Số tiền *</label>
            <input
              type="text"
              inputMode="numeric"
              required
              value={amountStr}
              onChange={(e) => {
                const raw = e.target.value.replace(/\D/g, '');
                setAmountStr(raw ? Number(raw).toLocaleString('vi-VN') : '');
                setForm({ ...form, amount: Number(raw) || 0 });
              }}
              placeholder="500,000"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {fromAccount && form.amount > fromAccount.balance && (
              <p className="text-xs text-amber-500 mt-1">Số tiền vượt quá số dư tài khoản nguồn ({formatCurrency(fromAccount.balance)})</p>
            )}
          </div>

          {/* Goal link (optional) */}
          <div>
            <label className="text-sm font-medium text-slate-700">Gắn quỹ mục tiêu (tuỳ chọn)</label>
            <select
              value={form.goal_id ?? ''}
              onChange={(e) => setForm({ ...form, goal_id: e.target.value ? Number(e.target.value) : null })}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Không gắn quỹ</option>
              {goals.map((g) => (
                <option key={g.id} value={g.id}>{g.name} (còn thiếu {formatCurrency(g.shortfall)})</option>
              ))}
            </select>
            {selectedGoal && form.amount > 0 && (
              <p className="text-xs text-emerald-600 mt-1">
                Transfer này sẽ góp {formatCurrency(form.amount)} vào Quỹ "{selectedGoal.name}"
              </p>
            )}
          </div>

          {/* Jar link (optional) */}
          <div>
            <label className="text-sm font-medium text-slate-700">Hũ liên quan (tuỳ chọn)</label>
            <select
              value={form.jar_id ?? ''}
              onChange={(e) => setForm({ ...form, jar_id: e.target.value ? Number(e.target.value) : null })}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Không chọn</option>
              {jars.map((j) => (
                <option key={j.id} value={j.id}>{j.label} ({j.key})</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium text-slate-700">Mô tả</label>
            <input
              type="text"
              value={form.description ?? ''}
              onChange={(e) => setForm({ ...form, description: e.target.value || null })}
              placeholder="VD: Chuyển tiết kiệm tháng 3"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100">Huỷ</button>
            <button
              type="submit"
              disabled={createMutation.isPending || form.amount <= 0 || form.from_account_id === form.to_account_id}
              className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {createMutation.isPending && <Loader2 className="size-4 animate-spin" />}
              Xác nhận chuyển
            </button>
          </div>

          {createMutation.isError && (
            <p className="text-sm text-red-500">{createMutation.error.message}</p>
          )}
        </form>
      </div>
    </div>
  );
}

// ── Main Accounts Page ─────────────────────────────

export default function Accounts({ month: _month }: { month: string }) {
  const [activeTab, setActiveTab] = useState<'accounts' | 'transfers'>('accounts');
  const [showCreateAccount, setShowCreateAccount] = useState(false);
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [expandedAccountId, setExpandedAccountId] = useState<number | null>(null);

  const { data: accountsRes, isPending: accountsLoading, error: accountsError } = useAccounts();
  const { data: netWorthRes, isPending: netWorthLoading } = useNetWorth();
  const { data: transfersRes, isPending: transfersLoading } = useTransfers();

  const accounts = accountsRes?.data ?? [];
  const transfers = transfersRes?.data ?? [];
  const netWorth = netWorthRes?.net_worth ?? 0;

  const isLoading = accountsLoading || netWorthLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="size-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (accountsError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-500 font-medium">{accountsError.message}</p>
          <p className="text-sm text-slate-400 mt-1">Không thể tải danh sách tài khoản</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Tài khoản</h2>
          <p className="text-sm text-slate-500">{accounts.length} tài khoản đang hoạt động</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTransferForm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-colors"
          >
            <ArrowRightLeft className="size-4" />
            Chuyển khoản
          </button>
          <button
            onClick={() => setShowCreateAccount(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-colors"
          >
            <Plus className="size-4" />
            Thêm TK
          </button>
        </div>
      </div>

      {/* Net Worth Card */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-600 to-indigo-800 p-6 shadow-lg text-white">
        <div className="absolute right-0 top-0 h-40 w-40 translate-x-12 -translate-y-12 rounded-full bg-white/10"></div>
        <div className="relative z-10">
          <span className="text-sm font-medium text-white/80">Tổng tài sản ròng</span>
          <h2 className="text-3xl font-bold tracking-tight mt-1">{formatCurrency(netWorth)}</h2>
          <p className="text-sm text-white/70 mt-2">{accounts.length} tài khoản • {transfers.length} lượt chuyển khoản</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('accounts')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'accounts' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Wallet className="size-4 inline mr-1.5" />
          Tài khoản
        </button>
        <button
          onClick={() => setActiveTab('transfers')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'transfers' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <ArrowRightLeft className="size-4 inline mr-1.5" />
          Lịch sử chuyển khoản
        </button>
      </div>

      {/* Accounts Tab */}
      {activeTab === 'accounts' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-16">
              <Wallet className="size-16 text-slate-300 mb-3" />
              <p className="text-slate-500 font-medium">Chưa có tài khoản nào</p>
              <p className="text-sm text-slate-400">Thêm tài khoản đầu tiên để bắt đầu theo dõi</p>
            </div>
          ) : (
            accounts.map((account) => {
              const TypeIcon = ACCOUNT_TYPE_ICONS[account.type] ?? Wallet;
              const typeColor = ACCOUNT_TYPE_COLORS[account.type] ?? 'bg-slate-100 text-slate-600';
              const isExpanded = expandedAccountId === account.id;

              return (
                <div
                  key={account.id}
                  className="rounded-xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setExpandedAccountId(isExpanded ? null : account.id)}
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`flex size-10 shrink-0 items-center justify-center rounded-full ${typeColor}`}>
                          <TypeIcon className="size-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-sm">{account.name}</h3>
                          <p className="text-xs text-slate-400">{ACCOUNT_TYPE_LABELS[account.type] ?? account.type}</p>
                        </div>
                      </div>
                      {isExpanded ? <ChevronUp className="size-4 text-slate-400" /> : <ChevronDown className="size-4 text-slate-400" />}
                    </div>
                    <div className="mt-4">
                      <span className="text-xl font-bold text-slate-900">{formatCurrency(account.balance)}</span>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-5 pb-4 border-t border-slate-100 pt-3 text-sm grid grid-cols-2 gap-2">
                      <div className="bg-slate-50 rounded-lg p-2">
                        <div className="text-xs text-slate-400">Tổ chức</div>
                        <div className="font-medium text-slate-700">{account.institution ?? '—'}</div>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-2">
                        <div className="text-xs text-slate-400">Tiền tệ</div>
                        <div className="font-medium text-slate-700">{account.currency}</div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Transfers Tab */}
      {activeTab === 'transfers' && (
        <div className="flex flex-col gap-3">
          {transfersLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-6 text-blue-600 animate-spin" />
            </div>
          ) : transfers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <ArrowRightLeft className="size-16 text-slate-300 mb-3" />
              <p className="text-slate-500 font-medium">Chưa có chuyển khoản nào</p>
              <p className="text-sm text-slate-400">Tạo chuyển khoản đầu tiên giữa các tài khoản</p>
            </div>
          ) : (
            transfers.map((t) => (
              <div key={t.id} className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm border border-slate-100">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                    <ArrowRightLeft className="size-5" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-semibold text-slate-900 text-sm truncate">
                      {t.from_account?.name ?? '?'} → {t.to_account?.name ?? '?'}
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(t.transferred_at).toLocaleDateString('vi-VN')}
                      {t.description && ` • ${t.description}`}
                    </span>
                    {t.goal && (
                      <span className="text-xs text-emerald-600 flex items-center gap-1 mt-0.5">
                        <Target className="size-3" />
                        Quỹ: {t.goal.name}
                      </span>
                    )}
                    {t.jar && (
                      <span className="text-xs text-blue-500 mt-0.5">Hũ: {t.jar.label}</span>
                    )}
                  </div>
                </div>
                <span className="font-bold text-slate-900 shrink-0 ml-3">{formatCurrency(t.amount)}</span>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modals */}
      {showCreateAccount && <CreateAccountForm onClose={() => setShowCreateAccount(false)} />}
      {showTransferForm && accounts.length >= 2 && (
        <TransferForm accounts={accounts} onClose={() => setShowTransferForm(false)} />
      )}
      {showTransferForm && accounts.length < 2 && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm text-center">
            <p className="text-slate-700 font-medium mb-2">Cần ít nhất 2 tài khoản để chuyển khoản</p>
            <p className="text-sm text-slate-400 mb-4">Hãy thêm tài khoản trước</p>
            <div className="flex justify-center gap-3">
              <button onClick={() => setShowTransferForm(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100">Đóng</button>
              <button
                onClick={() => { setShowTransferForm(false); setShowCreateAccount(true); }}
                className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-blue-600 hover:bg-blue-700"
              >
                Thêm tài khoản
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
