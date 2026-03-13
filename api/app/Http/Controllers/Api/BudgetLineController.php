<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\StoreBudgetLineRequest;
use App\Models\BudgetLine;
use App\Models\BudgetPeriod;
use App\Models\JarAllocation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Validation\ValidationException;

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
            ->with(['jarAllocation.jar', 'goal', 'debt', 'recurringBill', 'fund'])
            ->get()
            ->map(fn (BudgetLine $line) => $this->serializeLine($line));

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
            'data'    => $this->serializeLine($line),
            'message' => 'Budget line created.',
        ], 201);
    }

    /**
     * PUT /api/budget-lines/{id}
     */
    public function update(Request $request, BudgetLine $budgetLine): JsonResponse
    {
        $validated = $request->validate([
            'jar_allocation_id' => ['sometimes', 'integer', 'exists:jar_allocations,id'],
            'name'           => ['sometimes', 'string', 'max:255'],
            'type'           => ['sometimes', 'in:general,goal,bill,debt,sinking_fund,investment'],
            'planned_amount' => ['sometimes', 'integer', 'min:0'],
            'actual_amount'  => ['sometimes', 'integer', 'min:0'],
            'goal_id'        => ['sometimes', 'nullable', 'exists:goals,id'],
            'debt_id'        => ['sometimes', 'nullable', 'exists:debts,id'],
            'recurring_bill_id' => ['sometimes', 'nullable', 'exists:recurring_bills,id'],
            'fund_id'        => ['sometimes', 'nullable', 'exists:funds,id'],
            'notes'          => ['sometimes', 'nullable', 'string'],
        ]);

        if (array_key_exists('jar_allocation_id', $validated)) {
            $targetAllocation = JarAllocation::find($validated['jar_allocation_id']);
            $currentPeriodId = $budgetLine->jarAllocation()->value('budget_period_id');

            if (!$targetAllocation || $targetAllocation->budget_period_id !== $currentPeriodId) {
                throw ValidationException::withMessages([
                    'jar_allocation_id' => ['Selected jar allocation must belong to the same budget period.'],
                ]);
            }
        }

        $budgetLine->update($validated);

        return response()->json([
            'data'    => $this->serializeLine($budgetLine->fresh()),
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

    private function serializeLine(BudgetLine $line): array
    {
        $line->loadMissing(['jarAllocation.jar', 'goal', 'debt', 'recurringBill', 'fund']);

        return [
            'id'                => $line->id,
            'jar_allocation_id' => $line->jar_allocation_id,
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
            'fund_id'           => $line->fund_id,
            'notes'             => $line->notes,
        ];
    }
}
