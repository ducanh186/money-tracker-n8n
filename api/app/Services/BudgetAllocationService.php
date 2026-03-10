<?php

namespace App\Services;

use App\Models\BudgetLine;
use App\Models\BudgetPeriod;
use App\Models\Jar;
use App\Models\JarAllocation;
use Illuminate\Support\Facades\DB;

class BudgetAllocationService
{
    /**
     * Auto-allocate income to jars based on their percent configuration.
     *
     * Creates or updates JarAllocation rows for each active jar.
     * Sets to_be_budgeted = income - sum(allocated).
     *
     * @param  BudgetPeriod  $period
     * @param  int|null      $income  Override income (null = use period.total_income)
     * @return BudgetPeriod  Updated period with allocations loaded
     */
    public function allocateIncome(BudgetPeriod $period, ?int $income = null): BudgetPeriod
    {
        $income = $income ?? $period->total_income;

        return DB::transaction(function () use ($period, $income) {
            $period->update(['total_income' => $income]);

            $jars = Jar::active()->ordered()->get();
            $totalAllocated = 0;

            foreach ($jars as $jar) {
                $allocation = JarAllocation::updateOrCreate(
                    [
                        'budget_period_id' => $period->id,
                        'jar_id'           => $jar->id,
                    ],
                    [
                        'planned_amount' => (int) round($income * $jar->percent / 100),
                    ]
                );

                // If there's a percent_override, recalculate
                if ($allocation->percent_override !== null) {
                    $allocation->update([
                        'planned_amount' => (int) round($income * $allocation->percent_override / 100),
                    ]);
                }

                $totalAllocated += $allocation->planned_amount;
            }

            $period->update([
                'to_be_budgeted' => $income - $totalAllocated,
            ]);

            return $period->load('jarAllocations.jar');
        });
    }

    /**
     * Override a specific jar's percent for a period and recalculate.
     */
    public function overrideJarPercent(BudgetPeriod $period, int $jarId, float $percent): JarAllocation
    {
        return DB::transaction(function () use ($period, $jarId, $percent) {
            $allocation = JarAllocation::updateOrCreate(
                [
                    'budget_period_id' => $period->id,
                    'jar_id'           => $jarId,
                ],
                [
                    'percent_override' => $percent,
                    'planned_amount'   => (int) round($period->total_income * $percent / 100),
                ]
            );

            $this->recalculateToBeBudgeted($period);

            return $allocation->load('jar');
        });
    }

    /**
     * Recalculate the to_be_budgeted field.
     */
    public function recalculateToBeBudgeted(BudgetPeriod $period): void
    {
        $allocated = (int) JarAllocation::where('budget_period_id', $period->id)
            ->sum('planned_amount');

        $period->update([
            'to_be_budgeted' => $period->total_income - $allocated,
        ]);
    }

    /**
     * Handle bonus / extra income.
     *
     * Policy: allocate bonus proportionally to LTSS & FFA only,
     * or evenly across all jars, depending on $policy.
     */
    public function allocateBonus(BudgetPeriod $period, int $bonusAmount, string $policy = 'savings_first'): BudgetPeriod
    {
        return DB::transaction(function () use ($period, $bonusAmount, $policy) {
            $newIncome = $period->total_income + $bonusAmount;
            $period->update(['total_income' => $newIncome]);

            $allocations = $period->jarAllocations()->with('jar')->get();

            if ($policy === 'savings_first') {
                // Bonus goes to LTSS and FFA equally
                $savingsJarKeys = ['LTSS', 'FFA'];
                $savingsAllocations = $allocations->filter(
                    fn ($a) => in_array($a->jar->key, $savingsJarKeys)
                );

                if ($savingsAllocations->isNotEmpty()) {
                    $perJar = (int) round($bonusAmount / $savingsAllocations->count());
                    foreach ($savingsAllocations as $allocation) {
                        $allocation->update([
                            'planned_amount' => $allocation->planned_amount + $perJar,
                        ]);
                    }
                }
            } else {
                // 'proportional': distribute bonus by same % as jars
                foreach ($allocations as $allocation) {
                    $pct = $allocation->percent_override ?? $allocation->jar->percent;
                    $extra = (int) round($bonusAmount * $pct / 100);
                    $allocation->update([
                        'planned_amount' => $allocation->planned_amount + $extra,
                    ]);
                }
            }

            $this->recalculateToBeBudgeted($period);

            return $period->load('jarAllocations.jar');
        });
    }

    /**
     * Get a full budget workspace view for a period.
     */
    public function getWorkspace(BudgetPeriod $period): array
    {
        $period->load([
            'jarAllocations.jar',
            'jarAllocations.budgetLines.goal',
            'jarAllocations.budgetLines.debt',
            'jarAllocations.budgetLines.recurringBill',
        ]);

        $jars = $period->jarAllocations->map(function (JarAllocation $alloc) {
            $lines = $alloc->budgetLines->map(fn (BudgetLine $line) => [
                'id'               => $line->id,
                'name'             => $line->name,
                'type'             => $line->type,
                'planned_amount'   => $line->planned_amount,
                'actual_amount'    => $line->actual_amount,
                'remaining'        => $line->remaining,
                'usage_pct'        => $line->usage_percent,
                'goal_id'          => $line->goal_id,
                'debt_id'          => $line->debt_id,
                'recurring_bill_id' => $line->recurring_bill_id,
                'notes'            => $line->notes,
            ]);

            $linesPlanned = $alloc->budgetLines->sum('planned_amount');
            $linesActual  = $alloc->budgetLines->sum('actual_amount');

            return [
                'allocation_id'   => $alloc->id,
                'jar_key'         => $alloc->jar->key,
                'jar_label'       => $alloc->jar->label,
                'percent'         => $alloc->effective_percent,
                'planned_amount'  => $alloc->planned_amount,
                'funded_amount'   => $alloc->funded_amount,
                'lines_planned'   => $linesPlanned,
                'lines_actual'    => $linesActual,
                'unassigned'      => $alloc->planned_amount - $linesPlanned,
                'budget_lines'    => $lines,
            ];
        });

        return [
            'period' => [
                'id'                   => $period->id,
                'month'                => $period->month,
                'year'                 => $period->year,
                'month_num'            => $period->month_num,
                'total_income'         => $period->total_income,
                'to_be_budgeted'       => $period->to_be_budgeted,
                'status'               => $period->status,
                'notes'                => $period->notes,
                'salary_received_at'   => $period->salary_received_at?->format('Y-m-d'),
                'allocation_locked_at' => $period->allocation_locked_at?->format('Y-m-d'),
            ],
            'jars' => $jars,
        ];
    }
}
