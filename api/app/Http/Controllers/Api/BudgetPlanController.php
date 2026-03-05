<?php

namespace App\Http\Controllers\Api;

use App\Contracts\TransactionsRepositoryInterface;
use App\Models\Jar;
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
     * GET /api/budget-plan?month=Feb-2026[&base_income=15000000]
     *
     * Returns the budget plan vs actual spending for each jar.
     * base_income defaults to total income from the sheet for the given month.
     * If ?base_income=... is provided it overrides the computed income.
     * Jar percentages come from the jars DB table (editable via PUT /api/jars/{id}).
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

        $overrideIncome = $request->query('base_income');

        $cacheKey = 'budget_plan_' . md5($month . '|' . ($overrideIncome ?? ''));
        $cached = Cache::get($cacheKey);
        if ($cached !== null) {
            return response()->json($cached);
        }

        // Load thresholds from config
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

        // Compute actual income from sheet transactions
        $sheetIncome = 0;
        $actualByJar = [];
        foreach ($rows as $row) {
            $flow = mb_strtolower(trim($row['flow'] ?? ''));
            if ($flow === 'income') {
                $amountK   = $this->parseNumeric($row['amount'] ?? null);
                $sheetIncome += $amountK * 1000;
            }
            if ($flow === 'expense') {
                $jarLabel = trim($row['jar'] ?? '');
                if ($jarLabel === '') {
                    $jarLabel = 'Không phân loại';
                }
                $amountK   = $this->parseNumeric($row['amount'] ?? null);
                $amountVnd = $amountK * 1000;
                $actualByJar[$jarLabel] = ($actualByJar[$jarLabel] ?? 0) + $amountVnd;
            }
        }

        // base_income: override > sheet income > config fallback
        $baseIncome = $overrideIncome !== null
            ? (int) $overrideIncome
            : ($sheetIncome > 0 ? $sheetIncome : (int) config('budget_plan.base_income', 13_600_000));

        // Get jar percentages from DB (editable)
        $dbJars = Jar::where('is_active', true)->orderBy('sort_order')->get();

        // Build response for each jar
        $jars = [];
        foreach ($dbJars as $jar) {
            $label    = $jar->label;
            $percent  = (float) $jar->percent;
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
                'key'            => $jar->key,
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
                'month'         => $month,
                'base_income'   => $baseIncome,
                'sheet_income'  => $sheetIncome,
                'jars'          => $jars,
                'summary'       => [
                    'total_planned'   => $totalPlanned,
                    'total_actual'    => $totalActual,
                    'total_remaining' => $totalPlanned - $totalActual,
                    'usage_pct'       => $totalPlanned > 0
                        ? round(($totalActual / $totalPlanned) * 100, 1)
                        : 0,
                ],
                'thresholds'    => $thresholds,
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
