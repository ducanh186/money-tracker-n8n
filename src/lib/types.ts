// ---------------------------------------------------------------
// TypeScript types matching the Laravel API response shape
// ---------------------------------------------------------------

/** A single transaction row as returned by GET /api/transactions */
export interface Transaction {
  date: string | null;
  flow: 'income' | 'expense' | 'transfer' | string | null;
  amount_k: number;
  amount_raw: number;
  amount_vnd: number;
  amount_vnd_signed: number;
  amount_vnd_abs: number;
  signed_amount_vnd: number;
  direction: 'income' | 'expense' | 'transfer' | 'refund' | 'adjustment' | string;
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

export interface LoanSummary {
  in: number;
  out: number;
  repayment: number;
  recovery: number;
  net_owed: number;
}

export interface BudgetPlanData {
  month: string;
  base_income: number;
  sheet_income: number;
  expected_income_vnd: number;
  actual_income_vnd: number;
  actual_expense_vnd?: number;
  has_period?: boolean;
  period_status?: string;
  is_preview?: boolean;
  jars: BudgetJar[];
  categories?: CategorySummary[];
  budget_basis?: 'category' | 'jar_compatibility' | string;
  summary: BudgetPlanSummary;
  loan_summary?: LoanSummary;
  thresholds: { ok_max: number; warn_max: number };
}

export interface BudgetPlanResponse {
  data: BudgetPlanData;
}

export interface BudgetStatusAccountSummary {
  opening_balance_vnd: number;
  ending_balance_vnd: number;
  account_balance_vnd: number;
  balance_source?: {
    type: string;
    from_transaction_datetime?: string | null;
  };
}

export interface BudgetStatusActualsSummary {
  income_vnd: number;
  expense_vnd: number;
  spent_vnd: number;
  reserved_vnd: number;
}

export interface BudgetStatusPlanSummary {
  has_period: boolean;
  status: string;
  income_vnd: number | null;
  assigned_vnd: number | null;
  unassigned_vnd: number | null;
  committed_vnd: number | null;
  available_to_spend_vnd: number | null;
  budget_basis?: string | null;
  jars: BudgetStatusJarMetric[];
  categories?: CategorySummary[];
}

export interface BudgetStatusSuggestionSummary {
  enabled: boolean;
  source: string | null;
  expected_income_vnd: number | null;
  budgeted_vnd: number | null;
  reserved_vnd: number | null;
  remaining_vnd: number | null;
  available_to_spend_vnd?: number | null;
  left_to_budget_vnd?: number | null;
  jars: BudgetStatusJarMetric[];
  categories?: CategorySummary[];
}

export interface BudgetSettingData {
  month: string;
  base_income_override: number | null;
}

export interface BudgetSettingResponse {
  data: BudgetSettingData;
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
    account_balance_vnd?: number | null;
    opening_balance_vnd?: number | null;
    assigned?: number | null;
    unassigned?: number | null;
    committed?: number | null;
  };
  available_to_spend?: number | null;
  expense_by_jar?: Record<string, number>;
  has_period?: boolean;
  period_status?: string;
  is_preview?: boolean;
  recent_transactions: {
    date: string | null;
    time: string | null;
    flow: string | null;
    amount_vnd: number;
    amount_vnd_signed?: number;
    amount_vnd_abs?: number;
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

// ---------------------------------------------------------------
// Budget Status (TopBar / global state) — GET /api/budget-status
// ---------------------------------------------------------------

export interface BudgetStatusJarMetric {
  key: string;
  label: string;
  planned: number;
  budgeted_vnd?: number;
  committed: number;
  reserved?: number;
  reserved_vnd?: number;
  spent: number;
  spent_vnd?: number;
  available: number;
  available_vnd?: number;
  remaining_vnd?: number;
  rollover: number;
  funds_count: number;
  usage_pct?: number;
  status?: 'OK' | 'WARN' | 'OVER' | string;
}

export interface OverspentJar {
  key: string;
  label: string;
  over: number;
}

export interface BudgetStatusData {
  month: string;
  canonical_month?: string;
  month_iso?: string;
  expected_income_vnd?: number;
  actual_income_vnd?: number;
  actual_expense_vnd?: number;
  budgeted_vnd?: number;
  spent_vnd?: number;
  reserved_vnd?: number;
  remaining_vnd?: number;
  available_to_spend_vnd?: number;
  left_to_budget_vnd?: number;
  account_balance_vnd?: number;
  ending_balance_vnd?: number;
  opening_balance_vnd?: number;
  account?: BudgetStatusAccountSummary;
  actuals?: BudgetStatusActualsSummary;
  plan?: BudgetStatusPlanSummary;
  suggestion?: BudgetStatusSuggestionSummary;
  income: number;
  sheet_income: number;
  assigned: number | null;
  unassigned: number | null;
  committed: number | null;
  total_spent: number;
  available_to_spend: number | null;
  overspent_jars: OverspentJar[];
  period_status: string;
  planning_insights_enabled: boolean;
  has_period: boolean;
  jars: BudgetStatusJarMetric[];
  categories?: CategorySummary[];
  budget_basis?: 'category' | 'jar_compatibility' | string;
}

export interface BudgetStatusResponse {
  data: BudgetStatusData;
}

export interface BalanceAccount {
  account: string;
  opening_balance_vnd: number;
  ending_balance_vnd: number;
}

export interface BalanceData {
  month?: string;
  canonical_month?: string;
  month_iso?: string;
  as_of: string;
  opening_balance_vnd?: number;
  ending_balance_vnd?: number;
  account_balance_vnd: number;
  balance_vnd?: number;
  source: {
    type: 'current_month' | 'carry_forward' | 'none' | string;
    from_transaction_datetime: string | null;
  };
  accounts?: BalanceAccount[];
}

export interface BalanceResponse {
  data: BalanceData;
}

export type MonthlySummaryData = BudgetStatusData;

export interface MonthlySummaryResponse {
  data: MonthlySummaryData;
}

export interface Category {
  id: number;
  key: string;
  name: string;
  group: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface CategorySummary {
  category_key: string;
  category_name: string;
  category_group?: string | null;
  budgeted_vnd: number;
  spent_vnd: number;
  reserved_vnd: number;
  rollover_vnd?: number;
  remaining_vnd: number;
  usage_pct: number;
  status: 'OK' | 'WARN' | 'OVER' | string;
  source?: string;
}

export interface CategoryBudget {
  id: number;
  budget_period_id: number;
  category_id: number;
  category_key: string;
  category_name: string;
  budgeted_amount: number;
  reserved_amount: number;
  rollover_amount: number;
  notes: string | null;
}

export interface CreateCategoryBudgetPayload {
  budget_period_id: number;
  category_id: number;
  budgeted_amount: number;
  reserved_amount?: number;
  rollover_amount?: number;
  notes?: string | null;
}

export interface CategoriesResponse {
  data: Category[];
}

export interface CategoryBudgetsResponse {
  data: CategoryBudget[];
}

export interface BudgetTemplateItem {
  category: Pick<Category, 'id' | 'key' | 'name'> | null;
  jar: { id: number; key: string; label: string } | null;
  percent: number;
  sort_order: number;
}

export interface BudgetTemplate {
  id: number;
  key: string;
  name: string;
  type: string;
  is_default: boolean;
  items: BudgetTemplateItem[];
}

export interface BudgetTemplatesResponse {
  data: BudgetTemplate[];
}

// ---------------------------------------------------------------
// Fund (Quỹ con) types — matching BE FundController
// ---------------------------------------------------------------

export interface FundJar {
  id: number;
  key: string;
  label: string;
}

export interface FundGoal {
  id: number;
  name: string;
}

export interface Fund {
  id: number;
  name: string;
  type: 'sinking_fund' | 'investment';
  jar: FundJar | null;
  goal: FundGoal | null;
  target_amount: number;
  reserved_amount: number;
  spent_amount: number;
  available: number;
  monthly_reserve: number;
  progress_pct: number;
  status: 'active' | 'completed' | 'paused';
  notes: string | null;
  last_contributed_at: string | null;
  sort_order: number;
}

export interface FundsResponse {
  data: Fund[];
}

export interface CreateFundPayload {
  name: string;
  type?: 'sinking_fund' | 'investment';
  jar_id: number;
  goal_id?: number | null;
  target_amount?: number;
  monthly_reserve?: number;
  notes?: string | null;
  sort_order?: number;
}

// ---------------------------------------------------------------
// Investment Summary types — matching BE FundController.investmentSummary
// ---------------------------------------------------------------

export interface InvestmentFundSummary {
  id: number;
  name: string;
  jar: FundJar | null;
  monthly_planned: number;
  monthly_actual: number;
  variance: number;
  cumulative_contributed: number;
  monthly_reserve: number;
  last_contributed_at: string | null;
  status: 'active' | 'completed' | 'paused';
  notes: string | null;
}

export interface InvestmentSummaryData {
  month: string | null;
  funds: InvestmentFundSummary[];
  total_monthly_planned: number;
  total_monthly_actual: number;
  total_variance: number;
  total_cumulative_contributed: number;
}

export interface InvestmentSummaryResponse {
  data: InvestmentSummaryData;
}

// ---------------------------------------------------------------
// Budget Period types — matching BE BudgetPeriodController
// ---------------------------------------------------------------

export interface BudgetPeriod {
  id: number;
  month: string;
  year: number;
  month_num: number;
  total_income: number;
  to_be_budgeted: number;
  status: string;
  rollover_policy: string;
  notes: string | null;
  salary_received_at: string | null;
  allocation_locked_at: string | null;
}

export interface BudgetPeriodsResponse {
  data: BudgetPeriod[];
}

export interface BudgetWorkspaceJar {
  allocation_id: number;
  jar_key: string;
  jar_label: string;
  percent: number;
  planned_amount: number;
  funded_amount: number;
  lines_planned: number;
  lines_actual: number;
  unassigned: number;
  budget_lines: unknown[];
}

export interface BudgetWorkspace {
  period: BudgetPeriod;
  jars: BudgetWorkspaceJar[];
}

export interface CreateBudgetPeriodPayload {
  month: string;
  total_income: number;
  year?: number;
  month_num?: number;
  rollover_policy?: string;
  notes?: string | null;
  salary_received_at?: string | null;
  allocation_locked_at?: string | null;
}

// ---------------------------------------------------------------
// Debt types — matching BE DebtController
// ---------------------------------------------------------------

export interface DebtPayment {
  id: number;
  amount: number;
  principal: number;
  interest: number;
  period: string | null;
  paid_at: string;
}

export interface Debt {
  id: number;
  name: string;
  creditor: string | null;
  total_amount: number;
  remaining_amount: number;
  paid_amount: number;
  progress_pct: number;
  interest_rate: number;
  minimum_payment: number;
  due_day_of_month: number | null;
  days_until_due: number | null;
  strategy: 'snowball' | 'avalanche';
  priority: number;
  status: 'active' | 'paid_off' | 'defaulted';
  notes: string | null;
  total_paid: number;
  total_interest_paid: number;
  payments?: DebtPayment[];
}

export interface DebtsResponse {
  data: Debt[];
  summary: {
    total_debt: number;
    total_minimum: number;
    count_active: number;
  };
}

export interface DebtDetailResponse {
  data: Debt;
}

export interface CreateDebtPayload {
  name: string;
  creditor?: string | null;
  total_amount: number;
  remaining_amount: number;
  interest_rate?: number;
  minimum_payment?: number;
  due_day_of_month?: number | null;
  strategy?: 'snowball' | 'avalanche';
  priority?: number;
  notes?: string | null;
}

export interface PayDebtPayload {
  amount: number;
  principal?: number;
  interest?: number;
  budget_period_id?: number | null;
  paid_at?: string;
  notes?: string | null;
}

// ---------------------------------------------------------------
// Recurring Bill types — matching BE RecurringBillController
// ---------------------------------------------------------------

export interface RecurringBill {
  id: number;
  name: string;
  amount: number;
  frequency: string;
  jar_id: number | null;
  due_day: number | null;
  next_due_date: string | null;
  category: string | null;
  is_active: boolean;
  notes: string | null;
}

export interface RecurringBillsResponse {
  data: RecurringBill[];
}

export interface CreateRecurringBillPayload {
  name: string;
  amount: number;
  frequency: string;
  jar_id?: number | null;
  due_day?: number | null;
  next_due_date?: string | null;
  category?: string | null;
  notes?: string | null;
}

// ---------------------------------------------------------------
// Scenario types — matching BE ScenarioController
// ---------------------------------------------------------------

export interface Scenario {
  id: number;
  budget_period_id: number | null;
  name: string;
  description: string | null;
  purchase_amount: number;
  target_jar_id: number;
  proposals: unknown;
  impact: unknown;
}

export interface ScenariosResponse {
  data: Scenario[];
}

export interface SimulateScenarioPayload {
  name: string;
  purchase_amount: number;
  target_jar_id: number;
  budget_period_id?: number | null;
  description?: string | null;
}

// ---------------------------------------------------------------
// Budget Line types — matching BE BudgetLineController
// ---------------------------------------------------------------

export interface BudgetLine {
  id: number;
  jar_allocation_id: number;
  jar_key: string;
  jar_label: string;
  name: string;
  type: 'general' | 'goal' | 'bill' | 'debt' | 'sinking_fund' | 'investment';
  planned_amount: number;
  actual_amount: number;
  remaining: number;
  usage_pct: number;
  goal_id: number | null;
  debt_id: number | null;
  recurring_bill_id: number | null;
  fund_id: number | null;
  notes: string | null;
}

export interface BudgetLinesResponse {
  data: BudgetLine[];
}

export interface CreateBudgetLinePayload {
  jar_allocation_id: number;
  name: string;
  type?: BudgetLine['type'];
  planned_amount: number;
  actual_amount?: number;
  goal_id?: number | null;
  debt_id?: number | null;
  recurring_bill_id?: number | null;
  fund_id?: number | null;
  notes?: string | null;
}
