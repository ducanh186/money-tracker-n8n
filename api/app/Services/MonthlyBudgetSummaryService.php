<?php

namespace App\Services;

use App\Contracts\TransactionsRepositoryInterface;
use App\Models\BudgetLine;
use App\Models\BudgetPeriod;
use App\Models\BudgetSetting;
use App\Models\Category;
use App\Models\CategoryBudget;
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
        $categoryMetrics = $this->categoryMetrics($period, $totals['expense_by_category']);
        $hasCategoryBudgets = $period !== null && $period->categoryBudgets()->exists();

        $summaryMetrics = $hasCategoryBudgets ? $categoryMetrics : $jarMetrics;
        $budgeted = (int) array_sum(array_column($summaryMetrics, 'budgeted_vnd'));
        $reserved = (int) array_sum(array_column($summaryMetrics, 'reserved_vnd'));
        $available = (int) array_sum(array_column($summaryMetrics, 'remaining_vnd'));
        $overspent = array_values(array_filter(array_map(function (array $item) {
            $budgeted = $item['budgeted_vnd'] ?? $item['planned'] ?? 0;
            $spent = $item['spent_vnd'] ?? $item['spent'] ?? 0;
            if ($spent <= $budgeted) {
                return null;
            }

            return [
                'key' => $item['category_key'] ?? $item['key'],
                'label' => $item['category_name'] ?? $item['label'],
                'over' => $spent - $budgeted,
            ];
        }, $summaryMetrics)));

        $leftToBudget = $expectedIncome - $budgeted;
        $hasPeriod = $period !== null;
        $periodStatus = $hasPeriod ? ($period->status ?? 'open') : 'needs_plan';
        $budgetBasis = $hasCategoryBudgets ? 'category' : 'jar_compatibility';

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
            'account' => [
                'opening_balance_vnd' => $balance['opening_balance_vnd'],
                'ending_balance_vnd' => $balance['ending_balance_vnd'],
                'account_balance_vnd' => $balance['account_balance_vnd'],
                'balance_source' => $balance['source'],
            ],
            'actuals' => [
                'income_vnd' => $totals['income_vnd'],
                'expense_vnd' => $totals['expense_vnd'],
                'spent_vnd' => $totals['expense_vnd'],
                'reserved_vnd' => 0,
            ],
            'plan' => [
                'has_period' => $hasPeriod,
                'status' => $periodStatus,
                'income_vnd' => $hasPeriod ? $expectedIncome : null,
                'assigned_vnd' => $hasPeriod ? $budgeted : null,
                'unassigned_vnd' => $hasPeriod ? $leftToBudget : null,
                'committed_vnd' => $hasPeriod ? $reserved : null,
                'available_to_spend_vnd' => $hasPeriod ? $available : null,
                'budget_basis' => $hasPeriod ? $budgetBasis : null,
                'jars' => $hasPeriod ? $jarMetrics : [],
                'categories' => $hasPeriod ? $categoryMetrics : [],
            ],
            'suggestion' => [
                'enabled' => !$hasPeriod,
                'source' => !$hasPeriod ? $budgetBasis : null,
                'expected_income_vnd' => !$hasPeriod ? $expectedIncome : null,
                'budgeted_vnd' => !$hasPeriod ? $budgeted : null,
                'reserved_vnd' => !$hasPeriod ? $reserved : null,
                'remaining_vnd' => !$hasPeriod ? $available : null,
                'available_to_spend_vnd' => !$hasPeriod ? $available : null,
                'left_to_budget_vnd' => !$hasPeriod ? $leftToBudget : null,
                'jars' => !$hasPeriod ? $jarMetrics : [],
                'categories' => !$hasPeriod ? $categoryMetrics : [],
            ],

            // Compatibility fields used by existing web/mobile clients.
            'income' => $expectedIncome,
            'sheet_income' => $totals['income_vnd'],
            'assigned' => $hasPeriod ? $budgeted : null,
            'unassigned' => $hasPeriod ? $leftToBudget : null,
            'committed' => $hasPeriod ? $reserved : null,
            'total_spent' => $totals['expense_vnd'],
            'available_to_spend' => $hasPeriod ? $available : null,
            'overspent_jars' => $overspent,
            'period_status' => $periodStatus,
            'planning_insights_enabled' => $hasPeriod && $budgeted > 0,
            'has_period' => $hasPeriod,
            'jars' => $jarMetrics,
            'categories' => $categoryMetrics,
            'budget_basis' => $budgetBasis,
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
     * @return array{income_vnd:int, expense_vnd:int, expense_by_jar:array<string, int>, expense_by_category:array<string, int>}
     */
    private function actualTotals(array $rows): array
    {
        $income = 0;
        $expense = 0;
        $expenseByJar = [];
        $expenseByCategory = [];

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
                $categoryKey = Category::normalizeKey((string) ($row['category'] ?? ''));
                $expenseByCategory[$categoryKey] = ($expenseByCategory[$categoryKey] ?? 0) + $amount;
            }
        }

        return [
            'income_vnd' => $income,
            'expense_vnd' => $expense,
            'expense_by_jar' => $expenseByJar,
            'expense_by_category' => $expenseByCategory,
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
     * @param  array<string, int>  $expenseByCategory
     * @return array<int, array<string, mixed>>
     */
    private function categoryMetrics(?BudgetPeriod $period, array $expenseByCategory): array
    {
        $categories = Category::active()->ordered()->get();
        $budgets = $period
            ? CategoryBudget::query()
                ->where('budget_period_id', $period->id)
                ->with('category')
                ->get()
                ->keyBy(fn (CategoryBudget $budget) => $budget->category?->key)
            : collect();

        $metrics = $categories->map(function (Category $category) use ($budgets, $expenseByCategory) {
            /** @var CategoryBudget|null $budget */
            $budget = $budgets->get($category->key);
            $budgeted = (int) ($budget?->budgeted_amount ?? 0);
            $reserved = (int) ($budget?->reserved_amount ?? 0);
            $rollover = (int) ($budget?->rollover_amount ?? 0);
            $spent = (int) ($expenseByCategory[$category->key] ?? 0);
            $remaining = $budgeted + $rollover - $spent - $reserved;

            return [
                'category_key' => $category->key,
                'category_name' => $category->name,
                'category_group' => $category->group,
                'budgeted_vnd' => $budgeted,
                'spent_vnd' => $spent,
                'reserved_vnd' => $reserved,
                'rollover_vnd' => $rollover,
                'remaining_vnd' => $remaining,
                'usage_pct' => $budgeted > 0 ? round(($spent / $budgeted) * 100, 2) : 0,
                'status' => $spent > $budgeted && $budgeted > 0 ? 'OVER' : 'OK',
                'source' => $budget ? 'category_budget' : 'actual_category',
            ];
        });

        $knownKeys = $categories->pluck('key')->all();
        foreach ($expenseByCategory as $key => $spent) {
            if (in_array($key, $knownKeys, true)) {
                continue;
            }

            $metrics->push([
                'category_key' => $key,
                'category_name' => $key,
                'category_group' => 'other',
                'budgeted_vnd' => 0,
                'spent_vnd' => (int) $spent,
                'reserved_vnd' => 0,
                'rollover_vnd' => 0,
                'remaining_vnd' => -1 * (int) $spent,
                'usage_pct' => 0,
                'status' => 'OK',
                'source' => 'actual_category',
            ]);
        }

        return $metrics->values()->all();
    }
}
