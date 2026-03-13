import { useState, useEffect, useCallback } from 'react';
import {
  Loader2,
  AlertCircle,
  Wallet,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Pencil,
  Check,
  X,
  Lock,
  Plus,
  Trash2,
} from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { cn } from '../lib/utils';
import {
  useBudgetPlan,
  useTransactions,
  useJars,
  useUpdateJar,
  useBudgetStatus,
  useCreateBudgetPeriod,
  useCloseBudgetPeriod,
  useBudgetSetting,
  useUpdateBudgetSetting,
  useInvestmentSummary,
  useGoals,
  useDebts,
  useFunds,
  useRecurringBills,
  useBudgetPeriods,
  useBudgetPeriod,
  useBudgetLines,
  useCreateBudgetLine,
  useUpdateBudgetLine,
  useDeleteBudgetLine,
} from '../lib/hooks';
import type {
  BudgetJar,
  BudgetLine,
  BudgetStatusJarMetric,
  BudgetWorkspaceJar,
  CreateBudgetLinePayload,
  Debt,
  Fund,
  Goal,
  Jar,
  RecurringBill,
  Transaction,
} from '../lib/types';

// ── Jar styling ──────────────────────────────────────────────

const JAR_STYLES: Record<string, { color: string; bg: string; iconBg: string; progressBg: string; darkIconBg: string }> = {
  NEC:  { color: 'text-blue-600',   bg: 'bg-blue-50',   iconBg: 'bg-blue-100 text-blue-600',   progressBg: 'bg-blue-500',   darkIconBg: 'dark:bg-blue-500/20 dark:text-blue-400' },
  EDU:  { color: 'text-purple-600', bg: 'bg-purple-50', iconBg: 'bg-purple-100 text-purple-600', progressBg: 'bg-purple-500', darkIconBg: 'dark:bg-purple-500/20 dark:text-purple-400' },
  LTSS: { color: 'text-teal-600',   bg: 'bg-teal-50',   iconBg: 'bg-teal-100 text-teal-600',   progressBg: 'bg-teal-500',   darkIconBg: 'dark:bg-teal-500/20 dark:text-teal-400' },
  PLAY: { color: 'text-pink-600',   bg: 'bg-pink-50',   iconBg: 'bg-pink-100 text-pink-600',   progressBg: 'bg-pink-500',   darkIconBg: 'dark:bg-pink-500/20 dark:text-pink-400' },
  FFA:  { color: 'text-green-600',  bg: 'bg-green-50',  iconBg: 'bg-green-100 text-green-600',  progressBg: 'bg-green-500',  darkIconBg: 'dark:bg-green-500/20 dark:text-green-400' },
  GIVE: { color: 'text-amber-600',  bg: 'bg-amber-50',  iconBg: 'bg-amber-100 text-amber-600',  progressBg: 'bg-amber-500',  darkIconBg: 'dark:bg-amber-500/20 dark:text-amber-400' },
};

function getJarStyle(key: string) {
  return JAR_STYLES[key] ?? {
    color: 'text-slate-600', bg: 'bg-slate-50', iconBg: 'bg-slate-100 text-slate-600',
    progressBg: 'bg-slate-500', darkIconBg: 'dark:bg-slate-500/20 dark:text-slate-400',
  };
}

type PlannerType = BudgetLine['type'];

type BudgetLineDraft = {
  name: string;
  type: PlannerType;
  jarAllocationId: string;
  plannedAmount: string;
  goalId: string;
  debtId: string;
  recurringBillId: string;
  fundId: string;
};

const PLANNER_TYPE_OPTIONS: Array<{ value: PlannerType; label: string }> = [
  { value: 'general', label: 'Chi thường' },
  { value: 'goal', label: 'Quỹ & mục tiêu' },
  { value: 'debt', label: 'Nợ' },
  { value: 'bill', label: 'Hóa đơn' },
  { value: 'sinking_fund', label: 'Quỹ con' },
  { value: 'investment', label: 'Đầu tư' },
];

const PLANNER_FIELD_CLASS = 'w-full rounded-lg border border-violet-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-200 dark:border-violet-500/30 dark:bg-[#0f1728] dark:text-slate-100 dark:focus:border-violet-400 dark:focus:ring-violet-500/20';

function toPlannerType(value: PlannerType | string): PlannerType {
  if (
    value === 'goal' ||
    value === 'debt' ||
    value === 'bill' ||
    value === 'sinking_fund' ||
    value === 'investment'
  ) {
    return value;
  }

  return 'general';
}

function getPlannerTypeLabel(type: PlannerType): string {
  return PLANNER_TYPE_OPTIONS.find((option) => option.value === type)?.label ?? 'Chi thường';
}

function parseBudgetMonth(month: string): { year: number; monthNum: number } | null {
  const [abbr, yearText] = month.split('-');
  const year = Number(yearText);
  const monthNum = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(abbr) + 1;

  if (!Number.isInteger(year) || year <= 0 || monthNum <= 0) {
    return null;
  }

  return { year, monthNum };
}

function createBudgetLineDraft(defaultJarAllocationId?: number, line?: BudgetLine): BudgetLineDraft {
  return {
    name: line?.name ?? '',
    type: toPlannerType(line?.type ?? 'general'),
    jarAllocationId: String(line?.jar_allocation_id ?? defaultJarAllocationId ?? ''),
    plannedAmount: line ? String(line.planned_amount) : '',
    goalId: line?.goal_id ? String(line.goal_id) : '',
    debtId: line?.debt_id ? String(line.debt_id) : '',
    recurringBillId: line?.recurring_bill_id ? String(line.recurring_bill_id) : '',
    fundId: line?.fund_id ? String(line.fund_id) : '',
  };
}

function buildBudgetLinePayload(draft: BudgetLineDraft): { payload?: CreateBudgetLinePayload; error?: string } {
  const name = draft.name.trim();
  const jarAllocationId = Number(draft.jarAllocationId);
  const plannedAmount = Math.round(Number(draft.plannedAmount));

  if (!name) {
    return { error: 'Nhập tên khoản dự kiến.' };
  }

  if (!Number.isInteger(jarAllocationId) || jarAllocationId <= 0) {
    return { error: 'Chọn hũ cần gài khoản dự kiến.' };
  }

  if (!Number.isFinite(plannedAmount) || plannedAmount <= 0) {
    return { error: 'Số tiền dự kiến phải lớn hơn 0.' };
  }

  const payload: CreateBudgetLinePayload = {
    jar_allocation_id: jarAllocationId,
    name,
    type: draft.type,
    planned_amount: plannedAmount,
    goal_id: null,
    debt_id: null,
    recurring_bill_id: null,
    fund_id: null,
  };

  if (draft.type === 'goal') {
    const goalId = Number(draft.goalId);
    if (!Number.isInteger(goalId) || goalId <= 0) {
      return { error: 'Chọn mục tiêu cần liên kết.' };
    }
    payload.goal_id = goalId;
  }

  if (draft.type === 'debt') {
    const debtId = Number(draft.debtId);
    if (!Number.isInteger(debtId) || debtId <= 0) {
      return { error: 'Chọn khoản nợ cần liên kết.' };
    }
    payload.debt_id = debtId;
  }

  if (draft.type === 'bill') {
    const recurringBillId = Number(draft.recurringBillId);
    if (Number.isInteger(recurringBillId) && recurringBillId > 0) {
      payload.recurring_bill_id = recurringBillId;
    }
  }

  if (draft.type === 'sinking_fund' || draft.type === 'investment') {
    const fundId = Number(draft.fundId);
    if (!Number.isInteger(fundId) || fundId <= 0) {
      return { error: 'Chọn quỹ cần liên kết.' };
    }
    payload.fund_id = fundId;
  }

  return { payload };
}

function getBudgetLineLinkLabel(
  line: BudgetLine,
  goalsById: Map<number, Goal>,
  debtsById: Map<number, Debt>,
  recurringBillsById: Map<number, RecurringBill>,
  fundsById: Map<number, Fund>,
): string | null {
  if (line.type === 'goal' && line.goal_id) {
    return goalsById.get(line.goal_id)?.name ?? `Mục tiêu #${line.goal_id}`;
  }

  if (line.type === 'debt' && line.debt_id) {
    return debtsById.get(line.debt_id)?.name ?? `Khoản nợ #${line.debt_id}`;
  }

  if (line.type === 'bill' && line.recurring_bill_id) {
    return recurringBillsById.get(line.recurring_bill_id)?.name ?? `Hóa đơn #${line.recurring_bill_id}`;
  }

  if ((line.type === 'sinking_fund' || line.type === 'investment') && line.fund_id) {
    return fundsById.get(line.fund_id)?.name ?? `Quỹ #${line.fund_id}`;
  }

  return null;
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'OK':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
          <CheckCircle2 className="size-3.5" /> Tốt
        </span>
      );
    case 'WARN':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">
          <AlertTriangle className="size-3.5" /> Cảnh báo
        </span>
      );
    case 'OVER':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400">
          <XCircle className="size-3.5" /> Vượt mức
        </span>
      );
    default:
      return null;
  }
}

// ── Editable percent inline ────────────────────────────────────

function EditablePercent({
  jar,
  dbJar,
  onSave,
  isSaving,
}: {
  jar: BudgetJar;
  dbJar: Jar | undefined;
  onSave: (jarId: number, percent: number) => void;
  isSaving: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(jar.percent));

  const handleSave = () => {
    const num = parseFloat(value);
    if (!isNaN(num) && num >= 0 && num <= 100 && dbJar) {
      onSave(dbJar.id, num);
      setEditing(false);
    }
  };

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors cursor-pointer"
        title="Sửa phần trăm"
      >
        {jar.key} · {jar.percent}%
        <Pencil className="size-3" />
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <input
        type="number"
        min={0}
        max={100}
        step={0.5}
        value={value}
        onChange={e => setValue(e.target.value)}
        className="w-14 text-xs px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-[#0c1222] text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
        autoFocus
        onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditing(false); }}
      />
      <span className="text-xs text-slate-500">%</span>
      <button onClick={handleSave} disabled={isSaving} className="text-green-600 hover:text-green-700 cursor-pointer">
        <Check className="size-3.5" />
      </button>
      <button onClick={() => setEditing(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
        <X className="size-3.5" />
      </button>
    </div>
  );
}

// ── Drill-down panel ──────────────────────────────────────────

function JarDrillDown({ jar, month }: { jar: BudgetJar; month: string }) {
  const { data, isPending } = useTransactions({
    month,
    flow: 'expense',
    jar: jar.key,
    pageSize: 100,
    sort: 'datetime_desc',
  });

  const txs = data?.data ?? [];

  if (isPending) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="size-5 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (txs.length === 0) {
    return <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-4">Không có giao dịch chi tiêu</p>;
  }

  return (
    <div className="divide-y divide-slate-100 dark:divide-slate-700 max-h-64 overflow-y-auto">
      {txs.map((tx: Transaction, idx: number) => (
        <div key={tx.idempotency_key ?? idx} className="flex items-center justify-between py-2.5 px-1">
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
              {tx.description ?? tx.category ?? '—'}
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500">{tx.date} {tx.time ? `· ${tx.time}` : ''}</span>
          </div>
          <span className="text-sm font-bold text-red-600 dark:text-red-400 shrink-0 ml-3">
            {formatCurrency(tx.amount_vnd)}
          </span>
        </div>
      ))}
    </div>
  );
}

type PlannedExpenseFormProps = {
  title: string;
  draft: BudgetLineDraft;
  submitLabel: string;
  error: string | null;
  isSubmitting: boolean;
  onChange: (patch: Partial<BudgetLineDraft>) => void;
  onSubmit: () => void;
  onCancel: () => void;
  jarOptions: BudgetWorkspaceJar[];
  goals: Goal[];
  debts: Debt[];
  funds: Fund[];
};

function PlannedExpenseForm({
  title,
  draft,
  submitLabel,
  error,
  isSubmitting,
  onChange,
  onSubmit,
  onCancel,
  jarOptions,
  goals,
  debts,
  funds,
}: PlannedExpenseFormProps) {
  const availableFunds = funds.filter((fund) => {
    if (draft.type === 'investment') {
      return fund.type === 'investment';
    }

    if (draft.type === 'sinking_fund') {
      return fund.type === 'sinking_fund';
    }

    return true;
  });

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      className="space-y-3 rounded-xl border border-violet-200 bg-white/85 p-4 shadow-sm dark:border-violet-500/20 dark:bg-[#151b2b]"
    >
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-sm font-bold text-violet-950 dark:text-violet-100">{title}</h4>
        <span className="rounded-full bg-violet-100 px-2.5 py-1 text-[11px] font-bold text-violet-700 dark:bg-violet-500/20 dark:text-violet-200">
          Planner
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-violet-700 dark:text-violet-300">Tên khoản</span>
          <input
            value={draft.name}
            onChange={(event) => onChange({ name: event.target.value })}
            placeholder="VD: Tiền nhà, trả thẻ, quỹ du lịch"
            className={PLANNER_FIELD_CLASS}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-violet-700 dark:text-violet-300">Cate / loại</span>
          <select
            value={draft.type}
            onChange={(event) => onChange({ type: event.target.value as PlannerType })}
            className={PLANNER_FIELD_CLASS}
          >
            {PLANNER_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-violet-700 dark:text-violet-300">Hũ nào</span>
          <select
            value={draft.jarAllocationId}
            onChange={(event) => onChange({ jarAllocationId: event.target.value })}
            className={PLANNER_FIELD_CLASS}
          >
            <option value="">Chọn hũ</option>
            {jarOptions.map((option) => (
              <option key={option.allocation_id} value={option.allocation_id}>
                {option.jar_label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-violet-700 dark:text-violet-300">Bao tiền</span>
          <input
            type="number"
            min={0}
            step={1000}
            value={draft.plannedAmount}
            onChange={(event) => onChange({ plannedAmount: event.target.value })}
            placeholder="0"
            className={PLANNER_FIELD_CLASS}
          />
        </label>
      </div>

      {draft.type === 'goal' && (
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-violet-700 dark:text-violet-300">Liên kết Quỹ & Mục tiêu</span>
          <select
            value={draft.goalId}
            onChange={(event) => onChange({ goalId: event.target.value })}
            className={PLANNER_FIELD_CLASS}
          >
            <option value="">{goals.length ? 'Chọn mục tiêu' : 'Chưa có mục tiêu'}</option>
            {goals.map((goal) => (
              <option key={goal.id} value={goal.id}>{goal.name}</option>
            ))}
          </select>
        </label>
      )}

      {draft.type === 'debt' && (
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-violet-700 dark:text-violet-300">Liên kết Quản lý Nợ</span>
          <select
            value={draft.debtId}
            onChange={(event) => onChange({ debtId: event.target.value })}
            className={PLANNER_FIELD_CLASS}
          >
            <option value="">{debts.length ? 'Chọn khoản nợ' : 'Chưa có khoản nợ'}</option>
            {debts.map((debt) => (
              <option key={debt.id} value={debt.id}>{debt.name}</option>
            ))}
          </select>
        </label>
      )}

      {(draft.type === 'sinking_fund' || draft.type === 'investment') && (
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-violet-700 dark:text-violet-300">Liên kết quỹ</span>
          <select
            value={draft.fundId}
            onChange={(event) => onChange({ fundId: event.target.value })}
            className={PLANNER_FIELD_CLASS}
          >
            <option value="">{availableFunds.length ? 'Chọn quỹ' : 'Chưa có quỹ phù hợp'}</option>
            {availableFunds.map((fund) => (
              <option key={fund.id} value={fund.id}>{fund.name}</option>
            ))}
          </select>
        </label>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          Hủy
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-bold text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

type PlannedExpenseSectionProps = {
  jar: BudgetJar;
  jarMetric: BudgetStatusJarMetric | undefined;
  lines: BudgetLine[];
  jarOptions: BudgetWorkspaceJar[];
  goals: Goal[];
  debts: Debt[];
  funds: Fund[];
  recurringBills: RecurringBill[];
  isLoading: boolean;
  isPreparing: boolean;
  canEdit: boolean;
  isMutating: boolean;
  onPrepareCreate: (jarKey: string) => Promise<number | null>;
  onCreateLine: (payload: CreateBudgetLinePayload) => Promise<unknown>;
  onUpdateLine: (id: number, payload: Partial<CreateBudgetLinePayload>) => Promise<unknown>;
  onDeleteLine: (id: number) => Promise<unknown>;
};

function PlannedExpenseSection({
  jar,
  jarMetric,
  lines,
  jarOptions,
  goals,
  debts,
  funds,
  recurringBills,
  isLoading,
  isPreparing,
  canEdit,
  isMutating,
  onPrepareCreate,
  onCreateLine,
  onUpdateLine,
  onDeleteLine,
}: PlannedExpenseSectionProps) {
  const defaultJarOption = jarOptions.find((option) => option.jar_key === jar.key);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createDraft, setCreateDraft] = useState<BudgetLineDraft>(() => createBudgetLineDraft(defaultJarOption?.allocation_id));
  const [createError, setCreateError] = useState<string | null>(null);
  const [editingLineId, setEditingLineId] = useState<number | null>(null);
  const [editingDraft, setEditingDraft] = useState<BudgetLineDraft | null>(null);
  const [editingError, setEditingError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!showCreateForm) {
      setCreateDraft(createBudgetLineDraft(defaultJarOption?.allocation_id));
    }
  }, [defaultJarOption?.allocation_id, showCreateForm]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const goalsById = new Map(goals.map((goal) => [goal.id, goal]));
  const debtsById = new Map(debts.map((debt) => [debt.id, debt]));
  const recurringBillsById = new Map(recurringBills.map((bill) => [bill.id, bill]));
  const fundsById = new Map(funds.map((fund) => [fund.id, fund]));
  const sortedLines = [...lines].sort((a, b) => b.planned_amount - a.planned_amount || a.name.localeCompare(b.name));
  const plannedTotal = jarMetric?.committed ?? sortedLines.reduce((sum, line) => sum + line.planned_amount, 0);
  const availableAmount = jarMetric?.available ?? jar.remaining;
  const modalTitleId = `planned-expenses-${jar.key}`;

  const handleCreateToggle = async () => {
    if (showCreateForm) {
      setShowCreateForm(false);
      setCreateError(null);
      setCreateDraft(createBudgetLineDraft(defaultJarOption?.allocation_id));
      return;
    }

    try {
      setEditingLineId(null);
      setEditingDraft(null);
      setEditingError(null);
      setCreateError(null);

      const allocationId = await onPrepareCreate(jar.key);
      const nextAllocationId = allocationId ?? defaultJarOption?.allocation_id;
      if (!nextAllocationId) {
        throw new Error('Không tìm thấy hũ này trong workspace ngân sách hiện tại.');
      }

      setCreateDraft(createBudgetLineDraft(nextAllocationId));
      setShowCreateForm(true);
    } catch (prepareError) {
      setCreateError(prepareError instanceof Error ? prepareError.message : 'Không thể mở planner cho tháng này.');
    }
  };

  const handleCreateSubmit = async () => {
    const { payload, error } = buildBudgetLinePayload(createDraft);
    if (!payload) {
      setCreateError(error ?? 'Không thể lưu khoản dự kiến.');
      return;
    }

    try {
      setCreateError(null);
      await onCreateLine(payload);
      setShowCreateForm(false);
      setCreateDraft(createBudgetLineDraft(defaultJarOption?.allocation_id));
    } catch (submitError) {
      setCreateError(submitError instanceof Error ? submitError.message : 'Không thể lưu khoản dự kiến.');
    }
  };

  const handleStartEdit = (line: BudgetLine) => {
    setShowCreateForm(false);
    setCreateError(null);
    setEditingLineId(line.id);
    setEditingDraft(createBudgetLineDraft(undefined, line));
    setEditingError(null);
  };

  const handleEditSubmit = async () => {
    if (!editingLineId || !editingDraft) {
      return;
    }

    const { payload, error } = buildBudgetLinePayload(editingDraft);
    if (!payload) {
      setEditingError(error ?? 'Không thể cập nhật khoản dự kiến.');
      return;
    }

    try {
      setEditingError(null);
      await onUpdateLine(editingLineId, payload);
      setEditingLineId(null);
      setEditingDraft(null);
    } catch (submitError) {
      setEditingError(submitError instanceof Error ? submitError.message : 'Không thể cập nhật khoản dự kiến.');
    }
  };

  const handleDelete = async (line: BudgetLine) => {
    if (!window.confirm(`Xóa khoản dự kiến "${line.name}" khỏi planner?`)) {
      return;
    }

    try {
      await onDeleteLine(line.id);
    } catch (submitError) {
      setEditingError(submitError instanceof Error ? submitError.message : 'Không thể xóa khoản dự kiến.');
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="mt-5 w-full rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-violet-500/20 dark:from-violet-500/10 dark:via-[#111827] dark:to-[#1c1530]"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-sm font-bold text-violet-950 dark:text-violet-100">Khoản chi dự kiến</h4>
              <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-bold text-violet-700 dark:bg-violet-500/20 dark:text-violet-200">
                {sortedLines.length} khoản
              </span>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div className="rounded-xl bg-white/80 px-3 py-2 shadow-sm dark:bg-[#151b2b]/80">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-violet-500 dark:text-violet-300">Đã gài trước</p>
                <p className="mt-1 text-sm font-bold text-violet-700 dark:text-violet-100">{formatCurrency(plannedTotal)}</p>
              </div>
              <div className="rounded-xl bg-white/80 px-3 py-2 shadow-sm dark:bg-[#151b2b]/80">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-violet-500 dark:text-violet-300">Khả dụng sau dự kiến</p>
                <p className={cn('mt-1 text-sm font-bold', availableAmount >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400')}>
                  {formatCurrency(availableAmount)}
                </p>
              </div>
            </div>
          </div>

          <div className="shrink-0 rounded-2xl bg-white/80 px-3 py-2 text-right shadow-sm dark:bg-[#151b2b]/80">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-violet-500 dark:text-violet-300">
              {canEdit ? 'Mở planner' : 'Xem planner'}
            </p>
            <p className="mt-1 text-sm font-bold text-violet-900 dark:text-violet-100">{jar.label}</p>
          </div>
        </div>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center sm:p-6">
          <button
            type="button"
            aria-label="Đóng planner"
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={modalTitleId}
            className="relative z-10 flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-[28px] border border-violet-200 bg-white shadow-2xl dark:border-violet-500/20 dark:bg-[#0f1728]"
          >
            <div className="border-b border-violet-100 bg-gradient-to-r from-violet-100 via-white to-fuchsia-50 px-5 py-4 dark:border-violet-500/20 dark:from-violet-500/20 dark:via-[#111827] dark:to-[#1b1530] sm:px-6">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-violet-600 px-2.5 py-1 text-[11px] font-bold text-white">
                      Planner
                    </span>
                    <span className="rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-bold text-violet-700 dark:bg-white/10 dark:text-violet-200">
                      {sortedLines.length} khoản
                    </span>
                  </div>
                  <h4 id={modalTitleId} className="mt-3 text-lg font-bold text-slate-900 dark:text-white">
                    Khoản chi dự kiến · {jar.label}
                  </h4>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    {formatCurrency(plannedTotal)} đã gài trước · Khả dụng sau dự kiến {formatCurrency(availableAmount)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-full border border-slate-200 bg-white/90 p-2 text-slate-500 transition hover:bg-white hover:text-slate-700 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:bg-slate-900"
                  aria-label="Đóng planner"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-violet-950 dark:text-violet-100">
                  Danh sách khoản dự kiến
                </div>

                {canEdit ? (
                  <button
                    onClick={() => {
                      void handleCreateToggle();
                    }}
                    disabled={isLoading || isPreparing}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-2 text-xs font-bold text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {(isLoading || isPreparing) ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
                    {showCreateForm ? 'Ẩn form' : 'Thêm khoản'}
                  </button>
                ) : (
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-violet-500 dark:text-violet-300">
                    Chế độ xem
                  </span>
                )}
              </div>

              {showCreateForm && (
                <div className="mt-4">
                  <PlannedExpenseForm
                    title="Thêm khoản dự kiến"
                    draft={createDraft}
                    submitLabel="Lưu khoản dự kiến"
                    error={createError}
                    isSubmitting={isMutating}
                    onChange={(patch) => setCreateDraft((current) => ({ ...current, ...patch }))}
                    onSubmit={handleCreateSubmit}
                    onCancel={() => {
                      setShowCreateForm(false);
                      setCreateError(null);
                      setCreateDraft(createBudgetLineDraft(defaultJarOption?.allocation_id));
                    }}
                    jarOptions={jarOptions}
                    goals={goals}
                    debts={debts}
                    funds={funds}
                  />
                </div>
              )}

              {!showCreateForm && createError && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
                  {createError}
                </div>
              )}

              <div className="mt-4 space-y-3">
                {isLoading ? (
                  <div className="flex items-center justify-center rounded-xl border border-dashed border-violet-200 px-4 py-5 text-violet-600 dark:border-violet-500/20 dark:text-violet-300">
                    <Loader2 className="size-4 animate-spin" />
                  </div>
                ) : !canEdit ? (
                  <div className="rounded-xl border border-dashed border-violet-200 bg-white/70 px-4 py-4 text-sm text-violet-700 dark:border-violet-500/20 dark:bg-violet-500/5 dark:text-violet-200">
                    Planner đang tạm khóa thao tác.
                  </div>
                ) : null}

                {sortedLines.map((line) => {
                  const linkLabel = getBudgetLineLinkLabel(line, goalsById, debtsById, recurringBillsById, fundsById);
                  const isEditing = editingLineId === line.id && editingDraft !== null;

                  if (isEditing) {
                    return (
                      <PlannedExpenseForm
                        key={line.id}
                        title="Sửa khoản dự kiến"
                        draft={editingDraft}
                        submitLabel="Cập nhật"
                        error={editingError}
                        isSubmitting={isMutating}
                        onChange={(patch) => setEditingDraft((current) => current ? { ...current, ...patch } : current)}
                        onSubmit={handleEditSubmit}
                        onCancel={() => {
                          setEditingLineId(null);
                          setEditingDraft(null);
                          setEditingError(null);
                        }}
                        jarOptions={jarOptions}
                        goals={goals}
                        debts={debts}
                        funds={funds}
                      />
                    );
                  }

                  return (
                    <div
                      key={line.id}
                      className="rounded-xl border border-violet-200 bg-white/90 p-3 shadow-sm dark:border-violet-500/20 dark:bg-violet-500/10"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold text-violet-950 dark:text-violet-100">{line.name}</span>
                            <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-bold text-violet-700 dark:bg-violet-500/20 dark:text-violet-200">
                              {getPlannerTypeLabel(line.type)}
                            </span>
                            {linkLabel && (
                              <span className="text-xs text-violet-600 dark:text-violet-300">
                                Liên kết: {linkLabel}
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-xs text-violet-600/90 dark:text-violet-300">
                            Hũ {line.jar_label}
                            {line.actual_amount > 0 ? ` · Đã chi ${formatCurrency(line.actual_amount)}` : ' · Chưa phát sinh thực tế'}
                          </p>
                        </div>

                        <div className="shrink-0 text-right">
                          <p className="text-sm font-bold text-violet-700 dark:text-violet-100">
                            {formatCurrency(line.planned_amount)}
                          </p>
                          {canEdit && (
                            <div className="mt-2 flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleStartEdit(line)}
                                className="rounded-md p-1.5 text-violet-600 hover:bg-violet-100 dark:text-violet-200 dark:hover:bg-violet-500/20"
                                title="Sửa khoản dự kiến"
                              >
                                <Pencil className="size-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(line)}
                                className="rounded-md p-1.5 text-red-500 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-500/10"
                                title="Xóa khoản dự kiến"
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Main component ────────────────────────────────────────────

export default function BudgetPlan({ month }: { month: string }) {
  const [expandedJar, setExpandedJar] = useState<string | null>(null);
  const [ensuredPeriodId, setEnsuredPeriodId] = useState<number | null>(null);
  const [optimisticWorkspaceJars, setOptimisticWorkspaceJars] = useState<BudgetWorkspaceJar[] | null>(null);

  // Editable total plan (base_income override) — persisted to DB
  const [editingPlan, setEditingPlan] = useState(false);
  const [planValue, setPlanValue] = useState('');

  const { data: settingRes } = useBudgetSetting(month);
  const updateSettingMutation = useUpdateBudgetSetting();
  const planOverride = settingRes?.data?.base_income_override ?? null;

  const { data, isPending, error } = useBudgetPlan(month, planOverride);
  const { data: jarsRes } = useJars();
  const updateJarMutation = useUpdateJar();
  const { data: budgetStatus } = useBudgetStatus(month);
  const createPeriodMutation = useCreateBudgetPeriod();
  const closePeriodMutation = useCloseBudgetPeriod();
  const { data: investmentData } = useInvestmentSummary(month);
  const { data: goalsRes } = useGoals();
  const { data: debtsRes } = useDebts();
  const { data: fundsRes } = useFunds();
  const { data: recurringBillsRes } = useRecurringBills();
  const { data: periodsRes, isPending: isPeriodsPending } = useBudgetPeriods();

  const periods = periodsRes?.data ?? [];
  const currentPeriod = periods.find((period) => period.month === month) ?? null;
  const currentPeriodId = currentPeriod?.id ?? null;
  const effectivePeriodId = currentPeriodId ?? ensuredPeriodId;

  const { data: workspaceRes, isPending: isWorkspacePending } = useBudgetPeriod(effectivePeriodId);
  const { data: budgetLinesRes, isPending: isBudgetLinesPending } = useBudgetLines(effectivePeriodId ?? 0);
  const createBudgetLineMutation = useCreateBudgetLine();
  const updateBudgetLineMutation = useUpdateBudgetLine();
  const deleteBudgetLineMutation = useDeleteBudgetLine();

  useEffect(() => {
    if (data?.data?.base_income) {
      setPlanValue(String(data.data.base_income));
    }
  }, [data?.data?.base_income]);

  useEffect(() => {
    setEnsuredPeriodId(null);
    setOptimisticWorkspaceJars(null);
    setExpandedJar(null);
  }, [month]);

  useEffect(() => {
    if (currentPeriodId) {
      setEnsuredPeriodId(currentPeriodId);
    }
  }, [currentPeriodId]);

  useEffect(() => {
    if (workspaceRes?.data.jars?.length) {
      setOptimisticWorkspaceJars(workspaceRes.data.jars);
    }
  }, [workspaceRes?.data.jars]);

  const dbJars = jarsRes?.data ?? [];
  const goals = goalsRes?.data ?? [];
  const debts = debtsRes?.data ?? [];
  const funds = fundsRes?.data ?? [];
  const recurringBills = recurringBillsRes?.data ?? [];
  const workspaceJars = workspaceRes?.data.jars ?? optimisticWorkspaceJars ?? [];
  const budgetLines = budgetLinesRes?.data ?? [];
  const plannerLoading = isPeriodsPending || createPeriodMutation.isPending || (Boolean(effectivePeriodId) && (isWorkspacePending || isBudgetLinesPending));
  const plannerEditable = !createPeriodMutation.isPending;
  const plannerMutating = createPeriodMutation.isPending || createBudgetLineMutation.isPending || updateBudgetLineMutation.isPending || deleteBudgetLineMutation.isPending;

  const budgetLinesByJar: Record<string, BudgetLine[]> = {};
  for (const line of budgetLines) {
    if (!budgetLinesByJar[line.jar_key]) {
      budgetLinesByJar[line.jar_key] = [];
    }
    budgetLinesByJar[line.jar_key].push(line);
  }

  const ensureCurrentPeriodWorkspace = useCallback(async () => {
    if (effectivePeriodId) {
      if (workspaceJars.length > 0) {
        return {
          periodId: effectivePeriodId,
          jars: workspaceJars,
        };
      }

      throw new Error('Đang tải planner của tháng này. Thử lại sau vài giây.');
    }

    if (isPeriodsPending) {
      throw new Error('Đang tải dữ liệu ngân sách của tháng này. Thử lại sau vài giây.');
    }

    const parsedMonth = parseBudgetMonth(month);
    if (!parsedMonth) {
      throw new Error(`Không đọc được tháng ngân sách từ "${month}".`);
    }

    const totalIncome = budgetStatus?.income ?? data?.data.sheet_income ?? data?.data.base_income ?? 0;
    const response = await createPeriodMutation.mutateAsync({
      month,
      year: parsedMonth.year,
      month_num: parsedMonth.monthNum,
      total_income: totalIncome,
    });

    setEnsuredPeriodId(response.data.period.id);
    setOptimisticWorkspaceJars(response.data.jars);

    return {
      periodId: response.data.period.id,
      jars: response.data.jars,
    };
  }, [
    budgetStatus?.income,
    createPeriodMutation,
    data?.data.base_income,
    data?.data.sheet_income,
    effectivePeriodId,
    isPeriodsPending,
    month,
    workspaceJars,
  ]);

  const handleSavePercent = useCallback((jarId: number, percent: number) => {
    updateJarMutation.mutate({ id: jarId, payload: { percent } });
  }, [updateJarMutation]);

  if (isPending) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="size-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl p-6 text-center max-w-7xl mx-auto">
        <AlertCircle className="size-8 text-red-400 mx-auto mb-2" />
        <p className="text-red-700 dark:text-red-400 font-medium">{error?.message}</p>
      </div>
    );
  }

  if (!data) return null;

  const plan = data.data;
  const { summary, jars } = plan;

  const toggleJar = (key: string) => {
    setExpandedJar(expandedJar === key ? null : key);
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-slate-900 dark:text-white text-3xl font-bold tracking-tight">
            Ngân sách tháng
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {budgetStatus && budgetStatus.has_period && budgetStatus.period_status === 'open' && (
            <button
              onClick={() => {
                if (budgetStatus.unassigned !== 0) {
                  alert(`Chưa phân bổ hết: ${formatCurrency(budgetStatus.unassigned)} còn dư. Hãy phân bổ hết trước khi đóng tháng.`);
                  return;
                }
                if (effectivePeriodId) closePeriodMutation.mutate(effectivePeriodId);
              }}
              disabled={closePeriodMutation.isPending || !effectivePeriodId}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 disabled:opacity-50"
            >
              {closePeriodMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Lock className="size-4" />}
              Đóng tháng
            </button>
          )}
        </div>
      </div>

      {/* Allocation Status Bar */}
      {budgetStatus && (
        <div className="bg-white dark:bg-[#1a2433] rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between text-sm">
              <span className="font-medium text-slate-700 dark:text-slate-200">Trạng thái phân bổ</span>
              <span className={cn(
                'font-bold text-sm',
                budgetStatus.unassigned === 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              )}>
                {budgetStatus.unassigned === 0 ? '✓ Đã cân bằng' : `Còn ${formatCurrency(budgetStatus.unassigned)} chưa phân bổ`}
              </span>
            </div>
            <div className="flex items-center gap-1 h-4 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-700">
              {budgetStatus.income > 0 && (
                <>
                  <div
                    className="h-full bg-blue-500 rounded-l-full"
                    style={{ width: `${Math.min(100, (budgetStatus.assigned / budgetStatus.income) * 100)}%` }}
                    title={`Đã phân bổ: ${formatCurrency(budgetStatus.assigned)}`}
                  />
                  {budgetStatus.unassigned > 0 && (
                    <div
                      className="h-full bg-red-400 rounded-r-full"
                      style={{ width: `${(budgetStatus.unassigned / budgetStatus.income) * 100}%` }}
                      title={`Chưa phân bổ: ${formatCurrency(budgetStatus.unassigned)}`}
                    />
                  )}
                </>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4 text-xs md:grid-cols-5">
              <div>
                <span className="text-slate-400 dark:text-slate-500">Thu nhập</span>
                <p className="font-bold text-slate-800 dark:text-slate-200">{formatCurrency(budgetStatus.income)}</p>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500">Đã phân bổ</span>
                <p className="font-bold text-blue-600 dark:text-blue-400">{formatCurrency(budgetStatus.assigned)}</p>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500">Đã gài dự kiến</span>
                <p className="font-bold text-violet-600 dark:text-violet-300">{formatCurrency(budgetStatus.committed)}</p>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500">Còn có thể chi</span>
                <p className={cn(
                  'font-bold',
                  budgetStatus.available_to_spend >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400',
                )}>
                  {formatCurrency(budgetStatus.available_to_spend)}
                </p>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500">Chưa phân bổ</span>
                <p className={cn('font-bold', budgetStatus.unassigned === 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')}>
                  {formatCurrency(budgetStatus.unassigned)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* BASE INCOME — read-only from Sheet */}
        <div className="relative overflow-hidden rounded-xl bg-white dark:bg-[#1a2433] p-6 shadow-sm border border-slate-100 dark:border-slate-700">
          <div className="absolute right-0 top-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full bg-blue-50 dark:bg-blue-500/10" />
          <div className="relative z-10 flex flex-col gap-1">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Thu nhập gốc</span>
            <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {formatCurrency(plan.sheet_income ?? plan.base_income)}
            </h3>
            <div className="mt-2 flex items-center gap-1 text-sm font-medium text-blue-600 dark:text-blue-400">
              <Wallet className="size-4" />
              <span>Từ Sheet (tự động)</span>
            </div>
          </div>
        </div>

        {/* TOTAL PLANNED — editable */}
        <div className="relative overflow-hidden rounded-xl bg-white dark:bg-[#1a2433] p-6 shadow-sm border border-slate-100 dark:border-slate-700">
          <div className="absolute right-0 top-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full bg-green-50 dark:bg-green-500/10" />
          <div className="relative z-10 flex flex-col gap-1">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Tổng kế hoạch</span>
            {editingPlan ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  value={planValue}
                  onChange={e => {
                    const raw = e.target.value.replace(/\D/g, '');
                    setPlanValue(raw);
                  }}
                  className="w-36 text-lg font-bold px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-[#0c1222] text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  autoFocus
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      const num = Number(planValue);
                      if (num > 0) {
                        updateSettingMutation.mutate({ month, baseIncomeOverride: num });
                      }
                      setEditingPlan(false);
                    }
                    if (e.key === 'Escape') {
                      setPlanValue(String(plan.base_income));
                      setEditingPlan(false);
                    }
                  }}
                />
                <button
                  onClick={() => {
                    const num = Number(planValue);
                    if (num > 0) {
                      updateSettingMutation.mutate({ month, baseIncomeOverride: num });
                    }
                    setEditingPlan(false);
                  }}
                  className="text-green-600 hover:text-green-700 cursor-pointer"
                >
                  <Check className="size-5" />
                </button>
                <button
                  onClick={() => {
                    setPlanValue(String(plan.base_income));
                    updateSettingMutation.mutate({ month, baseIncomeOverride: null });
                    setEditingPlan(false);
                  }}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="size-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h3 className="text-2xl font-bold tracking-tight text-green-600 dark:text-green-400">
                  {formatCurrency(summary.total_planned)}
                </h3>
                <button
                  onClick={() => {
                    setPlanValue(String(plan.base_income));
                    setEditingPlan(true);
                  }}
                  className="text-slate-400 hover:text-blue-500 cursor-pointer"
                  title="Sửa tổng kế hoạch"
                >
                  <Pencil className="size-4" />
                </button>
              </div>
            )}
            <div className="mt-2 flex items-center gap-1 text-sm font-medium text-green-600 dark:text-green-400">
              <TrendingUp className="size-4" />
              <span>{planOverride ? 'Đã tuỳ chỉnh' : `~${Math.round((summary.total_planned / (plan.sheet_income || plan.base_income)) * 100)}%`}</span>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-xl bg-white dark:bg-[#1a2433] p-6 shadow-sm border border-slate-100 dark:border-slate-700">
          <div className="absolute right-0 top-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full bg-red-50 dark:bg-red-500/10" />
          <div className="relative z-10 flex flex-col gap-1">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Đã chi thực tế</span>
            <h3 className="text-2xl font-bold tracking-tight text-red-600 dark:text-red-400">
              {formatCurrency(summary.total_actual)}
            </h3>
            <div className="mt-2 flex items-center gap-1 text-sm font-medium text-red-600 dark:text-red-400">
              <TrendingDown className="size-4" />
              <span>{Math.round(summary.usage_pct * 100) / 100}%</span>
            </div>
          </div>
        </div>

        <div className={`relative overflow-hidden rounded-xl p-6 shadow-sm border ${summary.total_remaining >= 0 ? 'bg-gradient-to-br from-emerald-600 to-emerald-800 text-white' : 'bg-gradient-to-br from-red-600 to-red-800 text-white'}`}>
          <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-white/10" />
          <div className="relative z-10 flex flex-col gap-1">
            <span className="text-sm font-medium text-white/80">Còn lại</span>
            <h3 className="text-2xl font-bold tracking-tight">
              {formatCurrency(summary.total_remaining)}
            </h3>
            <div className="mt-2 flex items-center gap-1 text-sm font-medium text-white/90">
              <Wallet className="size-4" />
              <span>{Math.round((100 - summary.usage_pct) * 100) / 100}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Investment Allocation Card */}
      {investmentData?.data && investmentData.data.funds.length > 0 && (() => {
        const inv = investmentData.data;
        const varianceColor = inv.total_variance === 0
          ? 'text-green-600 dark:text-green-400'
          : inv.total_variance > 0
            ? 'text-amber-600 dark:text-amber-400'
            : 'text-red-600 dark:text-red-400';
        const actualPct = inv.total_monthly_planned > 0
          ? Math.round((inv.total_monthly_actual / inv.total_monthly_planned) * 100)
          : 0;

        return (
          <div className="bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-500/10 dark:to-violet-500/10 rounded-xl border border-indigo-200 dark:border-indigo-500/30 shadow-sm overflow-hidden">
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-lg flex items-center justify-center bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
                    <TrendingUp className="size-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white">Đầu tư</h3>
                    <span className="text-xs text-slate-400 dark:text-slate-500">Investment Allocation</span>
                  </div>
                </div>
                {inv.total_monthly_actual >= inv.total_monthly_planned && inv.total_monthly_planned > 0 ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
                    <CheckCircle2 className="size-3.5" /> Đã đủ
                  </span>
                ) : inv.total_monthly_actual > 0 ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">
                    <AlertTriangle className="size-3.5" /> Đang tích
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 dark:bg-slate-500/20 dark:text-slate-400">
                    Chưa bắt đầu
                  </span>
                )}
              </div>

              {/* Progress bar */}
              <div className="mb-4">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Tiến độ {actualPct}%</span>
                  <span className="text-slate-500 dark:text-slate-400 font-medium">
                    {formatCurrency(inv.total_monthly_actual)} / {formatCurrency(inv.total_monthly_planned)}
                  </span>
                </div>
                <div className="h-2.5 w-full bg-white/60 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500 bg-indigo-500"
                    style={{ width: `${Math.min(actualPct, 100)}%` }}
                  />
                </div>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-4 gap-3">
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold">Kế hoạch</span>
                  <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{formatCurrency(inv.total_monthly_planned)}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold">Thực tế</span>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{formatCurrency(inv.total_monthly_actual)}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold">Chênh lệch</span>
                  <span className={cn("text-sm font-bold", varianceColor)}>
                    {inv.total_variance >= 0 ? '' : '-'}{formatCurrency(Math.abs(inv.total_variance))}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold">Tích lũy</span>
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(inv.total_cumulative_contributed)}</span>
                </div>
              </div>

              {/* Per-fund breakdown (if multiple investment funds) */}
              {inv.funds.length > 1 && (
                <div className="mt-4 pt-4 border-t border-indigo-200/50 dark:border-indigo-500/20 space-y-2">
                  {inv.funds.map((fund) => {
                    const pct = fund.monthly_planned > 0
                      ? Math.round((fund.monthly_actual / fund.monthly_planned) * 100)
                      : 0;
                    return (
                      <div key={fund.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-medium text-slate-700 dark:text-slate-200 truncate">{fund.name}</span>
                          {fund.jar && (
                            <span className="text-xs text-slate-400 dark:text-slate-500">({fund.jar.label})</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-xs text-slate-400">{pct}%</span>
                          <span className="font-bold text-slate-700 dark:text-slate-200">
                            {formatCurrency(fund.monthly_actual)} / {formatCurrency(fund.monthly_planned)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Jar cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {jars.map((jar) => {
          const style = getJarStyle(jar.key);
          const isExpanded = expandedJar === jar.key;
          const progressWidth = Math.min(jar.usage_pct, 100);
          const dbJar = dbJars.find((j: Jar) => j.key === jar.key);
          const jarMetric = budgetStatus?.jars.find((metric) => metric.key === jar.key);
          const jarLines = budgetLinesByJar[jar.key] ?? [];
          const spentAmount = jarMetric?.spent ?? jar.actual_amount;
          const committedAmount = jarMetric?.committed ?? jarLines.reduce((sum, line) => sum + line.planned_amount, 0);
          const availableAmount = jarMetric?.available ?? jar.remaining;

          return (
            <div
              key={jar.key}
              className="bg-white dark:bg-[#1a2433] rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden transition-shadow hover:shadow-md"
            >
              {/* Card header */}
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`size-10 rounded-lg flex items-center justify-center ${style.iconBg} ${style.darkIconBg}`}>
                      <Wallet className="size-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white">{jar.label}</h3>
                      <EditablePercent
                        jar={jar}
                        dbJar={dbJar}
                        onSave={handleSavePercent}
                        isSaving={updateJarMutation.isPending}
                      />
                    </div>
                  </div>
                  <StatusBadge status={jar.status} />
                </div>

                {/* Progress bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">Đã chi {Math.round(jar.usage_pct * 100) / 100}% ngân sách hũ</span>
                    <span className="text-slate-500 dark:text-slate-400 font-medium">
                      {formatCurrency(spentAmount)} / {formatCurrency(jar.planned_amount)}
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        jar.status === 'OVER'
                          ? 'bg-red-500'
                          : jar.status === 'WARN'
                            ? 'bg-amber-500'
                            : style.progressBg
                      }`}
                      style={{ width: `${progressWidth}%` }}
                    />
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold">Phân bổ</span>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{formatCurrency(jar.planned_amount)}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold">Dự kiến</span>
                    <span className="text-sm font-bold text-violet-600 dark:text-violet-300">{formatCurrency(committedAmount)}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold">Đã chi</span>
                    <span className="text-sm font-bold text-red-600 dark:text-red-400">{formatCurrency(spentAmount)}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold">Khả dụng</span>
                    <span className={`text-sm font-bold ${availableAmount >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                      {formatCurrency(availableAmount)}
                    </span>
                  </div>
                </div>

                <PlannedExpenseSection
                  jar={jar}
                  jarMetric={jarMetric}
                  lines={jarLines}
                  jarOptions={workspaceJars}
                  goals={goals}
                  debts={debts}
                  funds={funds}
                  recurringBills={recurringBills}
                  isLoading={plannerLoading}
                  isPreparing={createPeriodMutation.isPending}
                  canEdit={plannerEditable}
                  isMutating={plannerMutating}
                  onPrepareCreate={async (jarKey) => {
                    const workspace = await ensureCurrentPeriodWorkspace();
                    return workspace.jars.find((option) => option.jar_key === jarKey)?.allocation_id ?? null;
                  }}
                  onCreateLine={(payload) => createBudgetLineMutation.mutateAsync(payload)}
                  onUpdateLine={(id, payload) => updateBudgetLineMutation.mutateAsync({ id, payload })}
                  onDeleteLine={(id) => deleteBudgetLineMutation.mutateAsync(id)}
                />
              </div>

              {/* Drill-down toggle */}
              <button
                onClick={() => toggleJar(jar.key)}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-[#0c1222] hover:bg-slate-100 dark:hover:bg-slate-800 border-t border-slate-100 dark:border-slate-700 transition-colors cursor-pointer"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="size-3.5" /> Thu gọn
                  </>
                ) : (
                  <>
                    <ChevronDown className="size-3.5" /> Xem giao dịch
                  </>
                )}
              </button>

              {/* Drill-down transactions */}
              {isExpanded && (
                <div className="border-t border-slate-100 dark:border-slate-700 px-5 py-3 bg-slate-50/50 dark:bg-[#0c1222]/50">
                  <JarDrillDown jar={jar} month={month} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

