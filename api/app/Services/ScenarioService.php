<?php

namespace App\Services;

use App\Models\BudgetPeriod;
use App\Models\Jar;
use App\Models\JarAllocation;
use App\Models\Scenario;

class ScenarioService
{
    /**
     * Simulate a "what-if" purchase and generate proposals.
     *
     * Returns an array of proposals, each showing how to fund the purchase
     * and the impact on all jars.
     *
     * @param  string   $name            e.g. "Mua kính cận"
     * @param  int      $purchaseAmount  e.g. 1_000_000
     * @param  string   $targetJarKey    e.g. "NEC"
     * @param  string   $month           e.g. "Mar-2026"
     * @return array    Scenario analysis with proposals
     */
    public function simulate(string $name, int $purchaseAmount, string $targetJarKey, string $month): array
    {
        $period = BudgetPeriod::where('month', $month)->first();
        $targetJar = Jar::where('key', $targetJarKey)->first();

        if (!$period || !$targetJar) {
            return [
                'error' => 'Budget period or target jar not found.',
                'proposals' => [],
            ];
        }

        $allocations = $period->jarAllocations()
            ->with('jar', 'budgetLines')
            ->get()
            ->keyBy(fn ($a) => $a->jar->key);

        $targetAlloc = $allocations->get($targetJarKey);
        $proposals = [];

        // ── Proposal 1: Fund now from target jar ───────────────────
        if ($targetAlloc) {
            $linesActual = $targetAlloc->budgetLines->sum('actual_amount');
            $available = $targetAlloc->planned_amount - $linesActual;

            $proposals[] = [
                'id'          => 'fund_now',
                'label'       => 'Trích thẳng từ hũ ' . $targetJar->label,
                'feasible'    => $available >= $purchaseAmount,
                'source'      => $targetJarKey,
                'amount'      => min($purchaseAmount, max(0, $available)),
                'shortfall'   => max(0, $purchaseAmount - $available),
                'description' => $available >= $purchaseAmount
                    ? "Hũ {$targetJar->label} còn dư " . number_format($available) . "đ, đủ chi."
                    : "Hũ {$targetJar->label} chỉ còn " . number_format($available) . "đ, thiếu " . number_format($purchaseAmount - $available) . "đ.",
                'impact'      => $this->computeImpact($allocations, $targetJarKey, $purchaseAmount),
            ];
        }

        // ── Proposal 2: Trade-off — reduce PLAY to cover ──────────
        $playAlloc = $allocations->get('PLAY');
        if ($playAlloc && $targetAlloc) {
            $targetAvail = max(0, $targetAlloc->planned_amount - $targetAlloc->budgetLines->sum('actual_amount'));
            $shortfall = $purchaseAmount - $targetAvail;

            if ($shortfall > 0) {
                $playAvail = max(0, $playAlloc->planned_amount - $playAlloc->budgetLines->sum('actual_amount'));
                $fromPlay = min($shortfall, $playAvail);

                $proposals[] = [
                    'id'          => 'trade_off_play',
                    'label'       => "Giảm Hưởng thụ (PLAY) tháng này để bù",
                    'feasible'    => ($targetAvail + $fromPlay) >= $purchaseAmount,
                    'sources'     => [
                        ['jar' => $targetJarKey, 'amount' => min($purchaseAmount, $targetAvail)],
                        ['jar' => 'PLAY', 'amount' => $fromPlay],
                    ],
                    'shortfall'   => max(0, $purchaseAmount - $targetAvail - $fromPlay),
                    'description' => "Lấy " . number_format(min($purchaseAmount, $targetAvail)) . "đ từ {$targetJar->label}, "
                        . number_format($fromPlay) . "đ từ PLAY.",
                    'impact'      => $this->computeMultiImpact($allocations, [
                        $targetJarKey => min($purchaseAmount, $targetAvail),
                        'PLAY'        => $fromPlay,
                    ]),
                ];
            }
        }

        // ── Proposal 3: Fund over time (split across months) ──────
        $monthsToFund = 3; // Default split
        $perMonth = (int) ceil($purchaseAmount / $monthsToFund);

        $proposals[] = [
            'id'          => 'fund_over_time',
            'label'       => "Chia {$monthsToFund} tháng, mỗi tháng góp ~" . number_format($perMonth) . "đ",
            'feasible'    => true,
            'source'      => $targetJarKey,
            'months'      => $monthsToFund,
            'per_month'   => $perMonth,
            'description' => "Góp " . number_format($perMonth) . "đ/tháng từ hũ {$targetJar->label} trong {$monthsToFund} tháng.",
            'impact'      => $this->computeImpact($allocations, $targetJarKey, $perMonth),
        ];

        // ── Proposal 4: Use emergency / LTSS then repay ──────────
        $ltssAlloc = $allocations->get('LTSS');
        if ($ltssAlloc) {
            $ltssAvail = max(0, $ltssAlloc->planned_amount - $ltssAlloc->budgetLines->sum('actual_amount'));

            $proposals[] = [
                'id'          => 'use_emergency',
                'label'       => 'Dùng quỹ Tiết kiệm dài hạn, trả lại trong 1-2 tháng',
                'feasible'    => $ltssAvail >= $purchaseAmount,
                'source'      => 'LTSS',
                'amount'      => min($purchaseAmount, $ltssAvail),
                'repay_months' => 2,
                'repay_per_month' => (int) ceil($purchaseAmount / 2),
                'description' => "Ứng " . number_format(min($purchaseAmount, $ltssAvail)) . "đ từ LTSS, trả lại "
                    . number_format((int) ceil($purchaseAmount / 2)) . "đ/tháng × 2.",
                'impact'      => $this->computeImpact($allocations, 'LTSS', $purchaseAmount),
            ];
        }

        // ── Save scenario ─────────────────────────────────────────
        $impact = $this->computeImpact($allocations, $targetJarKey, $purchaseAmount);

        $scenario = Scenario::create([
            'budget_period_id' => $period->id,
            'name'             => $name,
            'purchase_amount'  => $purchaseAmount,
            'target_jar_id'    => $targetJar->id,
            'proposals'        => $proposals,
            'impact'           => $impact,
        ]);

        return [
            'scenario_id'     => $scenario->id,
            'name'            => $name,
            'purchase_amount' => $purchaseAmount,
            'target_jar'      => $targetJarKey,
            'month'           => $month,
            'proposals'       => $proposals,
        ];
    }

    /**
     * Compute impact of spending $amount from a single jar.
     */
    private function computeImpact($allocations, string $jarKey, int $amount): array
    {
        $impact = [];

        foreach ($allocations as $key => $alloc) {
            $actual = $alloc->budgetLines->sum('actual_amount');
            $spending = ($key === $jarKey) ? $amount : 0;

            $newActual = $actual + $spending;
            $usagePct = $alloc->planned_amount > 0
                ? round(($newActual / $alloc->planned_amount) * 100, 1)
                : 0;

            $impact[$key] = [
                'jar_label'      => $alloc->jar->label,
                'planned'        => $alloc->planned_amount,
                'current_actual' => $actual,
                'after_purchase' => $newActual,
                'remaining'      => $alloc->planned_amount - $newActual,
                'usage_pct'      => $usagePct,
                'affected'       => $spending > 0,
            ];
        }

        return $impact;
    }

    /**
     * Compute impact of spending from multiple jars.
     */
    private function computeMultiImpact($allocations, array $jarAmounts): array
    {
        $impact = [];

        foreach ($allocations as $key => $alloc) {
            $actual = $alloc->budgetLines->sum('actual_amount');
            $spending = $jarAmounts[$key] ?? 0;

            $newActual = $actual + $spending;
            $usagePct = $alloc->planned_amount > 0
                ? round(($newActual / $alloc->planned_amount) * 100, 1)
                : 0;

            $impact[$key] = [
                'jar_label'      => $alloc->jar->label,
                'planned'        => $alloc->planned_amount,
                'current_actual' => $actual,
                'after_purchase' => $newActual,
                'remaining'      => $alloc->planned_amount - $newActual,
                'usage_pct'      => $usagePct,
                'affected'       => $spending > 0,
            ];
        }

        return $impact;
    }
}
