<?php

use App\Http\Controllers\Api\TransactionsController;
use Illuminate\Support\Facades\Route;

// Health check endpoint
Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'timestamp' => now()->toISOString(),
    ]);
});

Route::prefix('transactions')->group(function () {
    Route::get('/', [TransactionsController::class, 'index']);
    Route::get('/{idempotencyKey}', [TransactionsController::class, 'show']);
});
