<?php

namespace App\Console\Commands;

use App\Contracts\TransactionsRepositoryInterface;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

/**
 * Periodically sync Google Sheets data into local cache snapshot.
 *
 * Instead of every FE request hitting Google Sheets, this command
 * runs on a schedule (every minute) and refreshes the cache once.
 * FE requests then read from the snapshot cache — never touching Google directly.
 */
class SyncGoogleSheets extends Command
{
    protected $signature = 'sheets:sync {--force : Force refresh even if cache is fresh}';
    protected $description = 'Sync Google Sheets data into local cache snapshot';

    public function handle(TransactionsRepositoryInterface $repository): int
    {
        $start = microtime(true);

        try {
            // 1. Clear current cache to force re-fetch from Google Sheets
            Cache::forget('sheets_all_rows');

            // 2. Trigger a fetch — this will read from Google Sheets and re-populate cache
            $allRows = $repository->getByMonth('__sync_trigger__');

            // The repository internally caches sheets_all_rows, so all subsequent
            // getByMonth() calls will use the cache, never hitting Google again until next sync.

            // 3. Also warm month-specific caches for the current and previous month
            $now = now();
            $months = [
                $now->format('M-Y'),
                $now->copy()->subMonth()->format('M-Y'),
            ];

            foreach ($months as $month) {
                $cacheKey = 'sheets_month_' . md5($month);
                Cache::forget($cacheKey);
                $repository->getByMonth($month);
            }

            // 4. Clear derived caches (budget plan, transaction pages)
            $this->clearDerivedCaches($months);

            // 5. Store sync metadata
            $elapsed = round((microtime(true) - $start) * 1000);
            $rowCount = count(Cache::get('sheets_all_rows', []));

            Cache::put('sheets_sync_meta', [
                'last_sync_at' => now()->toISOString(),
                'row_count' => $rowCount,
                'elapsed_ms' => $elapsed,
                'months_warmed' => $months,
            ], 300); // 5 min TTL

            $this->info("Synced {$rowCount} rows in {$elapsed}ms. Months warmed: " . implode(', ', $months));

            Log::info('sheets:sync completed', [
                'rows' => $rowCount,
                'elapsed_ms' => $elapsed,
            ]);

            return self::SUCCESS;
        } catch (\Throwable $e) {
            $this->error('Sync failed: ' . $e->getMessage());
            Log::error('sheets:sync failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return self::FAILURE;
        }
    }

    /**
     * Clear caches derived from raw sheet data so they rebuild with fresh data.
     */
    private function clearDerivedCaches(array $months): void
    {
        foreach ($months as $month) {
            // Budget plan cache
            Cache::forget('budget_plan_' . md5($month));

            // Dashboard summary cache
            Cache::forget('dashboard_summary_' . md5($month));

            // Transaction list caches (we can't enumerate all keys,
            // but the txn_ keys have 60s TTL anyway so they'll expire soon)
        }
    }
}
