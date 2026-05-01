<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\BalanceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BalanceController extends Controller
{
    public function __construct(
        private readonly BalanceService $balanceService,
    ) {}

    public function month(Request $request): JsonResponse
    {
        $month = $request->query('month');
        if (empty($month)) {
            return response()->json([
                'error' => 'validation_error',
                'message' => 'The "month" query parameter is required.',
            ], 400);
        }

        try {
            return response()->json(['data' => $this->balanceService->forMonth((string) $month)]);
        } catch (\Throwable) {
            return response()->json([
                'error' => 'balance_error',
                'message' => 'Could not compute balances.',
            ], 500);
        }
    }

    public function asOf(Request $request): JsonResponse
    {
        $date = $request->query('date');
        if (empty($date)) {
            return response()->json([
                'error' => 'validation_error',
                'message' => 'The "date" query parameter is required.',
            ], 400);
        }

        try {
            return response()->json(['data' => $this->balanceService->asOf((string) $date)]);
        } catch (\Throwable) {
            return response()->json([
                'error' => 'balance_error',
                'message' => 'Could not compute balance for the requested date.',
            ], 500);
        }
    }
}
