<?php

namespace App\Http\Controllers\Api;

use App\Models\CategoryBudget;
use App\Models\BudgetPeriod;
use App\Support\BudgetMonth;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Cache;
use Illuminate\Validation\Rule;

class CategoryBudgetController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $month = $request->query('month');
        if (empty($month)) {
            return response()->json([
                'error' => 'validation_error',
                'message' => 'The "month" query parameter is required.',
            ], 400);
        }

        $budgetMonth = BudgetMonth::parse((string) $month);
        $period = BudgetPeriod::query()
            ->where('year', $budgetMonth->year)
            ->where('month_num', $budgetMonth->monthNum)
            ->first();

        if (!$period) {
            return response()->json(['data' => []]);
        }

        return response()->json([
            'data' => CategoryBudget::query()
                ->where('budget_period_id', $period->id)
                ->with('category')
                ->get()
                ->map(fn (CategoryBudget $budget) => $this->serialize($budget)),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'budget_period_id' => ['required', 'integer', 'exists:budget_periods,id'],
            'category_id' => [
                'required',
                'integer',
                'exists:categories,id',
                Rule::unique('category_budgets')->where(
                    fn ($query) => $query->where('budget_period_id', $request->integer('budget_period_id'))
                ),
            ],
            'budgeted_amount' => ['required', 'integer', 'min:0'],
            'reserved_amount' => ['sometimes', 'integer', 'min:0'],
            'rollover_amount' => ['sometimes', 'integer', 'min:0'],
            'notes' => ['sometimes', 'nullable', 'string'],
        ]);

        $budget = CategoryBudget::create($validated)->load('category');
        $this->forgetSummaryCache($budget);

        return response()->json([
            'data' => $this->serialize($budget),
            'message' => 'Category budget created.',
        ], 201);
    }

    public function update(Request $request, CategoryBudget $categoryBudget): JsonResponse
    {
        $validated = $request->validate([
            'budgeted_amount' => ['sometimes', 'integer', 'min:0'],
            'reserved_amount' => ['sometimes', 'integer', 'min:0'],
            'rollover_amount' => ['sometimes', 'integer', 'min:0'],
            'notes' => ['sometimes', 'nullable', 'string'],
        ]);

        $categoryBudget->update($validated);
        $categoryBudget->load('category');
        $this->forgetSummaryCache($categoryBudget);

        return response()->json([
            'data' => $this->serialize($categoryBudget),
            'message' => 'Category budget updated.',
        ]);
    }

    public function destroy(CategoryBudget $categoryBudget): JsonResponse
    {
        $this->forgetSummaryCache($categoryBudget);
        $categoryBudget->delete();

        return response()->json(['message' => 'Category budget deleted.']);
    }

    private function serialize(CategoryBudget $budget): array
    {
        $budget->loadMissing('category');

        return [
            'id' => $budget->id,
            'budget_period_id' => $budget->budget_period_id,
            'category_id' => $budget->category_id,
            'category_key' => $budget->category?->key,
            'category_name' => $budget->category?->name,
            'budgeted_amount' => $budget->budgeted_amount,
            'reserved_amount' => $budget->reserved_amount,
            'rollover_amount' => $budget->rollover_amount,
            'notes' => $budget->notes,
        ];
    }

    private function forgetSummaryCache(CategoryBudget $budget): void
    {
        $month = $budget->budgetPeriod()->value('month');
        if (!$month) {
            return;
        }

        Cache::forget('budget_status_v2_' . md5($month));
        Cache::forget('dashboard_summary_v2_' . md5($month));
    }
}
