<?php

namespace App\Http\Controllers\Api;

use App\Models\BudgetSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Cache;

class BudgetSettingController extends Controller
{
    /**
     * GET /api/budget-settings/{month}
     */
    public function show(string $month): JsonResponse
    {
        $setting = BudgetSetting::where('month', $month)->first();

        return response()->json([
            'data' => [
                'month' => $month,
                'base_income_override' => $setting?->base_income_override,
            ],
        ]);
    }

    /**
     * PUT /api/budget-settings/{month}
     */
    public function update(Request $request, string $month): JsonResponse
    {
        $validated = $request->validate([
            'base_income_override' => ['nullable', 'integer', 'min:0'],
        ]);

        $setting = BudgetSetting::updateOrCreate(
            ['month' => $month],
            $validated,
        );

        // Clear budget_plan cache for this month
        Cache::forget('budget_plan_' . md5($month . '|'));
        Cache::forget('budget_plan_' . md5($month . '|' . $setting->base_income_override));

        return response()->json([
            'data'    => [
                'month' => $month,
                'base_income_override' => $setting->base_income_override,
            ],
            'message' => 'Budget setting updated.',
        ]);
    }
}
