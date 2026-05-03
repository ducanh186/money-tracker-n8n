<?php

namespace App\Services;

use App\Contracts\TransactionsRepositoryInterface;
use App\Models\BudgetPeriod;
use App\Models\Category;
use App\Models\CategoryBudget;
use App\Models\JarAllocation;
use App\Support\BudgetMonth;
use App\Support\MoneyAmount;
use App\Support\TransactionFilters;
use Illuminate\Support\Facades\DB;

class BudgetRolloverService
{
    public function __construct(
        private readonly TransactionsRepositoryInterface $repository,
    ) {}

    /**
     * Carry forward unspent budgets from the most recent prior period
     * into the given new period as rollover amounts.
     *
     * For each jar/category, rollover = max(0, planned + prior_rollover - spent).
     */
    public function carryForward(BudgetPeriod $newPeriod): void
    {
        $prior = $this->findPriorPeriod($newPeriod);
        if (! $prior) {
            return;
        }

        $month = BudgetMonth::fromYearMonth($prior->year, $prior->month_num);
        $expensesByJar = [];
        $expensesByCategory = [];
        foreach ($this->rowsForMonth($month) as $row) {
            if (TransactionFilters::isLoan($row)) {
                continue;
            }
            if (MoneyAmount::direction($row) !== 'expense') {
                continue;
            }
            $amount = MoneyAmount::amountAbsVnd($row);
            $jarKey = trim((string) ($row['jar'] ?? ''));
            if ($jarKey !== '') {
                $expensesByJar[$jarKey] = ($expensesByJar[$jarKey] ?? 0) + $amount;
            }
            $categoryKey = Category::normalizeKey((string) ($row['category'] ?? ''));
            $expensesByCategory[$categoryKey] = ($expensesByCategory[$categoryKey] ?? 0) + $amount;
        }

        DB::transaction(function () use ($prior, $newPeriod, $expensesByJar, $expensesByCategory) {
            foreach ($prior->jarAllocations()->with('jar')->get() as $priorAlloc) {
                $jarKey = $priorAlloc->jar->key;
                $spent = $expensesByJar[$jarKey] ?? 0;
                $remaining = max(
                    0,
                    (int) $priorAlloc->planned_amount
                        + (int) $priorAlloc->rollover_amount
                        - $spent
                );
                JarAllocation::query()
                    ->where('budget_period_id', $newPeriod->id)
                    ->where('jar_id', $priorAlloc->jar_id)
                    ->update(['rollover_amount' => $remaining]);
            }

            foreach ($prior->categoryBudgets()->with('category')->get() as $priorBudget) {
                $categoryKey = $priorBudget->category->key ?? '';
                $spent = $expensesByCategory[$categoryKey] ?? 0;
                $remaining = max(
                    0,
                    (int) $priorBudget->budgeted_amount
                        + (int) $priorBudget->rollover_amount
                        - $spent
                );
                CategoryBudget::query()->updateOrCreate(
                    [
                        'budget_period_id' => $newPeriod->id,
                        'category_id' => $priorBudget->category_id,
                    ],
                    ['rollover_amount' => $remaining]
                );
            }
        });
    }

    private function findPriorPeriod(BudgetPeriod $period): ?BudgetPeriod
    {
        return BudgetPeriod::query()
            ->where(function ($q) use ($period) {
                $q->where('year', '<', $period->year)
                  ->orWhere(function ($q2) use ($period) {
                      $q2->where('year', $period->year)
                         ->where('month_num', '<', $period->month_num);
                  });
            })
            ->orderByDesc('year')
            ->orderByDesc('month_num')
            ->first();
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
}
