import type {
  TransactionsResponse,
  TransactionDetailResponse,
  TransactionsQuery,
  BudgetPlanResponse,
} from './types';

// Base URL — in dev the Vite proxy forwards /api → Laravel at :8000
const BASE = '/api';

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

  const res = await fetch(`${BASE}/transactions?${qs.toString()}`);
  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${res.statusText}`);
  }
  return res.json();
}

/**
 * Fetch a single transaction by idempotency_key.
 */
export async function fetchTransactionDetail(
  idempotencyKey: string,
): Promise<TransactionDetailResponse> {
  const res = await fetch(
    `${BASE}/transactions/${encodeURIComponent(idempotencyKey)}`,
  );
  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${res.statusText}`);
  }
  return res.json();
}

/**
 * Fetch budget plan comparison for a given month.
 */
export async function fetchBudgetPlan(
  month: string,
): Promise<BudgetPlanResponse> {
  const res = await fetch(`${BASE}/budget-plan?month=${encodeURIComponent(month)}`);
  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${res.statusText}`);
  }
  return res.json();
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
