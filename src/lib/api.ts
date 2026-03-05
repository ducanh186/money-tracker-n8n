import type {
  TransactionsResponse,
  TransactionDetailResponse,
  TransactionsQuery,
  BudgetPlanResponse,
  DashboardSummaryResponse,
  SyncStatusResponse,
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
): Promise<BudgetPlanResponse> {
  return smartFetch(`${BASE}/budget-plan?month=${encodeURIComponent(month)}`);
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
