<?php

use App\Http\Controllers\Api\TransactionsController;
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
