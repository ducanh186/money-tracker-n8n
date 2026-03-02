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
