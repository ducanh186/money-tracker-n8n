<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\MonthlyBudgetSummaryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MonthlySummaryController extends Controller
{
    public function __construct(
        private readonly MonthlyBudgetSummaryService $summaryService,
    ) {}

    public function __invoke(Request $request): JsonResponse
    {
        $month = $request->query('month');
        if (empty($month)) {
            return response()->json([
                'error' => 'validation_error',
                'message' => 'The "month" query parameter is required.',
            ], 400);
        }

        try {
            return response()->json(['data' => $this->summaryService->summary((string) $month)]);
        } catch (\Throwable) {
            return response()->json([
                'error' => 'summary_error',
                'message' => 'Could not compute monthly summary.',
            ], 500);
        }
    }
}
