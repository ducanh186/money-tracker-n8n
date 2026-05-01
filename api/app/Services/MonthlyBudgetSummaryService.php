<?php

namespace App\Services;

use App\Contracts\TransactionsRepositoryInterface;
use App\Models\BudgetLine;
use App\Models\BudgetPeriod;
use App\Models\BudgetSetting;
use App\Models\Fund;
use App\Models\Jar;
use App\Models\JarAllocation;
use App\Support\BudgetMonth;
use App\Support\MoneyAmount;
use App\Support\TransactionFilters;

class MonthlyBudgetSummaryService
{
    public function __construct(
        private readonly TransactionsRepositoryInterface $repository,
        private readonly BalanceService $balanceService,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function summary(string $monthValue): array
    {
        $month = BudgetMonth::parse($monthValue);
        $rows = $this->rowsForMonth($month);
        $totals = $this->actualTotals($rows);
        $period = $this->periodFor($month);
        $expectedIncome = $this->expectedIncomeForMonth($monthValue);
        $balance = $this->balanceService->forMonth($monthValue);

        $jarMetrics = $period
            ? $this->periodJarMetrics($period, $totals['expense_by_jar'])
            : $this->defaultJarMetrics($expectedIncome, $totals['expense_by_jar']);

        $budgeted = (int) array_sum(array_column($jarMetrics, 'planned'));
        $reserved = (int) array_sum(array_column($jarMetrics, 'reserved'));
        $available = (int) array_sum(array_column($jarMetrics, 'available'));
        $overspent = array_values(array_filter(array_map(function (array $jar) {
            if ($jar['spent'] <= $jar['planned']) {
                return null;
            }

            return [
                'key' => $jar['key'],
                'label' => $jar['label'],
                'over' => $jar['spent'] - $jar['planned'],
            ];
        }, $jarMetrics)));

        $leftToBudget = $expectedIncome - $budgeted;

        return [
            'month' => $monthValue,
            'canonical_month' => $month->canonical(),
            'month_iso' => $month->iso(),
            'expected_income_vnd' => $expectedIncome,
            'actual_income_vnd' => $totals['income_vnd'],
            'actual_expense_vnd' => $totals['expense_vnd'],
            'budgeted_vnd' => $budgeted,
            'spent_vnd' => $totals['expense_vnd'],
            'reserved_vnd' => $reserved,
            'remaining_vnd' => $available,
            'available_to_spend_vnd' => $available,
            'left_to_budget_vnd' => $leftToBudget,
            'account_balance_vnd' => $balance['account_balance_vnd'],
            'ending_balance_vnd' => $balance['ending_balance_vnd'],
            'opening_balance_vnd' => $balance['opening_balance_vnd'],
            'balance_source' => $balance['source'],

            // Compatibility fields used by existing web/mobile clients.
            'income' => $expectedIncome,
            'sheet_income' => $totals['income_vnd'],
            'assigned' => $budgeted,
            'unassigned' => $leftToBudget,
            'committed' => $reserved,
            'total_spent' => $totals['expense_vnd'],
            'available_to_spend' => $available,
            'overspent_jars' => $overspent,
            'period_status' => $period ? ($period->status ?? 'open') : 'needs_plan',
            'planning_insights_enabled' => $period !== null && $budgeted > 0,
            'has_period' => $period !== null,
            'jars' => $jarMetrics,
            'categories' => $this->categoryCompatibility($jarMetrics),
        ];
    }

    public function expectedIncomeForMonth(string $monthValue): int
    {
        $month = BudgetMonth::parse($monthValue);
        $period = $this->periodFor($month);
        if ($period && $period->total_income > 0) {
            return (int) $period->total_income;
        }

        $setting = $this->settingFor($month);
        if ($setting && $setting->base_income_override !== null) {
            return (int) $setting->base_income_override;
        }

        $previous = $month->previous();
        $previousPeriod = $this->periodFor($previous);
        if ($previousPeriod && $previousPeriod->total_income > 0) {
            return (int) $previousPeriod->total_income;
        }

        $previousSetting = $this->settingFor($previous);
        if ($previousSetting && $previousSetting->base_income_override !== null) {
            return (int) $previousSetting->base_income_override;
        }

        return (int) config('budget_plan.base_income', 13_600_000);
    }

    /**
     * @param  array<int, array<string, mixed>>  $rows
     * @return array{income_vnd:int, expense_vnd:int, expense_by_jar:array<string, int>}
     */
    private function actualTotals(array $rows): array
    {
        $income = 0;
        $expense = 0;
        $expenseByJar = [];

        foreach ($rows as $row) {
            if (TransactionFilters::isLoan($row)) {
                continue;
            }

            $direction = MoneyAmount::direction($row);
            $amount = MoneyAmount::amountAbsVnd($row);

            if ($direction === 'income') {
                $income += $amount;
            } elseif ($direction === 'expense') {
                $expense += $amount;
                $jarKey = trim((string) ($row['jar'] ?? ''));
                if ($jarKey !== '') {
                    $expenseByJar[$jarKey] = ($expenseByJar[$jarKey] ?? 0) + $amount;
                }
            }
        }

        return [
            'income_vnd' => $income,
            'expense_vnd' => $expense,
            'expense_by_jar' => $expenseByJar,
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function rowsForMonth(BudgetMonth $month): array
    {
        $rows = array_values(array_filter(
            $this->repository->all(),
            fn (array $row) => MoneyAmount::rowBelongsToMonth($row, $month)
        ));

        if ($rows !== []) {
            return $rows;
        }

        return $this->repository->getByMonth($month->canonical());
    }

    private function periodFor(BudgetMonth $month): ?BudgetPeriod
    {
        return BudgetPeriod::query()
            ->where('year', $month->year)
            ->where('month_num', $month->monthNum)
            ->first();
    }

    private function settingFor(BudgetMonth $month): ?BudgetSetting
    {
        return BudgetSetting::query()
            ->whereIn('month', [$month->canonical(), $month->iso()])
            ->first();
    }

    /**
     * @param  array<string, int>  $expenseByJar
     * @return array<int, array<string, mixed>>
     */
    private function periodJarMetrics(BudgetPeriod $period, array $expenseByJar): array
    {
        return $period->jarAllocations()
            ->with(['jar', 'budgetLines'])
            ->get()
            ->map(fn (JarAllocation $allocation) => $this->jarMetric(
                key: $allocation->jar->key,
                label: $allocation->jar->label,
                planned: (int) $allocation->planned_amount,
                reserved: $this->reservedAmount($allocation),
                spent: $expenseByJar[$allocation->jar->key] ?? ($expenseByJar[$allocation->jar->label] ?? 0),
                rollover: (int) $allocation->rollover_amount,
                fundsCount: Fund::query()->where('jar_id', $allocation->jar_id)->where('status', 'active')->count(),
            ))
            ->values()
            ->all();
    }

    /**
     * @param  array<string, int>  $expenseByJar
     * @return array<int, array<string, mixed>>
     */
    private function defaultJarMetrics(int $expectedIncome, array $expenseByJar): array
    {
        return Jar::active()
            ->ordered()
            ->get()
            ->map(fn (Jar $jar) => $this->jarMetric(
                key: $jar->key,
                label: $jar->label,
                planned: (int) round($expectedIncome * ((float) $jar->percent) / 100),
                reserved: 0,
                spent: $expenseByJar[$jar->key] ?? ($expenseByJar[$jar->label] ?? 0),
                rollover: 0,
                fundsCount: Fund::query()->where('jar_id', $jar->id)->where('status', 'active')->count(),
            ))
            ->values()
            ->all();
    }

    private function reservedAmount(JarAllocation $allocation): int
    {
        if ($allocation->budgetLines->isEmpty()) {
            return (int) $allocation->committed_amount;
        }

        return (int) $allocation->budgetLines
            ->whereIn('type', BudgetLine::RESERVED_TYPES)
            ->sum('planned_amount');
    }

    /**
     * @return array<string, mixed>
     */
    private function jarMetric(string $key, string $label, int $planned, int $reserved, int $spent, int $rollover, int $fundsCount): array
    {
        $available = $planned + $rollover - $spent - $reserved;

        return [
            'key' => $key,
            'label' => $label,
            'planned' => $planned,
            'budgeted_vnd' => $planned,
            'committed' => $reserved,
            'reserved' => $reserved,
            'reserved_vnd' => $reserved,
            'spent' => $spent,
            'spent_vnd' => $spent,
            'available' => $available,
            'available_vnd' => $available,
            'remaining_vnd' => $available,
            'rollover' => $rollover,
            'funds_count' => $fundsCount,
            'usage_pct' => $planned > 0 ? round(($spent / $planned) * 100, 2) : 0,
            'status' => $spent > $planned ? 'OVER' : 'OK',
        ];
    }

    /**
     * @param  array<int, array<string, mixed>>  $jars
     * @return array<int, array<string, mixed>>
     */
    private function categoryCompatibility(array $jars): array
    {
        return array_map(fn (array $jar) => [
            'category_key' => mb_strtolower($jar['key']),
            'category_name' => $jar['label'],
            'budgeted_vnd' => $jar['planned'],
            'spent_vnd' => $jar['spent'],
            'reserved_vnd' => $jar['reserved'],
            'remaining_vnd' => $jar['available'],
            'usage_pct' => $jar['usage_pct'],
            'status' => $jar['status'],
        ], $jars);
    }
}
