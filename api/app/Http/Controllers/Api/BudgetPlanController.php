<?php

namespace App\Http\Controllers\Api;

use App\Contracts\TransactionsRepositoryInterface;
use App\Http\Resources\TransactionResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Cache;

class BudgetPlanController extends Controller
{
    public function __construct(
        private readonly TransactionsRepositoryInterface $repository,
    ) {}

    /**
     * GET /api/budget-plan?month=Feb-2026
     *
     * Returns the budget plan vs actual spending for each jar.
     */
    public function __invoke(Request $request): JsonResponse
    {
        $month = $request->query('month');

        if (empty($month)) {
            return response()->json([
                'error'   => 'validation_error',
                'message' => 'The "month" query parameter is required (e.g. "Feb-2026").',
            ], 400);
        }

        $cacheKey = 'budget_plan_' . md5($month);
        $cached = Cache::get($cacheKey);
        if ($cached !== null) {
            return response()->json($cached);
        }

        // Load config
        $baseIncome = config('budget_plan.base_income', 13_600_000);
        $jarsConfig = config('budget_plan.jars', []);
        $thresholds = config('budget_plan.thresholds', ['ok_max' => 80, 'warn_max' => 100]);

        // Fetch all transactions for the month
        try {
            $rows = $this->repository->getByMonth($month);
        } catch (\Throwable $e) {
            return response()->json([
                'error'   => 'sheets_error',
                'message' => 'Could not fetch transactions.',
            ], 500);
        }

        // Aggregate actual expense by jar label (Vietnamese)
        $actualByJar = [];
        foreach ($rows as $row) {
            $flow = mb_strtolower(trim($row['flow'] ?? ''));
            if ($flow !== 'expense') {
                continue;
            }
            $jarLabel = trim($row['jar'] ?? '');
            if ($jarLabel === '') {
                $jarLabel = 'Không phân loại';
            }
            $amountK   = $this->parseNumeric($row['amount'] ?? null);
            $amountVnd = $amountK * 1000;
            $actualByJar[$jarLabel] = ($actualByJar[$jarLabel] ?? 0) + $amountVnd;
        }

        // Build response for each jar in the plan
        $jars = [];
        foreach ($jarsConfig as $key => $cfg) {
            $label    = $cfg['label'];
            $percent  = $cfg['percent'];
            $planned  = (int) round($baseIncome * $percent / 100);
            $actual   = $actualByJar[$label] ?? 0;
            $remaining = $planned - $actual;
            $usagePct = $planned > 0 ? round(($actual / $planned) * 100, 1) : 0;

            if ($usagePct <= $thresholds['ok_max']) {
                $status = 'OK';
            } elseif ($usagePct <= $thresholds['warn_max']) {
                $status = 'WARN';
            } else {
                $status = 'OVER';
            }

            $jars[] = [
                'key'            => $key,
                'label'          => $label,
                'percent'        => $percent,
                'planned_amount' => $planned,
                'actual_amount'  => $actual,
                'remaining'      => $remaining,
                'usage_pct'      => $usagePct,
                'status'         => $status,
            ];
        }

        // Summary
        $totalPlanned = (int) array_sum(array_column($jars, 'planned_amount'));
        $totalActual  = (int) array_sum(array_column($jars, 'actual_amount'));

        $payload = [
            'data' => [
                'month'        => $month,
                'base_income'  => $baseIncome,
                'jars'         => $jars,
                'summary'      => [
                    'total_planned'   => $totalPlanned,
                    'total_actual'    => $totalActual,
                    'total_remaining' => $totalPlanned - $totalActual,
                    'usage_pct'       => $totalPlanned > 0
                        ? round(($totalActual / $totalPlanned) * 100, 1)
                        : 0,
                ],
                'thresholds'   => $thresholds,
            ],
        ];

        Cache::put($cacheKey, $payload, config('google_sheets.cache_ttl', 60));

        return response()->json($payload);
    }

    private function parseNumeric(mixed $value): int
    {
        if (is_numeric($value)) {
            return (int) $value;
        }
        return 0;
    }
}
