import type {
  TransactionsResponse,
  TransactionDetailResponse,
  TransactionsQuery,
  BudgetPlanResponse,
  BudgetSettingResponse,
  DashboardSummaryResponse,
  SyncStatusResponse,
  GoalsResponse,
  GoalDetailResponse,
  CreateGoalPayload,
  ContributePayload,
  ContributeResponse,
  AccountsResponse,
  NetWorthResponse,
  CreateAccountPayload,
  TransfersResponse,
  CreateTransferPayload,
  JarsResponse,
  BudgetStatusResponse,
  BudgetStatusData,
  FundsResponse,
  CreateFundPayload,
  BudgetPeriodsResponse,
  CreateBudgetPeriodPayload,
  Goal,
  Account,
  Transfer,
  Jar,
  Fund,
  Debt,
  RecurringBill,
  Scenario,
  BudgetLine,
  BudgetWorkspace,
  InvestmentSummaryResponse,
  DebtsResponse,
  DebtDetailResponse,
  CreateDebtPayload,
  PayDebtPayload,
  RecurringBillsResponse,
  CreateRecurringBillPayload,
  ScenariosResponse,
  SimulateScenarioPayload,
  BudgetLinesResponse,
  CreateBudgetLinePayload,
  BalanceResponse,
  MonthlySummaryResponse,
  CategoriesResponse,
  CategoryBudgetsResponse,
  BudgetTemplatesResponse,
  CategoryBudget,
  CreateCategoryBudgetPayload,
} from './types';

// Base URL — in dev the Vite proxy forwards /api → Laravel at :8000
const BASE = '/api';

// ---------------------------------------------------------------
// ETag cache — stores ETags + response body per URL
// ---------------------------------------------------------------
const etagCache = new Map<string, { etag: string; data: unknown }>();

/**
 * Smart fetch with ETag / If-None-Match support.
 * On 304: returns cached response body (zero parsing cost).
 * On 200: stores ETag + body, returns fresh data.
 */
async function smartFetch<T>(url: string): Promise<T> {
  const headers: HeadersInit = {};
  const cached = etagCache.get(url);
  if (cached) {
    headers['If-None-Match'] = cached.etag;
  }

  const res = await fetch(url, { headers });

  // 304 Not Modified — return cached data (no body to parse)
  if (res.status === 304 && cached) {
    return cached.data as T;
  }

  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${res.statusText}`);
  }

  const data: T = await res.json();

  // Store ETag + response body for future 304 handling
  const newEtag = res.headers.get('ETag');
  if (newEtag) {
    etagCache.set(url, { etag: newEtag, data });
  }

  return data;
}

/** Sentinel error for 304 responses — kept for shouldRetry compatibility */
export class NotModifiedError extends Error {
  constructor() {
    super('304 Not Modified');
    this.name = 'NotModifiedError';
  }
}

// ---------------------------------------------------------------
// Dashboard summary (lightweight — recommended for overview page)
// ---------------------------------------------------------------

export async function fetchDashboardSummary(
  month: string,
): Promise<DashboardSummaryResponse> {
  return smartFetch(`${BASE}/dashboard/summary?month=${encodeURIComponent(month)}`);
}

// ---------------------------------------------------------------
// Sync status / trigger
// ---------------------------------------------------------------

export async function fetchSyncStatus(): Promise<SyncStatusResponse> {
  const res = await fetch(`${BASE}/sync-status`);
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

export async function triggerSync(): Promise<void> {
  const res = await fetch(`${BASE}/sync`, { method: 'POST' });
  if (!res.ok) throw new Error(`API error ${res.status}: ${res.statusText}`);
}

/**
 * Fetch paginated + filtered transactions for a given month.
 */
export async function fetchTransactions(
  params: TransactionsQuery,
): Promise<TransactionsResponse> {
  const qs = new URLSearchParams();
  qs.set('month', params.month);
  if (params.flow) qs.set('flow', params.flow);
  if (params.jar) qs.set('jar', params.jar);
  if (params.status) qs.set('status', params.status);
  if (params.q) qs.set('q', params.q);
  if (params.page) qs.set('page', String(params.page));
  if (params.pageSize) qs.set('pageSize', String(params.pageSize));
  if (params.sort) qs.set('sort', params.sort);

  return smartFetch(`${BASE}/transactions?${qs.toString()}`);
}

/**
 * Fetch a single transaction by idempotency_key.
 */
export async function fetchTransactionDetail(
  idempotencyKey: string,
): Promise<TransactionDetailResponse> {
  return smartFetch(`${BASE}/transactions/${encodeURIComponent(idempotencyKey)}`);
}

/**
 * Fetch budget plan comparison for a given month.
 */
export async function fetchBudgetPlan(
  month: string,
  baseIncome?: number | null,
): Promise<BudgetPlanResponse> {
  let url = `${BASE}/budget-plan?month=${encodeURIComponent(month)}`;
  if (baseIncome != null) {
    url += `&base_income=${baseIncome}`;
  }
  return smartFetch(url);
}

// ---------------------------------------------------------------
// Budget Settings (per-month overrides)
// ---------------------------------------------------------------

export async function fetchBudgetSetting(month: string): Promise<BudgetSettingResponse> {
  return smartFetch(`${BASE}/budget-settings/${encodeURIComponent(month)}`);
}

export async function updateBudgetSetting(
  month: string,
  payload: { base_income_override: number | null },
): Promise<{ data: { month: string; base_income_override: number | null }; message: string }> {
  return apiWrite(`${BASE}/budget-settings/${encodeURIComponent(month)}`, 'PUT', payload);
}

// ---------------------------------------------------------------
// Month helpers
// ---------------------------------------------------------------

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/** Get current month in "MMM-YYYY" format e.g. "Feb-2026" */
export function getCurrentMonth(): string {
  const now = new Date();
  return `${MONTH_NAMES[now.getMonth()]}-${now.getFullYear()}`;
}

/** Build a list of the last N months (latest first) in "MMM-YYYY" format */
export function getRecentMonths(count = 12): string[] {
  const months: string[] = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${MONTH_NAMES[d.getMonth()]}-${d.getFullYear()}`);
  }
  return months;
}

/** Display label for a month string: "Feb-2026" → "Tháng 02, 2026" */
export function formatMonthLabel(month: string): string {
  const [abbr, year] = month.split('-');
  const idx = MONTH_NAMES.indexOf(abbr);
  if (idx === -1) return month;
  return `Tháng ${String(idx + 1).padStart(2, '0')}, ${year}`;
}

// ---------------------------------------------------------------
// Generic write helper (POST / PUT / DELETE)
// ---------------------------------------------------------------

async function apiWrite<T>(
  url: string,
  method: 'POST' | 'PUT' | 'DELETE',
  body?: unknown,
): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    const msg = (errBody as { message?: string }).message ?? `API error ${res.status}`;
    throw new Error(msg);
  }

  return res.json();
}

// ---------------------------------------------------------------
// Goals (Quỹ mục tiêu)
// ---------------------------------------------------------------

export async function fetchGoals(status?: string): Promise<GoalsResponse> {
  const qs = status ? `?status=${encodeURIComponent(status)}` : '';
  return smartFetch(`${BASE}/goals${qs}`);
}

export async function fetchGoal(id: number): Promise<GoalDetailResponse> {
  return smartFetch(`${BASE}/goals/${id}`);
}

export async function createGoal(payload: CreateGoalPayload): Promise<{ data: Goal; message: string }> {
  return apiWrite(`${BASE}/goals`, 'POST', payload);
}

export async function updateGoal(id: number, payload: Partial<CreateGoalPayload>): Promise<{ data: Goal; message: string }> {
  return apiWrite(`${BASE}/goals/${id}`, 'PUT', payload);
}

export async function deleteGoal(id: number): Promise<{ message: string }> {
  return apiWrite(`${BASE}/goals/${id}`, 'DELETE');
}

export async function contributeToGoal(goalId: number, payload: ContributePayload): Promise<ContributeResponse> {
  return apiWrite(`${BASE}/goals/${goalId}/contribute`, 'POST', payload);
}

// ---------------------------------------------------------------
// Accounts (Tài khoản)
// ---------------------------------------------------------------

export async function fetchAccounts(): Promise<AccountsResponse> {
  return smartFetch(`${BASE}/accounts`);
}

export async function fetchNetWorth(): Promise<NetWorthResponse> {
  return smartFetch(`${BASE}/accounts/net-worth`);
}

export async function createAccount(payload: CreateAccountPayload): Promise<{ data: Account; message: string }> {
  return apiWrite(`${BASE}/accounts`, 'POST', payload);
}

export async function updateAccount(id: number, payload: Partial<CreateAccountPayload>): Promise<{ data: Account; message: string }> {
  return apiWrite(`${BASE}/accounts/${id}`, 'PUT', payload);
}

export async function deleteAccount(id: number): Promise<{ message: string }> {
  return apiWrite(`${BASE}/accounts/${id}`, 'DELETE');
}

// ---------------------------------------------------------------
// Transfers (Chuyển khoản)
// ---------------------------------------------------------------

export async function fetchTransfers(budgetPeriodId?: number): Promise<TransfersResponse> {
  const qs = budgetPeriodId ? `?budget_period_id=${budgetPeriodId}` : '';
  return smartFetch(`${BASE}/transfers${qs}`);
}

export async function createTransfer(payload: CreateTransferPayload): Promise<{ data: Transfer; message: string }> {
  return apiWrite(`${BASE}/transfers`, 'POST', payload);
}

// ---------------------------------------------------------------
// Jars (6 hũ)
// ---------------------------------------------------------------

export async function fetchJars(): Promise<JarsResponse> {
  return smartFetch(`${BASE}/jars`);
}

export async function updateJar(id: number, payload: { percent?: number; label?: string }): Promise<{ data: Jar; message: string }> {
  return apiWrite(`${BASE}/jars/${id}`, 'PUT', payload);
}

// ---------------------------------------------------------------
// Budget Status (TopBar / global state)
// ---------------------------------------------------------------

export async function fetchBudgetStatus(month: string): Promise<BudgetStatusData> {
  const res = await smartFetch<BudgetStatusResponse>(`${BASE}/budget-status?month=${encodeURIComponent(month)}`);
  return res.data;
}

export async function fetchBalances(month: string): Promise<BalanceResponse> {
  return smartFetch(`${BASE}/balances?month=${encodeURIComponent(month)}`);
}

export async function fetchBalanceAsOf(date: string): Promise<BalanceResponse> {
  return smartFetch(`${BASE}/balances/as-of?date=${encodeURIComponent(date)}`);
}

export async function fetchMonthlySummary(month: string): Promise<MonthlySummaryResponse> {
  return smartFetch(`${BASE}/monthly-summary?month=${encodeURIComponent(month)}`);
}

export async function fetchCategories(): Promise<CategoriesResponse> {
  return smartFetch(`${BASE}/categories`);
}

export async function fetchCategoryBudgets(month: string): Promise<CategoryBudgetsResponse> {
  return smartFetch(`${BASE}/category-budgets?month=${encodeURIComponent(month)}`);
}

export async function createCategoryBudget(payload: CreateCategoryBudgetPayload): Promise<{ data: CategoryBudget; message: string }> {
  return apiWrite(`${BASE}/category-budgets`, 'POST', payload);
}

export async function updateCategoryBudget(id: number, payload: Partial<CreateCategoryBudgetPayload>): Promise<{ data: CategoryBudget; message: string }> {
  return apiWrite(`${BASE}/category-budgets/${id}`, 'PUT', payload);
}

export async function fetchBudgetTemplates(): Promise<BudgetTemplatesResponse> {
  return smartFetch(`${BASE}/budget-templates`);
}

// ---------------------------------------------------------------
// Funds (Quỹ con)
// ---------------------------------------------------------------

export async function fetchFunds(jarId?: number): Promise<FundsResponse> {
  const qs = jarId ? `?jar_id=${jarId}` : '';
  return smartFetch(`${BASE}/funds${qs}`);
}

export async function createFund(payload: CreateFundPayload): Promise<{ data: Fund; message: string }> {
  return apiWrite(`${BASE}/funds`, 'POST', payload);
}

export async function updateFund(id: number, payload: Partial<CreateFundPayload>): Promise<{ data: Fund; message: string }> {
  return apiWrite(`${BASE}/funds/${id}`, 'PUT', payload);
}

export async function deleteFund(id: number): Promise<{ message: string }> {
  return apiWrite(`${BASE}/funds/${id}`, 'DELETE');
}

export async function reserveFund(id: number, amount: number): Promise<{ data: Fund; message: string }> {
  return apiWrite(`${BASE}/funds/${id}/reserve`, 'POST', { amount });
}

export async function spendFund(id: number, amount: number, description?: string): Promise<{ data: Fund; message: string }> {
  return apiWrite(`${BASE}/funds/${id}/spend`, 'POST', { amount, description });
}

export async function fetchInvestmentSummary(month?: string): Promise<InvestmentSummaryResponse> {
  const qs = month ? `?month=${encodeURIComponent(month)}` : '';
  return smartFetch(`${BASE}/investment-summary${qs}`);
}

// ---------------------------------------------------------------
// Budget Periods (Kỳ ngân sách)
// ---------------------------------------------------------------

export async function fetchBudgetPeriods(): Promise<BudgetPeriodsResponse> {
  return smartFetch(`${BASE}/budget-periods`);
}

export async function fetchBudgetPeriod(id: number): Promise<{ data: BudgetWorkspace }> {
  return smartFetch(`${BASE}/budget-periods/${id}`);
}

export async function createBudgetPeriod(payload: CreateBudgetPeriodPayload): Promise<{ data: BudgetWorkspace; message: string }> {
  return apiWrite(`${BASE}/budget-periods`, 'POST', payload);
}

export async function updateBudgetPeriod(id: number, payload: Partial<CreateBudgetPeriodPayload>): Promise<{ data: BudgetWorkspace; message: string }> {
  return apiWrite(`${BASE}/budget-periods/${id}`, 'PUT', payload);
}

export async function allocateBudgetPeriod(id: number, totalIncome?: number): Promise<{ data: BudgetWorkspace; message: string }> {
  return apiWrite(`${BASE}/budget-periods/${id}/allocate`, 'POST', totalIncome ? { total_income: totalIncome } : {});
}

export async function overrideJarPercent(periodId: number, jarId: number, percent: number): Promise<{ data: unknown; message: string }> {
  return apiWrite(`${BASE}/budget-periods/${periodId}/jar-override/${jarId}`, 'PUT', { percent });
}

export async function closeBudgetPeriod(id: number): Promise<{ data: BudgetWorkspace; message: string }> {
  return apiWrite(`${BASE}/budget-periods/${id}/close`, 'POST');
}

// ---------------------------------------------------------------
// Debts (Nợ)
// ---------------------------------------------------------------

export async function fetchDebts(status?: string): Promise<DebtsResponse> {
  const qs = status ? `?status=${encodeURIComponent(status)}` : '';
  return smartFetch(`${BASE}/debts${qs}`);
}

export async function fetchDebt(id: number): Promise<DebtDetailResponse> {
  return smartFetch(`${BASE}/debts/${id}`);
}

export async function createDebt(payload: CreateDebtPayload): Promise<{ data: Debt; message: string }> {
  return apiWrite(`${BASE}/debts`, 'POST', payload);
}

export async function updateDebt(id: number, payload: Partial<CreateDebtPayload>): Promise<{ data: Debt; message: string }> {
  return apiWrite(`${BASE}/debts/${id}`, 'PUT', payload);
}

export async function deleteDebt(id: number): Promise<{ message: string }> {
  return apiWrite(`${BASE}/debts/${id}`, 'DELETE');
}

export async function payDebt(id: number, payload: PayDebtPayload): Promise<{ data: Debt; message: string }> {
  return apiWrite(`${BASE}/debts/${id}/pay`, 'POST', payload);
}

// ---------------------------------------------------------------
// Recurring Bills (Hoá đơn định kỳ)
// ---------------------------------------------------------------

export async function fetchRecurringBills(): Promise<RecurringBillsResponse> {
  return smartFetch(`${BASE}/recurring-bills`);
}

export async function createRecurringBill(payload: CreateRecurringBillPayload): Promise<{ data: RecurringBill; message: string }> {
  return apiWrite(`${BASE}/recurring-bills`, 'POST', payload);
}

export async function updateRecurringBill(id: number, payload: Partial<CreateRecurringBillPayload>): Promise<{ data: RecurringBill; message: string }> {
  return apiWrite(`${BASE}/recurring-bills/${id}`, 'PUT', payload);
}

export async function deleteRecurringBill(id: number): Promise<{ message: string }> {
  return apiWrite(`${BASE}/recurring-bills/${id}`, 'DELETE');
}

// ---------------------------------------------------------------
// Scenarios (Kịch bản)
// ---------------------------------------------------------------

export async function fetchScenarios(): Promise<ScenariosResponse> {
  return smartFetch(`${BASE}/scenarios`);
}

export async function simulateScenario(payload: SimulateScenarioPayload): Promise<{ data: Scenario; message: string }> {
  return apiWrite(`${BASE}/scenarios/simulate`, 'POST', payload);
}

// ---------------------------------------------------------------
// Budget Lines (Mục chi tiêu)
// ---------------------------------------------------------------

export async function fetchBudgetLines(periodId: number): Promise<BudgetLinesResponse> {
  return smartFetch(`${BASE}/budget-periods/${periodId}/lines`);
}

export async function createBudgetLine(payload: CreateBudgetLinePayload): Promise<{ data: BudgetLine; message: string }> {
  return apiWrite(`${BASE}/budget-lines`, 'POST', payload);
}

export async function updateBudgetLine(id: number, payload: Partial<CreateBudgetLinePayload>): Promise<{ data: BudgetLine; message: string }> {
  return apiWrite(`${BASE}/budget-lines/${id}`, 'PUT', payload);
}

export async function deleteBudgetLine(id: number): Promise<{ message: string }> {
  return apiWrite(`${BASE}/budget-lines/${id}`, 'DELETE');
}
