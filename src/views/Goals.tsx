import { useState } from 'react';
import {
  Loader2,
  Target,
  Plus,
  X,
  DollarSign,
  Calendar,
  CheckCircle2,
  Pause,
  ChevronDown,
  ChevronUp,
  ArrowUpCircle,
  Pencil,
  Trash2,
  PiggyBank,
} from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { useGoals, useGoal, useCreateGoal, useContributeGoal, useUpdateGoal, useDeleteGoal, useJars, useFunds } from '../lib/hooks';
import type { Goal, CreateGoalPayload, ContributePayload, Fund } from '../lib/types';

// ── Status helpers ─────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  active: 'Đang thực hiện',
  completed: 'Hoàn thành',
  paused: 'Tạm dừng',
  cancelled: 'Đã huỷ',
};

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-blue-100 text-blue-700',
  completed: 'bg-emerald-100 text-emerald-700',
  paused: 'bg-amber-100 text-amber-700',
  cancelled: 'bg-slate-100 text-slate-500',
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${STATUS_COLORS[status] ?? 'bg-slate-100 text-slate-500'}`}>
      {status === 'completed' && <CheckCircle2 className="size-3" />}
      {status === 'paused' && <Pause className="size-3" />}
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

function ProgressBar({ pct }: { pct: number }) {
  const clampedPct = Math.min(100, Math.max(0, pct));
  const color = clampedPct >= 100 ? 'bg-emerald-500' : clampedPct >= 70 ? 'bg-blue-500' : clampedPct >= 40 ? 'bg-amber-500' : 'bg-slate-400';
  return (
    <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
      <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${clampedPct}%` }} />
    </div>
  );
}

// ── Create Goal Form ─────────────────────────

function CreateGoalForm({ onClose }: { onClose: () => void }) {
  const { data: jarsRes } = useJars();
  const createMutation = useCreateGoal();

  const [form, setForm] = useState<CreateGoalPayload>({
    name: '',
    target_amount: 0,
    jar_id: null,
    deadline: null,
    priority: 0,
    funding_mode: 'fund_over_time',
    notes: null,
  });
  const [amountStr, setAmountStr] = useState('');

  const jars = jarsRes?.data ?? [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || form.target_amount <= 0) return;
    createMutation.mutate(form, {
      onSuccess: () => onClose(),
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">Tạo Quỹ mới</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="size-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          {/* Name */}
          <div>
            <label className="text-sm font-medium text-slate-700">Tên quỹ *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="VD: Kính cận, Du lịch, Laptop..."
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Target Amount */}
          <div>
            <label className="text-sm font-medium text-slate-700">Số tiền mục tiêu *</label>
            <input
              type="text"
              inputMode="numeric"
              required
              value={amountStr}
              onChange={(e) => {
                const raw = e.target.value.replace(/\D/g, '');
                setAmountStr(raw ? Number(raw).toLocaleString('vi-VN') : '');
                setForm({ ...form, target_amount: Number(raw) || 0 });
              }}
              placeholder="1,000,000"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Jar selector */}
          <div>
            <label className="text-sm font-medium text-slate-700">Hũ nguồn</label>
            <select
              value={form.jar_id ?? ''}
              onChange={(e) => setForm({ ...form, jar_id: e.target.value ? Number(e.target.value) : null })}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Không gắn hũ</option>
              {jars.map((j) => (
                <option key={j.id} value={j.id}>{j.label} ({j.key})</option>
              ))}
            </select>
            <p className="text-xs text-slate-400 mt-1">Quỹ sẽ nằm bên trong hũ này, tiền góp lấy từ ngân sách hũ</p>
          </div>

          {/* Deadline */}
          <div>
            <label className="text-sm font-medium text-slate-700">Hạn chót</label>
            <input
              type="date"
              value={form.deadline ?? ''}
              onChange={(e) => setForm({ ...form, deadline: e.target.value || null })}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Priority */}
          <div>
            <label className="text-sm font-medium text-slate-700">Độ ưu tiên</label>
            <select
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={0}>Bình thường</option>
              <option value={1}>Quan trọng</option>
              <option value={2}>Rất quan trọng</option>
            </select>
          </div>

          {/* Funding mode */}
          <div>
            <label className="text-sm font-medium text-slate-700">Phương thức góp</label>
            <select
              value={form.funding_mode}
              onChange={(e) => setForm({ ...form, funding_mode: e.target.value as 'fund_now' | 'fund_over_time' })}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="fund_over_time">Góp dần hàng tháng</option>
              <option value="fund_now">Góp ngay một lần</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="text-sm font-medium text-slate-700">Ghi chú</label>
            <textarea
              value={form.notes ?? ''}
              onChange={(e) => setForm({ ...form, notes: e.target.value || null })}
              rows={2}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100">
              Huỷ
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || !form.name || form.target_amount <= 0}
              className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {createMutation.isPending && <Loader2 className="size-4 animate-spin" />}
              Tạo quỹ
            </button>
          </div>

          {createMutation.isError && (
            <p className="text-sm text-red-500 mt-1">{createMutation.error.message}</p>
          )}
        </form>
      </div>
    </div>
  );
}

// ── Edit Goal Form (modal) ─────────────────────────

function EditGoalForm({ goal, onClose }: { goal: Goal; onClose: () => void }) {
  const { data: jarsRes } = useJars();
  const updateMutation = useUpdateGoal();
  const deleteMutation = useDeleteGoal();

  const [form, setForm] = useState<Partial<CreateGoalPayload> & { status?: string }>({
    name: goal.name,
    target_amount: goal.target_amount,
    deadline: goal.deadline,
    priority: goal.priority,
    funding_mode: goal.funding_mode,
    notes: goal.notes,
    status: goal.status,
  });
  const [amountStr, setAmountStr] = useState(goal.target_amount.toLocaleString('vi-VN'));
  const [confirmDelete, setConfirmDelete] = useState(false);

  const jars = jarsRes?.data ?? [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.target_amount || form.target_amount <= 0) return;
    updateMutation.mutate(
      { id: goal.id, payload: form },
      { onSuccess: () => onClose() },
    );
  };

  const handleDelete = () => {
    deleteMutation.mutate(goal.id, {
      onSuccess: () => onClose(),
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">Sửa quỹ "{goal.name}"</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="size-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          {/* Name */}
          <div>
            <label className="text-sm font-medium text-slate-700">Tên quỹ *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Target Amount */}
          <div>
            <label className="text-sm font-medium text-slate-700">Số tiền mục tiêu *</label>
            <input
              type="text"
              inputMode="numeric"
              required
              value={amountStr}
              onChange={(e) => {
                const raw = e.target.value.replace(/\D/g, '');
                setAmountStr(raw ? Number(raw).toLocaleString('vi-VN') : '');
                setForm({ ...form, target_amount: Number(raw) || 0 });
              }}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status */}
          <div>
            <label className="text-sm font-medium text-slate-700">Trạng thái</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="active">Đang thực hiện</option>
              <option value="completed">Hoàn thành</option>
              <option value="paused">Tạm dừng</option>
              <option value="cancelled">Đã huỷ</option>
            </select>
          </div>

          {/* Deadline */}
          <div>
            <label className="text-sm font-medium text-slate-700">Hạn chót</label>
            <input
              type="date"
              value={form.deadline ?? ''}
              onChange={(e) => setForm({ ...form, deadline: e.target.value || null })}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Priority */}
          <div>
            <label className="text-sm font-medium text-slate-700">Độ ưu tiên</label>
            <select
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={0}>Bình thường</option>
              <option value={1}>Quan trọng</option>
              <option value={2}>Rất quan trọng</option>
            </select>
          </div>

          {/* Funding mode */}
          <div>
            <label className="text-sm font-medium text-slate-700">Phương thức góp</label>
            <select
              value={form.funding_mode}
              onChange={(e) => setForm({ ...form, funding_mode: e.target.value as 'fund_now' | 'fund_over_time' })}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="fund_over_time">Góp dần hàng tháng</option>
              <option value="fund_now">Góp ngay một lần</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="text-sm font-medium text-slate-700">Ghi chú</label>
            <textarea
              value={form.notes ?? ''}
              onChange={(e) => setForm({ ...form, notes: e.target.value || null })}
              rows={2}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            {/* Delete */}
            <div>
              {!confirmDelete ? (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="size-4" />
                  Xoá quỹ
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-red-600 font-medium">Chắc chắn?</span>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleteMutation.isPending}
                    className="px-3 py-1.5 rounded-lg text-sm font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 flex items-center gap-1"
                  >
                    {deleteMutation.isPending && <Loader2 className="size-3 animate-spin" />}
                    Xoá
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100"
                  >
                    Huỷ
                  </button>
                </div>
              )}
            </div>

            {/* Save / Cancel */}
            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100">
                Huỷ
              </button>
              <button
                type="submit"
                disabled={updateMutation.isPending || !form.name || !form.target_amount || form.target_amount <= 0}
                className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {updateMutation.isPending && <Loader2 className="size-4 animate-spin" />}
                Lưu
              </button>
            </div>
          </div>

          {updateMutation.isError && (
            <p className="text-sm text-red-500 mt-1">{updateMutation.error.message}</p>
          )}
          {deleteMutation.isError && (
            <p className="text-sm text-red-500 mt-1">{deleteMutation.error.message}</p>
          )}
        </form>
      </div>
    </div>
  );
}

// ── Contribute Form (inline) ─────────────────────────

function ContributeForm({ goal, onClose }: { goal: Goal; onClose: () => void }) {
  const { data: jarsRes } = useJars();
  const contributeMutation = useContributeGoal();

  const [payload, setPayload] = useState<ContributePayload>({
    amount: 0,
    source_jar_id: null,
    notes: null,
  });
  const [amountStr, setAmountStr] = useState('');

  const jars = jarsRes?.data ?? [];

  // Pre-select jar from goal's jar
  const defaultJarId = jars.find((j) => j.key === goal.jar?.key)?.id ?? null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (payload.amount <= 0) return;
    contributeMutation.mutate(
      { goalId: goal.id, payload: { ...payload, source_jar_id: payload.source_jar_id ?? defaultJarId } },
      {
        onSuccess: (res) => {
          const msg = `Đã góp ${formatCurrency(payload.amount)} vào quỹ "${goal.name}". Tiến độ: ${res.goal.progress_pct}%`;
          alert(msg);
          onClose();
        },
      },
    );
  };

  return (
    <form onSubmit={handleSubmit} className="mt-3 p-4 bg-blue-50 rounded-xl border border-blue-200 flex flex-col gap-3">
      <h4 className="text-sm font-bold text-blue-800">Góp tiền vào "{goal.name}"</h4>

      <div className="flex gap-3">
        <div className="flex-1">
          <label className="text-xs font-medium text-slate-600">Số tiền</label>
          <input
            type="text"
            inputMode="numeric"
            required
            value={amountStr}
            onChange={(e) => {
              const raw = e.target.value.replace(/\D/g, '');
              setAmountStr(raw ? Number(raw).toLocaleString('vi-VN') : '');
              setPayload({ ...payload, amount: Number(raw) || 0 });
            }}
            placeholder="200,000"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex-1">
          <label className="text-xs font-medium text-slate-600">Hũ nguồn</label>
          <select
            value={payload.source_jar_id ?? defaultJarId ?? ''}
            onChange={(e) => setPayload({ ...payload, source_jar_id: e.target.value ? Number(e.target.value) : null })}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Không chọn</option>
            {jars.map((j) => (
              <option key={j.id} value={j.id}>{j.label} ({j.key})</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-slate-600">Ghi chú</label>
        <input
          type="text"
          value={payload.notes ?? ''}
          onChange={(e) => setPayload({ ...payload, notes: e.target.value || null })}
          placeholder="VD: Góp tháng 3"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onClose} className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100">
          Huỷ
        </button>
        <button
          type="submit"
          disabled={contributeMutation.isPending || payload.amount <= 0}
          className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
        >
          {contributeMutation.isPending && <Loader2 className="size-3 animate-spin" />}
          Góp tiền
        </button>
      </div>

      {contributeMutation.isError && (
        <p className="text-xs text-red-500">{contributeMutation.error.message}</p>
      )}
    </form>
  );
}

// ── Goal Detail Drawer ────────────────────────────

function GoalDetailPanel({ goalId, onClose }: { goalId: number; onClose: () => void }) {
  const { data: goalRes, isPending } = useGoal(goalId);
  const goal = goalRes?.data;

  if (isPending || !goal) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-6 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-900">{goal.name}</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="size-5" /></button>
      </div>

      {goal.jar && (
        <p className="text-sm text-slate-500">
          Thuộc hũ: <span className="font-semibold text-slate-700">{goal.jar.label}</span>
        </p>
      )}

      <div className="flex flex-col gap-2">
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Tiến độ</span>
          <span className="font-bold text-slate-900">{goal.progress_pct}%</span>
        </div>
        <ProgressBar pct={goal.progress_pct} />
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Đã góp: {formatCurrency(goal.current_amount)}</span>
          <span className="text-slate-500">Mục tiêu: {formatCurrency(goal.target_amount)}</span>
        </div>
        {goal.shortfall > 0 && (
          <p className="text-sm text-amber-600 font-medium">Còn thiếu: {formatCurrency(goal.shortfall)}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="bg-slate-50 rounded-lg p-3">
          <div className="text-slate-400 text-xs">Hạn chót</div>
          <div className="font-semibold text-slate-900">{goal.deadline ?? 'Không có'}</div>
        </div>
        <div className="bg-slate-50 rounded-lg p-3">
          <div className="text-slate-400 text-xs">Phương thức</div>
          <div className="font-semibold text-slate-900">{goal.funding_mode === 'fund_over_time' ? 'Góp dần' : 'Góp ngay'}</div>
        </div>
      </div>

      {goal.notes && (
        <div className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3">
          <span className="text-xs text-slate-400">Ghi chú:</span> {goal.notes}
        </div>
      )}

      {/* Contributions history */}
      <div>
        <h4 className="text-sm font-bold text-slate-900 mb-2">Lịch sử góp tiền</h4>
        {(!goal.contributions || goal.contributions.length === 0) ? (
          <p className="text-sm text-slate-400 text-center py-4">Chưa có lượt góp nào</p>
        ) : (
          <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
            {goal.contributions.map((c) => (
              <div key={c.id} className="flex items-center justify-between py-2">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-slate-800">{c.notes ?? 'Góp tiền'}</span>
                  <span className="text-xs text-slate-400">
                    {new Date(c.contributed_at).toLocaleDateString('vi-VN')}
                    {c.source_jar && ` • Hũ ${c.source_jar}`}
                    {c.period && ` • Kỳ ${c.period}`}
                  </span>
                </div>
                <span className="text-sm font-bold text-emerald-600">+{formatCurrency(c.amount)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Goals Page ─────────────────────────────────

export default function Goals({ month: _month }: { month: string }) {
  const [showCreate, setShowCreate] = useState(false);
  const [editGoal, setEditGoal] = useState<Goal | null>(null);
  const [selectedGoalId, setSelectedGoalId] = useState<number | null>(null);
  const [contributeGoalId, setContributeGoalId] = useState<number | null>(null);
  const [expandedGoalId, setExpandedGoalId] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('active');
  const [activeTab, setActiveTab] = useState<'goals' | 'funds'>('goals');

  const { data: goalsRes, isPending, error } = useGoals(filterStatus || undefined);
  const { data: fundsRes, isPending: fundsLoading } = useFunds();
  const goals = goalsRes?.data ?? [];
  const funds = fundsRes?.data ?? [];

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
        <div className="text-center">
          <p className="text-red-500 font-medium">{error.message}</p>
          <p className="text-sm text-slate-400 mt-1">Không thể tải danh sách quỹ</p>
        </div>
      </div>
    );
  }

  // Summary stats
  const totalTarget = goals.reduce((s, g) => s + g.target_amount, 0);
  const totalCurrent = goals.reduce((s, g) => s + g.current_amount, 0);
  const totalShortfall = goals.reduce((s, g) => s + g.shortfall, 0);
  const overallPct = totalTarget > 0 ? Math.round((totalCurrent / totalTarget) * 100) : 0;

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Quỹ & Mục tiêu</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {activeTab === 'goals'
              ? `${goals.length} quỹ mục tiêu • Tổng tiến độ ${overallPct}%`
              : `${funds.length} quỹ con (sub-funds)`
            }
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Tab switch */}
          <div className="flex bg-slate-100 dark:bg-[#0c1222] p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('goals')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'goals' ? 'bg-white dark:bg-[#1a2433] text-slate-900 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-400'}`}
            >
              <Target className="size-4 inline mr-1" />
              Mục tiêu
            </button>
            <button
              onClick={() => setActiveTab('funds')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'funds' ? 'bg-white dark:bg-[#1a2433] text-slate-900 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-400'}`}
            >
              <PiggyBank className="size-4 inline mr-1" />
              Quỹ con
            </button>
          </div>
          {activeTab === 'goals' && (
            <>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-[#1a2433] text-slate-700 dark:text-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tất cả</option>
                <option value="active">Đang thực hiện</option>
                <option value="completed">Hoàn thành</option>
                <option value="paused">Tạm dừng</option>
              </select>
              <button
                onClick={() => setShowCreate(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-colors"
              >
                <Plus className="size-4" />
                Tạo quỹ
              </button>
            </>
          )}
        </div>
      </div>

      {/* Summary cards */}
      {activeTab === 'goals' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard title="Tổng mục tiêu" amount={totalTarget} icon={Target} color="text-blue-600" bg="bg-blue-50" />
        <SummaryCard title="Đã góp" amount={totalCurrent} icon={ArrowUpCircle} color="text-emerald-600" bg="bg-emerald-50" />
        <SummaryCard title="Còn thiếu" amount={totalShortfall} icon={DollarSign} color="text-amber-600" bg="bg-amber-50" />
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 p-6 shadow-md text-white">
          <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-white/10"></div>
          <div className="relative z-10 flex flex-col gap-1">
            <span className="text-sm font-medium text-white/80">Tiến độ chung</span>
            <h3 className="text-2xl font-bold tracking-tight">{overallPct}%</h3>
            <ProgressBar pct={overallPct} />
          </div>
        </div>
      </div>
      )}

      {/* Empty state */}
      {activeTab === 'goals' && goals.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16">
          <Target className="size-16 text-slate-300 mb-3" />
          <p className="text-slate-500 font-medium">Chưa có quỹ nào</p>
          <p className="text-sm text-slate-400">Tạo quỹ đầu tiên của bạn để bắt đầu tiết kiệm!</p>
          <button
            onClick={() => setShowCreate(true)}
            className="mt-4 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-bold hover:bg-blue-700"
          >
            <Plus className="size-4 inline mr-1" />
            Tạo quỹ đầu tiên
          </button>
        </div>
      )}

      {/* Goals list */}
      {activeTab === 'goals' && (
      <div className="flex flex-col gap-4">
        {goals.map((goal) => (
          <div key={goal.id} className="rounded-xl bg-white dark:bg-[#1a2433] border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
            {/* Goal card header */}
            <div
              className="p-5 cursor-pointer"
              onClick={() => setExpandedGoalId(expandedGoalId === goal.id ? null : goal.id)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base font-bold text-slate-900 truncate">{goal.name}</h3>
                    <StatusBadge status={goal.status} />
                  </div>
                  {goal.jar && (
                    <p className="text-xs text-slate-400 mb-2">Thuộc hũ {goal.jar.label} ({goal.jar.key})</p>
                  )}
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-slate-500">{formatCurrency(goal.current_amount)}</span>
                    <span className="text-slate-300">/</span>
                    <span className="font-semibold text-slate-700">{formatCurrency(goal.target_amount)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span className="text-lg font-bold text-slate-900">{goal.progress_pct}%</span>
                    {goal.deadline && (
                      <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                        <Calendar className="size-3" />
                        {new Date(goal.deadline).toLocaleDateString('vi-VN')}
                      </div>
                    )}
                  </div>
                  {expandedGoalId === goal.id ? <ChevronUp className="size-4 text-slate-400" /> : <ChevronDown className="size-4 text-slate-400" />}
                </div>
              </div>

              <div className="mt-3">
                <ProgressBar pct={goal.progress_pct} />
              </div>
            </div>

            {/* Expanded section */}
            {expandedGoalId === goal.id && (
              <div className="px-5 pb-5 border-t border-slate-100 pt-4">
                {/* Quick actions */}
                <div className="flex gap-2 mb-4">
                  {goal.status === 'active' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setContributeGoalId(contributeGoalId === goal.id ? null : goal.id); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
                    >
                      <DollarSign className="size-3.5" />
                      Góp tiền
                    </button>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditGoal(goal); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-amber-600 bg-amber-50 hover:bg-amber-100 transition-colors"
                  >
                    <Pencil className="size-3.5" />
                    Sửa
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setSelectedGoalId(goal.id); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    Chi tiết
                  </button>
                </div>

                {/* Contribute form inline */}
                {contributeGoalId === goal.id && (
                  <ContributeForm goal={goal} onClose={() => setContributeGoalId(null)} />
                )}

                {/* Info grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  <div className="bg-slate-50 rounded-lg p-3">
                    <div className="text-xs text-slate-400">Còn thiếu</div>
                    <div className="font-semibold text-amber-600">{formatCurrency(goal.shortfall)}</div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <div className="text-xs text-slate-400">Phương thức</div>
                    <div className="font-semibold text-slate-700">{goal.funding_mode === 'fund_over_time' ? 'Góp dần' : 'Góp ngay'}</div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <div className="text-xs text-slate-400">Lượt góp</div>
                    <div className="font-semibold text-slate-700">{goal.contributions_count ?? 0}</div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <div className="text-xs text-slate-400">Ưu tiên</div>
                    <div className="font-semibold text-slate-700">{goal.priority === 0 ? 'Bình thường' : goal.priority === 1 ? 'Quan trọng' : 'Rất quan trọng'}</div>
                  </div>
                </div>

                {goal.notes && (
                  <p className="text-sm text-slate-500 mt-3 italic">"{goal.notes}"</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      )}

      {/* Funds Tab */}
      {activeTab === 'funds' && (
        <div className="flex flex-col gap-4">
          {fundsLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="size-8 text-blue-600 animate-spin" />
            </div>
          ) : funds.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <PiggyBank className="size-16 text-slate-300 mb-3" />
              <p className="text-slate-500 dark:text-slate-400 font-medium">Chưa có quỹ con nào</p>
              <p className="text-sm text-slate-400 dark:text-slate-500">Quỹ con được tạo từ trang Quản lý Hũ hoặc API</p>
            </div>
          ) : (
            <>
              {/* Grouped by jar */}
              {(() => {
                const grouped = new Map<string, Fund[]>();
                for (const f of funds) {
                  const jk = f.jar?.label ?? 'Không thuộc hũ';
                  if (!grouped.has(jk)) grouped.set(jk, []);
                  grouped.get(jk)!.push(f);
                }
                return Array.from(grouped.entries()).map(([jarLabel, jarFunds]) => (
                  <div key={jarLabel} className="flex flex-col gap-2">
                    <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{jarLabel}</h3>
                    {jarFunds.map((fund) => (
                      <div key={fund.id} className="rounded-xl bg-white dark:bg-[#1a2433] border border-slate-100 dark:border-slate-700 shadow-sm p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-bold text-slate-900 dark:text-white">{fund.name}</h4>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                                fund.status === 'active' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400'
                                : fund.status === 'completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                                : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
                              }`}>
                                {fund.status === 'active' ? 'Hoạt động' : fund.status === 'completed' ? 'Hoàn thành' : 'Tạm dừng'}
                              </span>
                            </div>
                            {fund.goal && (
                              <p className="text-xs text-slate-400 dark:text-slate-500 mb-2">Gắn mục tiêu: {fund.goal.name}</p>
                            )}
                            <ProgressBar pct={fund.progress_pct} />
                            <div className="flex items-center justify-between mt-2 text-xs text-slate-500 dark:text-slate-400">
                              <span>Đã giữ: {formatCurrency(fund.reserved_amount)}</span>
                              <span>Mục tiêu: {formatCurrency(fund.target_amount)}</span>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-lg font-bold text-slate-900 dark:text-white">{fund.progress_pct}%</span>
                            {fund.monthly_reserve > 0 && (
                              <p className="text-xs text-slate-400 dark:text-slate-500">+{formatCurrency(fund.monthly_reserve)}/tháng</p>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-3 mt-3 text-xs">
                          <div className="bg-slate-50 dark:bg-[#0c1222] rounded-lg p-2">
                            <div className="text-slate-400 dark:text-slate-500">Đã giữ</div>
                            <div className="font-semibold text-blue-600 dark:text-blue-400">{formatCurrency(fund.reserved_amount)}</div>
                          </div>
                          <div className="bg-slate-50 dark:bg-[#0c1222] rounded-lg p-2">
                            <div className="text-slate-400 dark:text-slate-500">Đã chi</div>
                            <div className="font-semibold text-red-600 dark:text-red-400">{formatCurrency(fund.spent_amount)}</div>
                          </div>
                          <div className="bg-slate-50 dark:bg-[#0c1222] rounded-lg p-2">
                            <div className="text-slate-400 dark:text-slate-500">Còn lại</div>
                            <div className={`font-semibold ${fund.available >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>{formatCurrency(fund.available)}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ));
              })()}
            </>
          )}
        </div>
      )}

      {/* Create form modal */}
      {showCreate && <CreateGoalForm onClose={() => setShowCreate(false)} />}

      {/* Edit form modal */}
      {editGoal !== null && <EditGoalForm goal={editGoal} onClose={() => setEditGoal(null)} />}

      {/* Detail drawer */}
      {selectedGoalId !== null && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-50 flex justify-end">
          <div className="bg-white w-full max-w-md h-full overflow-y-auto shadow-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <GoalDetailPanel goalId={selectedGoalId} onClose={() => setSelectedGoalId(null)} />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Reusable summary card ─────────────

function SummaryCard({ title, amount, icon: Icon, color, bg }: { title: string; amount: number; icon: React.ElementType; color: string; bg: string }) {
  return (
    <div className="relative overflow-hidden rounded-xl bg-white p-6 shadow-sm border border-slate-100">
      <div className={`absolute right-0 top-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full ${bg}`}></div>
      <div className="relative z-10 flex flex-col gap-1">
        <span className="text-sm font-medium text-slate-500">{title}</span>
        <h3 className="text-2xl font-bold tracking-tight text-slate-900">{formatCurrency(amount)}</h3>
        <div className={`mt-2 flex items-center gap-1 text-sm font-medium ${color}`}>
          <Icon className="size-4" />
        </div>
      </div>
    </div>
  );
}
