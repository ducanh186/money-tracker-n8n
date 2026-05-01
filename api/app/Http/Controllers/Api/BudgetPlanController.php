<?php

namespace App\Http\Controllers\Api;

use App\Contracts\TransactionsRepositoryInterface;
use App\Models\Jar;
use App\Services\MonthlyBudgetSummaryService;
use App\Support\BudgetMonth;
use App\Support\MoneyAmount;
use App\Support\TransactionFilters;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Cache;

class BudgetPlanController extends Controller
{
    public function __construct(
        private readonly TransactionsRepositoryInterface $repository,
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

        // Load thresholds from config
        $thresholds = config('budget_plan.thresholds', ['ok_max' => 80, 'warn_max' => 100]);

        // Fetch all transactions for the month
        try {
            $budgetMonth = BudgetMonth::parse($month);
            $rows = array_values(array_filter(
                $this->repository->all(),
                fn (array $row) => MoneyAmount::rowBelongsToMonth($row, $budgetMonth)
            ));
        } catch (\Throwable $e) {
            return response()->json([
                'error'   => 'sheets_error',
                'message' => 'Could not fetch transactions.',
            ], 500);
        }

        // Compute actual income from sheet transactions
        // Loan transactions (jar=LOAN) are excluded from the budget plan.
        $sheetIncome = 0;
        $actualByJar = [];
        $loanSummary = ['in' => 0, 'out' => 0, 'repayment' => 0, 'recovery' => 0];
        foreach ($rows as $row) {
            if (TransactionFilters::isLoan($row)) {
                $cat = trim((string)($row['category'] ?? ''));
                $amtVnd = MoneyAmount::amountAbsVnd($row);
                if ($cat === 'Loan In')        $loanSummary['in']        += $amtVnd;
                elseif ($cat === 'Loan Repayment') $loanSummary['repayment'] += $amtVnd;
                elseif ($cat === 'Loan Out')   $loanSummary['out']       += $amtVnd;
                elseif ($cat === 'Loan Recovery') $loanSummary['recovery']  += $amtVnd;
                continue;
            }
            $flow = MoneyAmount::direction($row);
            if ($flow === 'income') {
                $sheetIncome += MoneyAmount::amountAbsVnd($row);
            }
            if ($flow === 'expense') {
                $jarKey = trim($row['jar'] ?? '');
                if ($jarKey === '') {
                    $jarKey = 'Không phân loại';
                }
                $amountVnd = MoneyAmount::amountAbsVnd($row);
                $actualByJar[$jarKey] = ($actualByJar[$jarKey] ?? 0) + $amountVnd;
            }
        }
        $loanSummary['net_owed'] = ($loanSummary['in'] - $loanSummary['repayment'])
                                 - ($loanSummary['out'] - $loanSummary['recovery']);

        // expected income: query param > period/settings/carry-forward/config.
        if ($overrideIncome !== null) {
            $baseIncome = (int) $overrideIncome;
        } else {
            $baseIncome = $this->monthlySummaryService->expectedIncomeForMonth($month);
        }

        // Get jar percentages from DB (editable)
        $dbJars = Jar::where('is_active', true)->orderBy('sort_order')->get();

        // Build response for each jar
        $jars = [];
        foreach ($dbJars as $jar) {
            $label    = $jar->label;
            $percent  = (float) $jar->percent;
            $planned  = (int) round($baseIncome * $percent / 100);
            // Match by jar key first (sheet uses keys like NEC, LTSS), fallback to label
            $actual   = $actualByJar[$jar->key] ?? ($actualByJar[$label] ?? 0);
            $remaining = $planned - $actual;
            $usagePct = $planned > 0 ? round(($actual / $planned) * 100, 2) : 0;

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
                'expected_income_vnd' => $baseIncome,
                'actual_income_vnd' => $sheetIncome,
                'jars'          => $jars,
                'summary'       => [
                    'total_planned'   => $totalPlanned,
                    'total_actual'    => $totalActual,
                    'total_remaining' => $totalPlanned - $totalActual,
                    'usage_pct'       => $totalPlanned > 0
                        ? round(($totalActual / $totalPlanned) * 100, 2)
                        : 0,
                ],
                'loan_summary'  => $loanSummary,
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
