import { useState, useEffect, useCallback } from 'react';
import { fetchTransactions } from './api';
import type { TransactionsResponse, TransactionsQuery } from './types';

interface UseTransactionsReturn {
  data: TransactionsResponse | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook that fetches transactions from the API whenever params change.
 */
export function useTransactions(params: TransactionsQuery): UseTransactionsReturn {
  const [data, setData] = useState<TransactionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const key = JSON.stringify(params);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchTransactions(params);
      setData(result);
    } catch (err: any) {
      setError(err.message ?? 'Lỗi khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, refetch: load };
}
