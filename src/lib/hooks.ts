import { useState, useEffect } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import {
  fetchTransactions,
  fetchBudgetPlan,
  fetchDashboardSummary,
  fetchSyncStatus,
  triggerSync,
  fetchGoals,
  fetchGoal,
  createGoal,
  updateGoal,
  deleteGoal,
  contributeToGoal,
  fetchAccounts,
  fetchNetWorth,
  createAccount,
  fetchTransfers,
  createTransfer,
  fetchJars,
  updateJar,
  fetchBudgetStatus,
  fetchBalances,
  fetchMonthlySummary,
  fetchCategories,
  fetchCategoryBudgets,
  createCategoryBudget,
  updateCategoryBudget,
  fetchBudgetTemplates,
  fetchFunds,
  createFund,
  updateFund,
  deleteFund,
  reserveFund,
  spendFund,
  fetchInvestmentSummary,
  fetchBudgetPeriods,
  fetchBudgetPeriod,
  createBudgetPeriod,
  updateBudgetPeriod,
  allocateBudgetPeriod,
  overrideJarPercent,
  closeBudgetPeriod,
  fetchBudgetSetting,
  updateBudgetSetting,
  fetchDebts,
  fetchDebt,
  createDebt,
  updateDebt,
  deleteDebt,
  payDebt,
  fetchRecurringBills,
  createRecurringBill,
  updateRecurringBill,
  deleteRecurringBill,
  fetchScenarios,
  simulateScenario,
  fetchBudgetLines,
  createBudgetLine,
  updateBudgetLine,
  deleteBudgetLine,
} from './api';
import type {
  TransactionsQuery,
  CreateGoalPayload,
  ContributePayload,
  CreateAccountPayload,
  CreateTransferPayload,
  CreateFundPayload,
  CreateBudgetPeriodPayload,
  CreateDebtPayload,
  PayDebtPayload,
  CreateRecurringBillPayload,
  SimulateScenarioPayload,
  CreateBudgetLinePayload,
  CreateCategoryBudgetPayload,
} from './types';

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
export function useBudgetPlan(month: string, baseIncome?: number | null) {
  return useQuery({
    queryKey: ['budget-plan', month, baseIncome ?? 'default'],
    queryFn: () => fetchBudgetPlan(month, baseIncome),
    staleTime: 2 * 60_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    retry: MAX_RETRIES,
  });
}

// ---------------------------------------------------------------
// Budget Setting Hook (per-month base_income override)
// ---------------------------------------------------------------
export function useBudgetSetting(month: string) {
  return useQuery({
    queryKey: ['budget-setting', month],
    queryFn: () => fetchBudgetSetting(month),
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
    refetchOnWindowFocus: false,
    retry: MAX_RETRIES,
  });
}

export function useUpdateBudgetSetting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ month, baseIncomeOverride }: { month: string; baseIncomeOverride: number | null }) =>
      updateBudgetSetting(month, { base_income_override: baseIncomeOverride }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['budget-setting', variables.month] });
      queryClient.invalidateQueries({ queryKey: ['budget-plan'] });
      queryClient.invalidateQueries({ queryKey: ['budget-status'] });
      queryClient.invalidateQueries({ queryKey: ['monthly-summary'] });
      queryClient.invalidateQueries({ queryKey: ['balances'] });
    },
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
      queryClient.invalidateQueries({ queryKey: ['budget-status'] });
      queryClient.invalidateQueries({ queryKey: ['monthly-summary'] });
      queryClient.invalidateQueries({ queryKey: ['balances'] });
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
      queryClient.invalidateQueries({ queryKey: ['budget-status'] });
      queryClient.invalidateQueries({ queryKey: ['monthly-summary'] });
      queryClient.invalidateQueries({ queryKey: ['balances'] });
    },
    /** Invalidate a specific query family */
    invalidate: (key: string) => {
      queryClient.invalidateQueries({ queryKey: [key] });
    },
  };
}

// ---------------------------------------------------------------
// Jars Hook
// ---------------------------------------------------------------
export function useJars() {
  return useQuery({
    queryKey: ['jars'],
    queryFn: fetchJars,
    staleTime: 5 * 60_000, // Jars rarely change
    gcTime: 10 * 60_000,
    refetchOnWindowFocus: false,
    retry: MAX_RETRIES,
  });
}

// ---------------------------------------------------------------
// Goals Hooks (Quỹ mục tiêu)
// ---------------------------------------------------------------

export function useGoals(status?: string) {
  return useQuery({
    queryKey: ['goals', status ?? 'all'],
    queryFn: () => fetchGoals(status),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    retry: MAX_RETRIES,
  });
}

export function useGoal(id: number | null) {
  return useQuery({
    queryKey: ['goal', id],
    queryFn: () => fetchGoal(id!),
    enabled: id !== null,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    retry: MAX_RETRIES,
  });
}

export function useCreateGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateGoalPayload) => createGoal(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });
}

export function useUpdateGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<CreateGoalPayload> }) =>
      updateGoal(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['goal'] });
    },
  });
}

export function useDeleteGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteGoal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });
}

export function useContributeGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ goalId, payload }: { goalId: number; payload: ContributePayload }) =>
      contributeToGoal(goalId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['goal'] });
      queryClient.invalidateQueries({ queryKey: ['budget-plan'] });
    },
  });
}

// ---------------------------------------------------------------
// Accounts Hooks (Tài khoản)
// ---------------------------------------------------------------

export function useAccounts() {
  return useQuery({
    queryKey: ['accounts'],
    queryFn: fetchAccounts,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    retry: MAX_RETRIES,
  });
}

export function useNetWorth() {
  return useQuery({
    queryKey: ['net-worth'],
    queryFn: fetchNetWorth,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    retry: MAX_RETRIES,
  });
}

export function useCreateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateAccountPayload) => createAccount(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['net-worth'] });
    },
  });
}

// ---------------------------------------------------------------
// Transfers Hooks (Chuyển khoản)
// ---------------------------------------------------------------

export function useTransfers(budgetPeriodId?: number) {
  return useQuery({
    queryKey: ['transfers', budgetPeriodId ?? 'all'],
    queryFn: () => fetchTransfers(budgetPeriodId),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    retry: MAX_RETRIES,
  });
}

export function useCreateTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTransferPayload) => createTransfer(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['net-worth'] });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['goal'] });
    },
  });
}

// ---------------------------------------------------------------
// Jar Update Hook
// ---------------------------------------------------------------
export function useUpdateJar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: { percent?: number; label?: string } }) =>
      updateJar(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jars'] });
      queryClient.invalidateQueries({ queryKey: ['budget-plan'] });
      queryClient.invalidateQueries({ queryKey: ['budget-status'] });
    },
  });
}

// ---------------------------------------------------------------
// Budget Status Hook (TopBar / global state)
// ---------------------------------------------------------------
export function useBudgetStatus(month: string) {
  return useQuery({
    queryKey: ['budget-status', month],
    queryFn: () => fetchBudgetStatus(month),
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
    retry: MAX_RETRIES,
  });
}

export function useBalances(month: string) {
  return useQuery({
    queryKey: ['balances', month],
    queryFn: () => fetchBalances(month),
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
    retry: MAX_RETRIES,
  });
}

export function useMonthlySummary(month: string) {
  return useQuery({
    queryKey: ['monthly-summary', month],
    queryFn: () => fetchMonthlySummary(month),
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
    retry: MAX_RETRIES,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => fetchCategories(),
    staleTime: 5 * 60_000,
    retry: MAX_RETRIES,
  });
}

export function useCategoryBudgets(month: string) {
  return useQuery({
    queryKey: ['category-budgets', month],
    queryFn: () => fetchCategoryBudgets(month),
    staleTime: 60_000,
    retry: MAX_RETRIES,
  });
}

export function useCreateCategoryBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCategoryBudget,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['category-budgets'] });
      queryClient.invalidateQueries({ queryKey: ['budget-plan'] });
      queryClient.invalidateQueries({ queryKey: ['budget-status'] });
      queryClient.invalidateQueries({ queryKey: ['monthly-summary'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
  });
}

export function useUpdateCategoryBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<CreateCategoryBudgetPayload> }) =>
      updateCategoryBudget(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['category-budgets'] });
      queryClient.invalidateQueries({ queryKey: ['budget-plan'] });
      queryClient.invalidateQueries({ queryKey: ['budget-status'] });
      queryClient.invalidateQueries({ queryKey: ['monthly-summary'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
  });
}

export function useBudgetTemplates() {
  return useQuery({
    queryKey: ['budget-templates'],
    queryFn: () => fetchBudgetTemplates(),
    staleTime: 5 * 60_000,
    retry: MAX_RETRIES,
  });
}

// ---------------------------------------------------------------
// Funds Hooks (Quỹ con)
// ---------------------------------------------------------------

export function useFunds(jarId?: number) {
  return useQuery({
    queryKey: ['funds', jarId ?? 'all'],
    queryFn: () => fetchFunds(jarId),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    retry: MAX_RETRIES,
  });
}

export function useCreateFund() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateFundPayload) => createFund(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funds'] });
      queryClient.invalidateQueries({ queryKey: ['budget-status'] });
    },
  });
}

export function useUpdateFund() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<CreateFundPayload> }) =>
      updateFund(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funds'] });
      queryClient.invalidateQueries({ queryKey: ['budget-status'] });
    },
  });
}

export function useDeleteFund() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteFund(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funds'] });
      queryClient.invalidateQueries({ queryKey: ['budget-status'] });
    },
  });
}

export function useReserveFund() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, amount }: { id: number; amount: number }) => reserveFund(id, amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funds'] });
      queryClient.invalidateQueries({ queryKey: ['budget-status'] });
    },
  });
}

export function useSpendFund() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, amount, description }: { id: number; amount: number; description?: string }) =>
      spendFund(id, amount, description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funds'] });
      queryClient.invalidateQueries({ queryKey: ['budget-status'] });
    },
  });
}

// ---------------------------------------------------------------
// Investment Summary Hook
// ---------------------------------------------------------------

export function useInvestmentSummary(month?: string) {
  return useQuery({
    queryKey: ['investment-summary', month ?? 'all'],
    queryFn: () => fetchInvestmentSummary(month),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    retry: MAX_RETRIES,
  });
}

// ---------------------------------------------------------------
// Budget Period Hooks (Kỳ ngân sách)
// ---------------------------------------------------------------

export function useBudgetPeriods() {
  return useQuery({
    queryKey: ['budget-periods'],
    queryFn: fetchBudgetPeriods,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    retry: MAX_RETRIES,
  });
}

export function useBudgetPeriod(id: number | null) {
  return useQuery({
    queryKey: ['budget-period', id],
    queryFn: () => fetchBudgetPeriod(id!),
    enabled: id !== null,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    retry: MAX_RETRIES,
  });
}

export function useCreateBudgetPeriod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateBudgetPeriodPayload) => createBudgetPeriod(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-periods'] });
      queryClient.invalidateQueries({ queryKey: ['budget-period'] });
      queryClient.invalidateQueries({ queryKey: ['budget-lines'] });
      queryClient.invalidateQueries({ queryKey: ['budget-status'] });
      queryClient.invalidateQueries({ queryKey: ['budget-plan'] });
    },
  });
}

export function useAllocateBudgetPeriod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, totalIncome }: { id: number; totalIncome?: number }) =>
      allocateBudgetPeriod(id, totalIncome),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-periods'] });
      queryClient.invalidateQueries({ queryKey: ['budget-period'] });
      queryClient.invalidateQueries({ queryKey: ['budget-status'] });
      queryClient.invalidateQueries({ queryKey: ['budget-plan'] });
    },
  });
}

export function useOverrideJarPercent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ periodId, jarId, percent }: { periodId: number; jarId: number; percent: number }) =>
      overrideJarPercent(periodId, jarId, percent),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-periods'] });
      queryClient.invalidateQueries({ queryKey: ['budget-period'] });
      queryClient.invalidateQueries({ queryKey: ['budget-status'] });
      queryClient.invalidateQueries({ queryKey: ['budget-plan'] });
    },
  });
}

export function useCloseBudgetPeriod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => closeBudgetPeriod(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-periods'] });
      queryClient.invalidateQueries({ queryKey: ['budget-period'] });
      queryClient.invalidateQueries({ queryKey: ['budget-status'] });
    },
  });
}

// ---------------------------------------------------------------
// Debt Hooks
// ---------------------------------------------------------------

export function useDebts(status?: string) {
  return useQuery({
    queryKey: ['debts', status],
    queryFn: () => fetchDebts(status),
    staleTime: 60_000,
    retry: MAX_RETRIES,
  });
}

export function useDebt(id: number) {
  return useQuery({
    queryKey: ['debt', id],
    queryFn: () => fetchDebt(id),
    staleTime: 30_000,
    retry: MAX_RETRIES,
  });
}

export function useCreateDebt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateDebtPayload) => createDebt(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debts'] });
    },
  });
}

export function useUpdateDebt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<CreateDebtPayload> }) => updateDebt(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      queryClient.invalidateQueries({ queryKey: ['debt'] });
    },
  });
}

export function useDeleteDebt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteDebt(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debts'] });
    },
  });
}

export function usePayDebt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: PayDebtPayload }) => payDebt(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      queryClient.invalidateQueries({ queryKey: ['debt'] });
      queryClient.invalidateQueries({ queryKey: ['budget-status'] });
    },
  });
}

// ---------------------------------------------------------------
// Recurring Bill Hooks
// ---------------------------------------------------------------

export function useRecurringBills() {
  return useQuery({
    queryKey: ['recurring-bills'],
    queryFn: () => fetchRecurringBills(),
    staleTime: 60_000,
    retry: MAX_RETRIES,
  });
}

export function useCreateRecurringBill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateRecurringBillPayload) => createRecurringBill(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-bills'] });
    },
  });
}

export function useUpdateRecurringBill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<CreateRecurringBillPayload> }) => updateRecurringBill(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-bills'] });
    },
  });
}

export function useDeleteRecurringBill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteRecurringBill(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-bills'] });
    },
  });
}

// ---------------------------------------------------------------
// Scenario Hooks
// ---------------------------------------------------------------

export function useScenarios() {
  return useQuery({
    queryKey: ['scenarios'],
    queryFn: () => fetchScenarios(),
    staleTime: 60_000,
    retry: MAX_RETRIES,
  });
}

export function useSimulateScenario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SimulateScenarioPayload) => simulateScenario(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scenarios'] });
    },
  });
}

// ---------------------------------------------------------------
// Budget Line Hooks
// ---------------------------------------------------------------

export function useBudgetLines(periodId: number) {
  return useQuery({
    queryKey: ['budget-lines', periodId],
    queryFn: () => fetchBudgetLines(periodId),
    staleTime: 30_000,
    retry: MAX_RETRIES,
    enabled: periodId > 0,
  });
}

export function useCreateBudgetLine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateBudgetLinePayload) => createBudgetLine(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-lines'] });
      queryClient.invalidateQueries({ queryKey: ['budget-period'] });
      queryClient.invalidateQueries({ queryKey: ['budget-status'] });
    },
  });
}

export function useUpdateBudgetLine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<CreateBudgetLinePayload> }) => updateBudgetLine(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-lines'] });
      queryClient.invalidateQueries({ queryKey: ['budget-period'] });
      queryClient.invalidateQueries({ queryKey: ['budget-status'] });
    },
  });
}

export function useDeleteBudgetLine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteBudgetLine(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-lines'] });
      queryClient.invalidateQueries({ queryKey: ['budget-period'] });
      queryClient.invalidateQueries({ queryKey: ['budget-status'] });
    },
  });
}

// ---------------------------------------------------------------
// Dark Mode Hook — reactive, watches documentElement class changes
// ---------------------------------------------------------------
export function useDarkMode(): boolean {
  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains('dark')
  );
  useEffect(() => {
    const obs = new MutationObserver(() =>
      setIsDark(document.documentElement.classList.contains('dark'))
    );
    obs.observe(document.documentElement, { attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);
  return isDark;
}
