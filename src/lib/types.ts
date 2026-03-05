// ---------------------------------------------------------------
// TypeScript types matching the Laravel API response shape
// ---------------------------------------------------------------

/** A single transaction row as returned by GET /api/transactions */
export interface Transaction {
  date: string | null;
  flow: 'income' | 'expense' | 'transfer' | null;
  amount_k: number;
  amount_vnd: number;
  signed_amount_vnd: number;
  currency: string | null;
  category: string | null;
  description: string | null;
  account: string | null;
  jar: string | null;
  balance: number;
  balance_vnd: number;
  month: string | null;
  status: string | null;
  idempotency_key: string | null;
  note: string | null;
  datetime: string | null;
  datetime_iso: string | null;
  time: string | null;
}

/** Summary totals block inside meta */
export interface TransactionTotals {
  income_vnd: number;
  expense_vnd: number;
  net_vnd: number;
  ending_balance_vnd: number | null;
}

/** Pagination metadata */
export interface TransactionMeta {
  page: number;
  pageSize: number;
  total: number;
  totals: TransactionTotals;
}

/** GET /api/transactions response */
export interface TransactionsResponse {
  data: Transaction[];
  meta: TransactionMeta;
}

/** GET /api/transactions/:key response */
export interface TransactionDetailResponse {
  data: Transaction;
}

/** Query params for the index endpoint */
export interface TransactionsQuery {
  month: string;
  flow?: 'income' | 'expense' | 'transfer';
  jar?: string;
  status?: string;
  q?: string;
  page?: number;
  pageSize?: number;
  sort?: 'datetime_asc' | 'datetime_desc';
}

// ---------------------------------------------------------------
// Budget Plan types matching GET /api/budget-plan response
// ---------------------------------------------------------------

export interface BudgetJar {
  key: string;
  label: string;
  percent: number;
  planned_amount: number;
  actual_amount: number;
  remaining: number;
  usage_pct: number;
  status: 'OK' | 'WARN' | 'OVER';
}

export interface BudgetPlanSummary {
  total_planned: number;
  total_actual: number;
  total_remaining: number;
  usage_pct: number;
}

export interface BudgetPlanData {
  month: string;
  base_income: number;
  jars: BudgetJar[];
  summary: BudgetPlanSummary;
  thresholds: { ok_max: number; warn_max: number };
}

export interface BudgetPlanResponse {
  data: BudgetPlanData;
}

// ---------------------------------------------------------------
// Dashboard summary (lightweight) types
// ---------------------------------------------------------------

export interface DashboardSummaryData {
  month: string;
  transaction_count: number;
  totals: {
    income_vnd: number;
    expense_vnd: number;
    net_vnd: number;
    ending_balance_vnd: number | null;
  };
  expense_by_jar: Record<string, number>;
  recent_transactions: {
    date: string | null;
    time: string | null;
    flow: string | null;
    amount_vnd: number;
    description: string | null;
    category: string | null;
    jar: string | null;
  }[];
}

export interface DashboardSummaryResponse {
  data: DashboardSummaryData;
}

export interface SyncStatusData {
  last_sync_at: string | null;
  row_count: number;
  elapsed_ms: number;
  months_warmed: string[];
}

export interface SyncStatusResponse {
  data: SyncStatusData;
}

// ---------------------------------------------------------------
// Goal (Quỹ mục tiêu) types — matching BE GoalController
// ---------------------------------------------------------------

export interface GoalJar {
  key: string;
  label: string;
}

export interface GoalContribution {
  id: number;
  amount: number;
  source_jar: string | null;
  period: string | null;
  notes: string | null;
  contributed_at: string;
}

export interface Goal {
  id: number;
  name: string;
  target_amount: number;
  current_amount: number;
  shortfall: number;
  progress_pct: number;
  jar: GoalJar | null;
  deadline: string | null;
  priority: number;
  funding_mode: 'fund_now' | 'fund_over_time';
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  notes: string | null;
  contributions_count?: number;
  contributions?: GoalContribution[];
  created_at?: string;
}

export interface GoalsResponse {
  data: Goal[];
}

export interface GoalDetailResponse {
  data: Goal;
}

export interface CreateGoalPayload {
  name: string;
  target_amount: number;
  jar_id?: number | null;
  deadline?: string | null;
  priority?: number;
  funding_mode?: 'fund_now' | 'fund_over_time';
  notes?: string | null;
}

export interface ContributePayload {
  amount: number;
  source_jar_id?: number | null;
  budget_period_id?: number | null;
  notes?: string | null;
}

export interface ContributeResponse {
  data: GoalContribution;
  goal: {
    current_amount: number;
    progress_pct: number;
    status: string;
  };
  message: string;
}

// ---------------------------------------------------------------
// Account (Tài khoản) types — matching BE AccountController
// ---------------------------------------------------------------

export interface Account {
  id: number;
  name: string;
  type: 'checking' | 'savings' | 'cash' | 'ewallet' | 'investment';
  institution: string | null;
  balance: number;
  currency: string;
  is_active: boolean;
  sort_order: number;
}

export interface AccountsResponse {
  data: Account[];
}

export interface NetWorthResponse {
  net_worth: number;
  currency: string;
  accounts: {
    id: number;
    name: string;
    type: string;
    institution: string | null;
    balance: number;
  }[];
}

export interface CreateAccountPayload {
  name: string;
  type?: 'checking' | 'savings' | 'cash' | 'ewallet' | 'investment';
  institution?: string | null;
  balance?: number;
  currency?: string;
  is_active?: boolean;
  sort_order?: number;
}

// ---------------------------------------------------------------
// Transfer (Chuyển khoản) types — matching BE TransferController
// ---------------------------------------------------------------

export interface Transfer {
  id: number;
  from_account: { id: number; name: string } | null;
  to_account: { id: number; name: string } | null;
  amount: number;
  goal: { id: number; name: string } | null;
  jar: { key: string; label: string } | null;
  description: string | null;
  transferred_at: string;
  period: string | null;
}

export interface TransfersResponse {
  data: Transfer[];
}

export interface CreateTransferPayload {
  from_account_id: number;
  to_account_id: number;
  amount: number;
  goal_id?: number | null;
  jar_id?: number | null;
  description?: string | null;
  transferred_at?: string;
  budget_period_id?: number | null;
}

// ---------------------------------------------------------------
// Jar (6 hũ) types — matching BE JarController
// ---------------------------------------------------------------

export interface Jar {
  id: number;
  key: string;
  label: string;
  percent: number;
  sort_order: number;
  is_active: boolean;
}

export interface JarsResponse {
  data: Jar[];
}
