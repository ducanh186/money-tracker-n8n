<?php

namespace App\Http\Controllers\Api;

use App\Models\Jar;
use App\Services\MonthlyBudgetSummaryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Cache;

class BudgetPlanController extends Controller
{
    public function __construct(
        private readonly MonthlyBudgetSummaryService $monthlySummaryService,
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

        // Include jar percentages in cache key so changes auto-invalidate
        $jarHash = md5(Jar::where('is_active', true)->orderBy('sort_order')->pluck('percent')->implode(','));
        $cacheKey = 'budget_plan_' . md5($month . '|' . ($overrideIncome ?? '') . '|' . $jarHash);
        $cached = Cache::get($cacheKey);
        if ($cached !== null) {
            return response()->json($cached);
        }

        $thresholds = config('budget_plan.thresholds', ['ok_max' => 80, 'warn_max' => 100]);

        try {
            $monthly = $this->monthlySummaryService->summary($month);
        } catch (\Throwable) {
            return response()->json([
                'error'   => 'summary_error',
                'message' => 'Could not compute budget plan.',
            ], 500);
        }

        // expected income: query param > period/settings/carry-forward/config.
        $baseIncome = $overrideIncome !== null
            ? (int) $overrideIncome
            : (int) $monthly['expected_income_vnd'];

        $dbJars = Jar::where('is_active', true)->orderBy('sort_order')->get()->keyBy('key');

        $jars = array_map(function (array $jarMetric) use ($dbJars, $baseIncome, $overrideIncome, $thresholds) {
            $dbJar = $dbJars->get($jarMetric['key']);
            $percent = (float) ($dbJar?->percent ?? 0);
            $planned = $overrideIncome !== null
                ? (int) round($baseIncome * $percent / 100)
                : (int) ($jarMetric['budgeted_vnd'] ?? $jarMetric['planned'] ?? 0);
            $actual = (int) ($jarMetric['spent_vnd'] ?? $jarMetric['spent'] ?? 0);
            $remaining = $planned - $actual - (int) ($jarMetric['reserved_vnd'] ?? $jarMetric['reserved'] ?? 0);
            $usagePct = $planned > 0 ? round(($actual / $planned) * 100, 2) : 0;

            if ($usagePct <= $thresholds['ok_max']) {
                $status = 'OK';
            } elseif ($usagePct <= $thresholds['warn_max']) {
                $status = 'WARN';
            } else {
                $status = 'OVER';
            }

            return [
                'key'            => $jarMetric['key'],
                'label'          => $jarMetric['label'],
                'percent'        => $percent,
                'planned_amount' => $planned,
                'actual_amount'  => $actual,
                'remaining'      => $remaining,
                'usage_pct'      => $usagePct,
                'status'         => $status,
            ];
        }, $monthly['jars'] ?? []);

        $totalPlanned = (int) array_sum(array_column($jars, 'planned_amount'));
        $totalActual  = (int) array_sum(array_column($jars, 'actual_amount'));

        $hasPeriod = (bool) ($monthly['has_period'] ?? false);
        $periodStatus = (string) ($monthly['period_status'] ?? ($hasPeriod ? 'open' : 'needs_plan'));

        $payload = [
            'data' => [
                'month'         => $month,
                'base_income'   => $baseIncome,
                'sheet_income'  => (int) $monthly['actual_income_vnd'],
                'expected_income_vnd' => $baseIncome,
                'actual_income_vnd' => (int) $monthly['actual_income_vnd'],
                'actual_expense_vnd' => (int) $monthly['actual_expense_vnd'],
            'has_period'    => $hasPeriod,
            'period_status' => $periodStatus,
            'is_preview'    => !$hasPeriod,
                'jars'          => $jars,
                'categories'    => $monthly['categories'] ?? [],
                'budget_basis'  => $monthly['budget_basis'] ?? 'jar_compatibility',
                'summary'       => [
                    'total_planned'   => $totalPlanned,
                    'total_actual'    => $totalActual,
                    'total_remaining' => $totalPlanned - $totalActual,
                    'usage_pct'       => $totalPlanned > 0
                        ? round(($totalActual / $totalPlanned) * 100, 2)
                        : 0,
                ],
                'loan_summary'  => ['in' => 0, 'out' => 0, 'repayment' => 0, 'recovery' => 0, 'net_owed' => 0],
                'thresholds'    => $thresholds,
            ],
        ];

        Cache::put($cacheKey, $payload, config('google_sheets.cache_ttl', 60));

        return response()->json($payload);
    }
}
