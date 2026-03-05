import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import {
  fetchTransactions,
  fetchBudgetPlan,
  fetchDashboardSummary,
  fetchSyncStatus,
  triggerSync,
} from './api';
import type { TransactionsQuery } from './types';

// ---------------------------------------------------------------
// Retry logic: max 2 retries
// ---------------------------------------------------------------
const MAX_RETRIES = 2;

// ---------------------------------------------------------------
// Dashboard Summary Hook (lightweight — use for Overview page)
// ---------------------------------------------------------------
/**
 * Fetches dashboard summary with:
 * - 60s staleTime (won't refetch for 60s after success)
 * - 60s polling when tab is visible
 * - No refetch on window focus (controlled polling instead)
 */
export function useDashboardSummary(month: string) {
  return useQuery({
    queryKey: ['dashboard-summary', month],
    queryFn: () => fetchDashboardSummary(month),
    staleTime: 60_000, // Data fresh for 60s
    gcTime: 5 * 60_000, // Keep in cache 5 min
    refetchInterval: 60_000, // Poll every 60s
    refetchIntervalInBackground: false, // Stop polling when tab hidden
    refetchOnWindowFocus: false, // Don't auto-refetch on tab switch
    retry: MAX_RETRIES,
  });
}

// ---------------------------------------------------------------
// Transactions Hook (detail — paginated, on-demand)
// ---------------------------------------------------------------
/**
 * Fetches paginated transactions when user views transaction list.
 * - 30s staleTime
 * - NO automatic polling (user triggers via pagination/filter)
 * - No refetch on window focus
 */
export function useTransactions(params: TransactionsQuery) {
  const key = JSON.stringify(params);

  return useQuery({
    queryKey: ['transactions', key],
    queryFn: () => fetchTransactions(params),
    staleTime: 30_000,
    gcTime: 3 * 60_000,
    refetchOnWindowFocus: false,
    retry: MAX_RETRIES,
  });
}

// ---------------------------------------------------------------
// Budget Plan Hook
// ---------------------------------------------------------------
/**
 * Budget plan data — cached aggressively since it changes rarely.
 * - 2 min staleTime
 * - No polling (user triggers "Làm mới" manually)
 */
export function useBudgetPlan(month: string) {
  return useQuery({
    queryKey: ['budget-plan', month],
    queryFn: () => fetchBudgetPlan(month),
    staleTime: 2 * 60_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    retry: MAX_RETRIES,
  });
}

// ---------------------------------------------------------------
// Sync Status Hook
// ---------------------------------------------------------------
export function useSyncStatus() {
  return useQuery({
    queryKey: ['sync-status'],
    queryFn: fetchSyncStatus,
    staleTime: 30_000,
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
    retry: MAX_RETRIES,
  });
}

// ---------------------------------------------------------------
// Manual Sync Trigger
// ---------------------------------------------------------------
export function useTriggerSync() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: triggerSync,
    onSuccess: () => {
      // Invalidate all data caches after sync so they refetch fresh data
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['budget-plan'] });
      queryClient.invalidateQueries({ queryKey: ['sync-status'] });
    },
  });
}

// ---------------------------------------------------------------
// Invalidation helpers (call after mutations)
// ---------------------------------------------------------------
export function useInvalidateAfterWrite() {
  const queryClient = useQueryClient();

  return {
    /** Invalidate transaction-related queries after creating/editing a transaction */
    invalidateTransactions: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      queryClient.invalidateQueries({ queryKey: ['budget-plan'] });
    },
    /** Invalidate a specific query family */
    invalidate: (key: string) => {
      queryClient.invalidateQueries({ queryKey: [key] });
    },
  };
}
