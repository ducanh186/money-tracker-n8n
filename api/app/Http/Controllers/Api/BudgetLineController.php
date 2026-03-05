<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\StoreBudgetLineRequest;
use App\Models\BudgetLine;
use App\Models\BudgetPeriod;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class BudgetLineController extends Controller
{
    /**
     * GET /api/budget-periods/{periodId}/lines
     */
    public function index(BudgetPeriod $budgetPeriod): JsonResponse
    {
        $lines = BudgetLine::whereHas('jarAllocation', function ($q) use ($budgetPeriod) {
            $q->where('budget_period_id', $budgetPeriod->id);
        })
            ->with(['jarAllocation.jar', 'goal', 'debt', 'recurringBill'])
            ->get()
            ->map(fn (BudgetLine $line) => [
                'id'                => $line->id,
                'jar_key'           => $line->jarAllocation->jar->key,
                'jar_label'         => $line->jarAllocation->jar->label,
                'name'              => $line->name,
                'type'              => $line->type,
                'planned_amount'    => $line->planned_amount,
                'actual_amount'     => $line->actual_amount,
                'remaining'         => $line->remaining,
                'usage_pct'         => $line->usage_percent,
                'goal_id'           => $line->goal_id,
                'debt_id'           => $line->debt_id,
                'recurring_bill_id' => $line->recurring_bill_id,
                'notes'             => $line->notes,
            ]);

        return response()->json([
            'data' => $lines,
        ]);
    }

    /**
     * POST /api/budget-lines
     */
    public function store(StoreBudgetLineRequest $request): JsonResponse
    {
        $line = BudgetLine::create($request->validated());

        return response()->json([
            'data'    => $line->load(['jarAllocation.jar', 'goal', 'debt', 'recurringBill']),
            'message' => 'Budget line created.',
        ], 201);
    }

    /**
     * PUT /api/budget-lines/{id}
     */
    public function update(Request $request, BudgetLine $budgetLine): JsonResponse
    {
        $validated = $request->validate([
            'name'           => ['sometimes', 'string', 'max:255'],
            'type'           => ['sometimes', 'in:general,goal,bill,debt,sinking_fund'],
            'planned_amount' => ['sometimes', 'integer', 'min:0'],
            'actual_amount'  => ['sometimes', 'integer', 'min:0'],
            'notes'          => ['sometimes', 'nullable', 'string'],
        ]);

        $budgetLine->update($validated);

        return response()->json([
            'data'    => $budgetLine->fresh()->load(['jarAllocation.jar', 'goal', 'debt', 'recurringBill']),
            'message' => 'Budget line updated.',
        ]);
    }

    /**
     * DELETE /api/budget-lines/{id}
     */
    public function destroy(BudgetLine $budgetLine): JsonResponse
    {
        $budgetLine->delete();

        return response()->json([
            'message' => 'Budget line deleted.',
        ]);
    }
}
