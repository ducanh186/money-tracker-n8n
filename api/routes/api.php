<?php

use App\Http\Controllers\Api\AccountController;
use App\Http\Controllers\Api\BudgetLineController;
use App\Http\Controllers\Api\BudgetPeriodController;
use App\Http\Controllers\Api\BudgetPlanController;
use App\Http\Controllers\Api\DebtController;
use App\Http\Controllers\Api\GoalController;
use App\Http\Controllers\Api\JarController;
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

// ══════════════════════════════════════════════════════════════════════
// ZBB + 6 Jars Budgeting System
// ══════════════════════════════════════════════════════════════════════

// Jars (6 hũ)
Route::prefix('jars')->group(function () {
    Route::get('/', [JarController::class, 'index']);
    Route::get('/{jar}', [JarController::class, 'show']);
    Route::put('/{jar}', [JarController::class, 'update']);
});

// Accounts (multi-bank)
Route::prefix('accounts')->group(function () {
    Route::get('/net-worth', [AccountController::class, 'netWorth']);
    Route::get('/', [AccountController::class, 'index']);
    Route::post('/', [AccountController::class, 'store']);
    Route::get('/{account}', [AccountController::class, 'show']);
    Route::put('/{account}', [AccountController::class, 'update']);
    Route::delete('/{account}', [AccountController::class, 'destroy']);
});

// Budget Periods (monthly workspace)
Route::prefix('budget-periods')->group(function () {
    Route::get('/', [BudgetPeriodController::class, 'index']);
    Route::post('/', [BudgetPeriodController::class, 'store']);
    Route::get('/{budgetPeriod}', [BudgetPeriodController::class, 'show']);
    Route::put('/{budgetPeriod}', [BudgetPeriodController::class, 'update']);
    Route::post('/{budgetPeriod}/allocate', [BudgetPeriodController::class, 'allocate']);
    Route::post('/{budgetPeriod}/bonus', [BudgetPeriodController::class, 'bonus']);
    Route::put('/{budgetPeriod}/jar-override/{jarId}', [BudgetPeriodController::class, 'jarOverride']);
    Route::get('/{budgetPeriod}/lines', [BudgetLineController::class, 'index']);
});

// Budget Lines (ZBB detail lines within jars)
Route::prefix('budget-lines')->group(function () {
    Route::post('/', [BudgetLineController::class, 'store']);
    Route::put('/{budgetLine}', [BudgetLineController::class, 'update']);
    Route::delete('/{budgetLine}', [BudgetLineController::class, 'destroy']);
});

// Goals & Sinking Funds
Route::prefix('goals')->group(function () {
    Route::get('/', [GoalController::class, 'index']);
    Route::post('/', [GoalController::class, 'store']);
    Route::get('/{goal}', [GoalController::class, 'show']);
    Route::put('/{goal}', [GoalController::class, 'update']);
    Route::delete('/{goal}', [GoalController::class, 'destroy']);
    Route::post('/{goal}/contribute', [GoalController::class, 'contribute']);
});

// Debts
Route::prefix('debts')->group(function () {
    Route::get('/', [DebtController::class, 'index']);
    Route::post('/', [DebtController::class, 'store']);
    Route::get('/{debt}', [DebtController::class, 'show']);
    Route::put('/{debt}', [DebtController::class, 'update']);
    Route::delete('/{debt}', [DebtController::class, 'destroy']);
    Route::post('/{debt}/pay', [DebtController::class, 'pay']);
});

// Recurring Bills
Route::prefix('recurring-bills')->group(function () {
    Route::get('/due-soon', [RecurringBillController::class, 'dueSoon']);
    Route::get('/', [RecurringBillController::class, 'index']);
    Route::post('/', [RecurringBillController::class, 'store']);
    Route::get('/{recurringBill}', [RecurringBillController::class, 'show']);
    Route::put('/{recurringBill}', [RecurringBillController::class, 'update']);
    Route::delete('/{recurringBill}', [RecurringBillController::class, 'destroy']);
});

// Transfers (between accounts)
Route::prefix('transfers')->group(function () {
    Route::get('/', [TransferController::class, 'index']);
    Route::post('/', [TransferController::class, 'store']);
});

// Scenarios (what-if simulation)
Route::prefix('scenarios')->group(function () {
    Route::post('/simulate', [ScenarioController::class, 'simulate']);
    Route::get('/', [ScenarioController::class, 'index']);
    Route::get('/{scenario}', [ScenarioController::class, 'show']);
});
