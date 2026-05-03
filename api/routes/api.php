<?php

use App\Http\Controllers\Api\AccountController;
use App\Http\Controllers\Api\BalanceController;
use App\Http\Controllers\Api\BudgetLineController;
use App\Http\Controllers\Api\BudgetPeriodController;
use App\Http\Controllers\Api\BudgetPlanController;
use App\Http\Controllers\Api\BudgetSettingController;
use App\Http\Controllers\Api\CategoryBudgetController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\DebtController;
use App\Http\Controllers\Api\FundController;
use App\Http\Controllers\Api\GoalController;
use App\Http\Controllers\Api\JarController;
use App\Http\Controllers\Api\MonthlySummaryController;
use App\Http\Controllers\Api\RecurringBillController;
use App\Http\Controllers\Api\ScenarioController;
use App\Http\Controllers\Api\TransactionsController;
use App\Http\Controllers\Api\TransferController;
use Illuminate\Support\Facades\Route;

// Health check endpoint (simple)
Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'timestamp' => now()->toISOString(),
    ]);
});

// Deep health check - diagnoses all dependencies
Route::get('/health/deep', function () {
    $checks = [];
    $allOk = true;

    // 1. Laravel bootstrap
    $checks['laravel'] = [
        'status' => 'ok',
        'version' => app()->version(),
        'env' => config('app.env'),
        'debug' => config('app.debug'),
    ];

    // 2. Cache store
    try {
        \Illuminate\Support\Facades\Cache::put('_health_check', 'ok', 10);
        $val = \Illuminate\Support\Facades\Cache::get('_health_check');
        $checks['cache'] = [
            'status' => $val === 'ok' ? 'ok' : 'fail',
            'store' => config('cache.default'),
        ];
    } catch (\Throwable $e) {
        $checks['cache'] = ['status' => 'fail', 'error' => $e->getMessage()];
        $allOk = false;
    }

    // 3. Google Sheets credentials file
    $credsPath = config('google_sheets.credentials_json');
    $credsAbsolutePath = null;
    $credsExists = false;

    if (!empty($credsPath)) {
        if (is_file($credsPath)) {
            $credsExists = true;
            $credsAbsolutePath = $credsPath;
        } else {
            $credsAbsolutePath = base_path($credsPath);
            $credsExists = is_file($credsAbsolutePath);
        }
    }

    $checks['google_credentials'] = [
        'status' => $credsExists ? 'ok' : 'fail',
        'configured_path' => $credsPath,
        'resolved_path' => $credsAbsolutePath,
        'file_exists' => $credsExists,
    ];
    if (!$credsExists) $allOk = false;

    // 4. Google Sheets config
    $spreadsheetId = config('google_sheets.spreadsheet_id');
    $checks['google_sheets_config'] = [
        'status' => !empty($spreadsheetId) ? 'ok' : 'fail',
        'spreadsheet_id' => !empty($spreadsheetId) ? substr($spreadsheetId, 0, 8) . '...' : '(empty)',
        'sheet_name' => config('google_sheets.sheet_name'),
        'cache_ttl' => config('google_sheets.cache_ttl'),
    ];
    if (empty($spreadsheetId)) $allOk = false;

    // 5. Google Sheets API connectivity (if credentials exist)
    if ($credsExists && !empty($spreadsheetId)) {
        try {
            $repo = app(\App\Contracts\TransactionsRepositoryInterface::class);
            // Try fetching a non-existent month (fast, won't return data but verifies API auth)
            $repo->getByMonth('__health_check__');
            $checks['google_sheets_api'] = ['status' => 'ok'];
        } catch (\Throwable $e) {
            $checks['google_sheets_api'] = [
                'status' => 'fail',
                'error' => $e->getMessage(),
            ];
            $allOk = false;
        }
    } else {
        $checks['google_sheets_api'] = ['status' => 'skip', 'reason' => 'credentials or spreadsheet_id not configured'];
    }

    // 6. Storage permissions
    $storagePath = storage_path('framework/cache/data');
    $checks['storage'] = [
        'status' => is_writable(storage_path()) ? 'ok' : 'fail',
        'path' => storage_path(),
        'writable' => is_writable(storage_path()),
        'cache_dir_exists' => is_dir($storagePath),
    ];
    if (!is_writable(storage_path())) $allOk = false;

    return response()->json([
        'status' => $allOk ? 'ok' : 'degraded',
        'timestamp' => now()->toISOString(),
        'checks' => $checks,
    ], $allOk ? 200 : 503);
});

Route::prefix('transactions')->group(function () {
    Route::get('/', [TransactionsController::class, 'index']);
    Route::get('/{idempotencyKey}', [TransactionsController::class, 'show']);
});

Route::get('/budget-plan', BudgetPlanController::class);
Route::get('/balances', [BalanceController::class, 'month']);
Route::get('/balances/as-of', [BalanceController::class, 'asOf']);
Route::get('/monthly-summary', MonthlySummaryController::class);
Route::get('/categories', [CategoryController::class, 'index']);
Route::get('/budget-templates', [CategoryController::class, 'templates']);

// ══════════════════════════════════════════════════════════════════════
// Dashboard summary + Sync (cache-first read model)
// ══════════════════════════════════════════════════════════════════════
Route::middleware(['etag'])->group(function () {
    Route::get('/dashboard/summary', [DashboardController::class, 'summary']);
    Route::get('/sync-status', [DashboardController::class, 'syncStatus']);
});
Route::post('/sync', [DashboardController::class, 'triggerSync'])
    ->middleware('throttle:sync');

// ══════════════════════════════════════════════════════════════════════
// Category-first budgeting with legacy 6-jar compatibility
// ══════════════════════════════════════════════════════════════════════

// ── Read endpoints with ETag (304 support) ────────────────────────
Route::middleware(['etag'])->group(function () {
    // Jars (optional template/grouping compatibility)
    Route::prefix('jars')->group(function () {
        Route::get('/', [JarController::class, 'index']);
        Route::get('/{jar}', [JarController::class, 'show']);
    });

    // Accounts (read)
    Route::get('/accounts/net-worth', [AccountController::class, 'netWorth']);
    Route::get('/accounts', [AccountController::class, 'index']);
    Route::get('/accounts/{account}', [AccountController::class, 'show']);

    // Budget Periods (read)
    Route::get('/budget-periods', [BudgetPeriodController::class, 'index']);
    Route::get('/budget-periods/{budgetPeriod}', [BudgetPeriodController::class, 'show']);
    Route::get('/budget-periods/{budgetPeriod}/lines', [BudgetLineController::class, 'index']);

    // Goals (read)
    Route::get('/goals', [GoalController::class, 'index']);
    Route::get('/goals/{goal}', [GoalController::class, 'show']);

    // Debts (read)
    Route::get('/debts', [DebtController::class, 'index']);
    Route::get('/debts/{debt}', [DebtController::class, 'show']);

    // Recurring Bills (read)
    Route::get('/recurring-bills/due-soon', [RecurringBillController::class, 'dueSoon']);
    Route::get('/recurring-bills', [RecurringBillController::class, 'index']);
    Route::get('/recurring-bills/{recurringBill}', [RecurringBillController::class, 'show']);

    // Transfers (read)
    Route::get('/transfers', [TransferController::class, 'index']);

    // Funds (read)
    Route::get('/funds', [FundController::class, 'index']);
    Route::get('/funds/{fund}', [FundController::class, 'show']);

    // Investment summary (read)
    Route::get('/investment-summary', [FundController::class, 'investmentSummary']);

    // Scenarios (read)
    Route::get('/scenarios', [ScenarioController::class, 'index']);
    Route::get('/scenarios/{scenario}', [ScenarioController::class, 'show']);

    // Budget Status (aggregated for TopBar)
    Route::get('/budget-status', [DashboardController::class, 'budgetStatus']);

    // Budget Settings (per-month overrides)
    Route::get('/budget-settings/{month}', [BudgetSettingController::class, 'show']);

    // Category budgets (read)
    Route::get('/category-budgets', [CategoryBudgetController::class, 'index']);
});

// ── Write endpoints with rate limiting ────────────────────────────
Route::middleware(['throttle:write'])->group(function () {
    // Jars (write)
    Route::put('/jars/{jar}', [JarController::class, 'update']);

    // Accounts (write)
    Route::post('/accounts', [AccountController::class, 'store']);
    Route::put('/accounts/{account}', [AccountController::class, 'update']);
    Route::delete('/accounts/{account}', [AccountController::class, 'destroy']);

    // Budget Periods (write)
    Route::post('/budget-periods', [BudgetPeriodController::class, 'store']);
    Route::put('/budget-periods/{budgetPeriod}', [BudgetPeriodController::class, 'update']);
    Route::post('/budget-periods/{budgetPeriod}/allocate', [BudgetPeriodController::class, 'allocate']);
    Route::post('/budget-periods/{budgetPeriod}/bonus', [BudgetPeriodController::class, 'bonus']);
    Route::put('/budget-periods/{budgetPeriod}/jar-override/{jarId}', [BudgetPeriodController::class, 'jarOverride']);

    // Budget Lines (write)
    Route::post('/budget-lines', [BudgetLineController::class, 'store']);
    Route::put('/budget-lines/{budgetLine}', [BudgetLineController::class, 'update']);
    Route::delete('/budget-lines/{budgetLine}', [BudgetLineController::class, 'destroy']);

    // Goals (write)
    Route::post('/goals', [GoalController::class, 'store']);
    Route::put('/goals/{goal}', [GoalController::class, 'update']);
    Route::delete('/goals/{goal}', [GoalController::class, 'destroy']);
    Route::post('/goals/{goal}/contribute', [GoalController::class, 'contribute']);

    // Debts (write)
    Route::post('/debts', [DebtController::class, 'store']);
    Route::put('/debts/{debt}', [DebtController::class, 'update']);
    Route::delete('/debts/{debt}', [DebtController::class, 'destroy']);
    Route::post('/debts/{debt}/pay', [DebtController::class, 'pay']);

    // Recurring Bills (write)
    Route::post('/recurring-bills', [RecurringBillController::class, 'store']);
    Route::put('/recurring-bills/{recurringBill}', [RecurringBillController::class, 'update']);
    Route::delete('/recurring-bills/{recurringBill}', [RecurringBillController::class, 'destroy']);

    // Transfers (write)
    Route::post('/transfers', [TransferController::class, 'store']);

    // Funds (write)
    Route::post('/funds', [FundController::class, 'store']);
    Route::put('/funds/{fund}', [FundController::class, 'update']);
    Route::delete('/funds/{fund}', [FundController::class, 'destroy']);
    Route::post('/funds/{fund}/reserve', [FundController::class, 'reserve']);
    Route::post('/funds/{fund}/spend', [FundController::class, 'spend']);

    // Budget Settings (write)
    Route::put('/budget-settings/{month}', [BudgetSettingController::class, 'update']);

    // Category budgets (write)
    Route::post('/category-budgets', [CategoryBudgetController::class, 'store']);
    Route::put('/category-budgets/{categoryBudget}', [CategoryBudgetController::class, 'update']);
    Route::delete('/category-budgets/{categoryBudget}', [CategoryBudgetController::class, 'destroy']);

    // Budget Period close
    Route::post('/budget-periods/{budgetPeriod}/close', [BudgetPeriodController::class, 'close']);

    // Scenarios (write)
    Route::post('/scenarios/simulate', [ScenarioController::class, 'simulate']);
});
