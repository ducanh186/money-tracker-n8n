<?php

namespace App\Http\Controllers\Api;

use App\Contracts\TransactionsRepositoryInterface;
use App\Http\Controllers\Controller;
use App\Models\BudgetPeriod;
use App\Models\Fund;
use App\Models\Jar;
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

        $cacheKey = 'dashboard_summary_' . md5($month);
        $cached = Cache::get($cacheKey);
        if ($cached !== null) {
            return response()->json($cached);
        }

        try {
            $rows = $this->repository->getByMonth($month);
        } catch (\Throwable $e) {
            return response()->json([
                'error' => 'sheets_error',
                'message' => 'Could not fetch data.',
            ], 500);
        }

        // Aggregate totals
        $incomeVnd = 0;
        $expenseVnd = 0;
        $latestDatetime = '';
        $endingBalanceVnd = null;
        $byJar = [];
        $txCount = count($rows);
        $recentTxs = [];

        foreach ($rows as $row) {
            // Track ending balance for ALL rows (including loans) — bank balance doesn't care about classification.
            $dt = $row['datetime'] ?? '';
            if ($dt > $latestDatetime) {
                $latestDatetime = $dt;
                $endingBalanceVnd = $this->parseNumeric($row['balance'] ?? null) * 1000;
            }

            // Loan rows are excluded from income/expense aggregates.
            if (TransactionFilters::isLoan($row)) {
                continue;
            }

            $amountK = $this->parseNumeric($row['amount'] ?? null);
            $amountVnd = abs($amountK) * 1000;
            $flow = mb_strtolower(trim($row['flow'] ?? ''));

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
            $amountK = $this->parseNumeric($row['amount'] ?? null);
            $recentTxs[] = [
                'date' => $row['date'] ?? null,
                'time' => $row['time'] ?? null,
                'flow' => $row['flow'] ?? null,
                'amount_vnd' => abs($amountK) * 1000,
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
                    'ending_balance_vnd' => $endingBalanceVnd,
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

        $cacheKey = 'budget_status_' . md5($month);
        $cached = Cache::get($cacheKey);
        if ($cached !== null) {
            return response()->json($cached);
        }

        // Parse month string (e.g. "Mar-2026")
        $parts = explode('-', $month);
        $monthAbbr = $parts[0] ?? '';
        $year = (int) ($parts[1] ?? 0);

        $monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        $monthNum = array_search($monthAbbr, $monthNames);
        $monthNum = $monthNum !== false ? $monthNum + 1 : 0;

        // Compute income from Google Sheets
        try {
            $rows = $this->repository->getByMonth($month);
        } catch (\Throwable) {
            $rows = [];
        }

        $sheetIncome = 0;
        $totalExpense = 0;
        $expenseByJar = [];
        foreach ($rows as $row) {
            if (TransactionFilters::isLoan($row)) {
                continue;
            }
            $flow = mb_strtolower(trim($row['flow'] ?? ''));
            $amountK = $this->parseNumeric($row['amount'] ?? null);
            $amountVnd = abs($amountK) * 1000;
            if ($flow === 'income') {
                $sheetIncome += $amountVnd;
            } elseif ($flow === 'expense') {
                $totalExpense += $amountVnd;
                $jarKey = trim($row['jar'] ?? '');
                if ($jarKey !== '') {
                    $expenseByJar[$jarKey] = ($expenseByJar[$jarKey] ?? 0) + $amountVnd;
                }
            }
        }

        // Check if budget period exists for this month
        $period = BudgetPeriod::where('year', $year)
            ->where('month_num', $monthNum)
            ->first();

        $totalIncome = $sheetIncome;
        $assigned = 0;
        $committed = 0;
        $availableToSpend = 0;
        $overspentJars = [];
        $periodStatus = 'not_started';
        $jarsMetrics = [];

        if ($period) {
            $totalIncome = $period->total_income > 0 ? $period->total_income : $sheetIncome;
            $periodStatus = $period->status ?? 'open';

            $allocations = $period->jarAllocations()->with('jar')->get();
            foreach ($allocations as $alloc) {
                $jarKey = $alloc->jar->key;
                $planned = $alloc->planned_amount;
                $committedAmt = $alloc->committed_amount;
                $spent = $expenseByJar[$jarKey] ?? ($expenseByJar[$alloc->jar->label] ?? 0);
                $available = $planned + $alloc->rollover_amount - $committedAmt - $spent;

                $assigned += $planned;
                $committed += $committedAmt;
                $availableToSpend += $available;

                if ($spent > $planned) {
                    $overspentJars[] = [
                        'key'    => $jarKey,
                        'label'  => $alloc->jar->label,
                        'over'   => $spent - $planned,
                    ];
                }

                // Count funds for this jar
                $fundsCount = Fund::where('jar_id', $alloc->jar_id)->where('status', 'active')->count();

                $jarsMetrics[] = [
                    'key'        => $jarKey,
                    'label'      => $alloc->jar->label,
                    'planned'    => $planned,
                    'committed'  => $committedAmt,
                    'spent'      => $spent,
                    'available'  => $available,
                    'rollover'   => $alloc->rollover_amount,
                    'funds_count' => $fundsCount,
                ];
            }
        } else {
            // No budget period — use jar defaults
            $dbJars = Jar::active()->ordered()->get();
            foreach ($dbJars as $jar) {
                $planned = (int) round($totalIncome * $jar->percent / 100);
                $spent = $expenseByJar[$jar->key] ?? ($expenseByJar[$jar->label] ?? 0);
                $available = $planned - $spent;

                $assigned += $planned;
                $availableToSpend += $available;

                if ($spent > $planned) {
                    $overspentJars[] = [
                        'key'   => $jar->key,
                        'label' => $jar->label,
                        'over'  => $spent - $planned,
                    ];
                }

                $fundsCount = Fund::where('jar_id', $jar->id)->where('status', 'active')->count();

                $jarsMetrics[] = [
                    'key'        => $jar->key,
                    'label'      => $jar->label,
                    'planned'    => $planned,
                    'committed'  => 0,
                    'spent'      => $spent,
                    'available'  => $available,
                    'rollover'   => 0,
                    'funds_count' => $fundsCount,
                ];
            }
        }

        $unassigned = $totalIncome - $assigned;

        $payload = [
            'data' => [
                'month'             => $month,
                'income'            => $totalIncome,
                'sheet_income'      => $sheetIncome,
                'assigned'          => $assigned,
                'unassigned'        => $unassigned,
                'committed'         => $committed,
                'total_spent'       => $totalExpense,
                'available_to_spend' => $availableToSpend,
                'overspent_jars'    => $overspentJars,
                'period_status'     => $periodStatus,
                'planning_insights_enabled' => $period !== null && $assigned > 0,
                'has_period'        => $period !== null,
                'jars'              => $jarsMetrics,
            ],
        ];

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
