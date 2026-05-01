<?php

namespace App\Http\Controllers\Api;

use App\Contracts\TransactionsRepositoryInterface;
use App\Http\Controllers\Controller;
use App\Services\BalanceService;
use App\Services\MonthlyBudgetSummaryService;
use App\Support\BudgetMonth;
use App\Support\MoneyAmount;
use App\Support\TransactionFilters;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

/**
 * Dashboard summary — lightweight endpoint that returns only aggregate numbers.
 *
 * FE should call this when opening the dashboard, NOT the full transactions list.
 * Detail data is fetched separately only when user clicks "View transactions".
 */
class DashboardController extends Controller
{
    public function __construct(
        private readonly TransactionsRepositoryInterface $repository,
        private readonly BalanceService $balanceService,
        private readonly MonthlyBudgetSummaryService $monthlySummaryService,
    ) {}

    /**
     * GET /api/dashboard/summary?month=Mar-2026
     *
     * Returns lightweight summary: income, expense, net, balance, jar breakdown.
     * Reads from cache snapshot — never hits Google Sheets directly.
     */
    public function summary(Request $request): JsonResponse
    {
        $month = $request->query('month');
        if (empty($month)) {
            return response()->json([
                'error' => 'validation_error',
                'message' => 'The "month" query parameter is required.',
            ], 400);
        }

        $cacheKey = 'dashboard_summary_v2_' . md5($month);
        $cached = Cache::get($cacheKey);
        if ($cached !== null) {
            return response()->json($cached);
        }

        try {
            $budgetMonth = BudgetMonth::parse($month);
            $rows = array_values(array_filter(
                $this->repository->all(),
                fn (array $row) => MoneyAmount::rowBelongsToMonth($row, $budgetMonth)
            ));
            $balance = $this->balanceService->forMonth($month);
        } catch (\Throwable $e) {
            return response()->json([
                'error' => 'sheets_error',
                'message' => 'Could not fetch data.',
            ], 500);
        }

        // Aggregate totals
        $incomeVnd = 0;
        $expenseVnd = 0;
        $byJar = [];
        $txCount = count($rows);
        $recentTxs = [];

        foreach ($rows as $row) {
            // Loan rows are excluded from income/expense aggregates.
            if (TransactionFilters::isLoan($row)) {
                continue;
            }

            $amountVnd = MoneyAmount::amountAbsVnd($row);
            $flow = MoneyAmount::direction($row);

            if ($flow === 'income') {
                $incomeVnd += $amountVnd;
            } elseif ($flow === 'expense') {
                $expenseVnd += $amountVnd;

                // Aggregate expense by jar
                $jarLabel = trim($row['jar'] ?? 'Không phân loại');
                if (!isset($byJar[$jarLabel])) {
                    $byJar[$jarLabel] = 0;
                }
                $byJar[$jarLabel] += $amountVnd;
            }
        }

        // Get 5 most recent transactions (lightweight)
        usort($rows, fn($a, $b) => strcmp($b['datetime'] ?? '', $a['datetime'] ?? ''));
        foreach (array_slice($rows, 0, 5) as $row) {
            $recentTxs[] = [
                'date' => $row['date'] ?? null,
                'time' => $row['time'] ?? null,
                'flow' => $row['flow'] ?? null,
                'amount_vnd' => MoneyAmount::amountAbsVnd($row),
                'amount_vnd_signed' => MoneyAmount::amountSignedVnd($row),
                'amount_vnd_abs' => MoneyAmount::amountAbsVnd($row),
                'description' => $row['description'] ?? null,
                'category' => $row['category'] ?? null,
                'jar' => $row['jar'] ?? null,
            ];
        }

        $payload = [
            'data' => [
                'month' => $month,
                'transaction_count' => $txCount,
                'totals' => [
                    'income_vnd' => $incomeVnd,
                    'expense_vnd' => $expenseVnd,
                    'net_vnd' => $incomeVnd - $expenseVnd,
                    'ending_balance_vnd' => $balance['ending_balance_vnd'],
                    'account_balance_vnd' => $balance['account_balance_vnd'],
                    'opening_balance_vnd' => $balance['opening_balance_vnd'],
                ],
                'expense_by_jar' => $byJar,
                'recent_transactions' => $recentTxs,
            ],
        ];

        // Cache for 2 minutes (synced every minute by sheets:sync)
        Cache::put($cacheKey, $payload, 120);

        return response()->json($payload);
    }

    /**
     * GET /api/sync-status
     *
     * Returns info about the last Google Sheets sync.
     * FE can use this to display "Last synced X ago".
     */
    public function syncStatus(): JsonResponse
    {
        $meta = Cache::get('sheets_sync_meta');

        return response()->json([
            'data' => $meta ?? [
                'last_sync_at' => null,
                'row_count' => 0,
                'elapsed_ms' => 0,
                'months_warmed' => [],
            ],
        ]);
    }

    /**
     * GET /api/budget-status?month=Mar-2026
     *
     * Aggregated budget status for the TopBar and Overview.
     * Returns: income, assigned, unassigned, overspent jars, period status.
     */
    public function budgetStatus(Request $request): JsonResponse
    {
        $month = $request->query('month');
        if (empty($month)) {
            return response()->json([
                'error'   => 'validation_error',
                'message' => 'The "month" query parameter is required.',
            ], 400);
        }

        $cacheKey = 'budget_status_v2_' . md5($month);
        $cached = Cache::get($cacheKey);
        if ($cached !== null) {
            return response()->json($cached);
        }

        try {
            $payload = ['data' => $this->monthlySummaryService->summary($month)];
        } catch (\Throwable $e) {
            return response()->json([
                'error' => 'summary_error',
                'message' => 'Could not compute budget status.',
            ], 500);
        }

        Cache::put($cacheKey, $payload, 120);

        return response()->json($payload);
    }

    /**
     * POST /api/sync
     *
     * Manual trigger for Google Sheets sync.
     * Rate-limited separately to prevent abuse.
     */
    public function triggerSync(): JsonResponse
    {
        try {
            \Illuminate\Support\Facades\Artisan::call('sheets:sync', ['--force' => true]);

            return response()->json([
                'message' => 'Sync completed.',
                'data' => Cache::get('sheets_sync_meta'),
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'error' => 'sync_failed',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    private function parseNumeric(mixed $value): int
    {
        if (is_numeric($value)) {
            return (int) $value;
        }
        return 0;
    }
}
