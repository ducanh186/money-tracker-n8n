<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\StoreRecurringBillRequest;
use App\Models\RecurringBill;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class RecurringBillController extends Controller
{
    /**
     * GET /api/recurring-bills
     */
    public function index(): JsonResponse
    {
        $bills = RecurringBill::with('jar')
            ->active()
            ->orderBy('next_due_date')
            ->get()
            ->map(fn (RecurringBill $b) => [
                'id'             => $b->id,
                'name'           => $b->name,
                'amount'         => $b->amount,
                'monthly_amount' => $b->monthly_amount,
                'frequency'      => $b->frequency,
                'jar'            => $b->jar ? ['key' => $b->jar->key, 'label' => $b->jar->label] : null,
                'due_day'        => $b->due_day,
                'next_due_date'  => $b->next_due_date?->format('Y-m-d'),
                'days_until_due' => $b->days_until_due,
                'category'       => $b->category,
                'is_active'      => $b->is_active,
                'notes'          => $b->notes,
            ]);

        $totalMonthly = $bills->sum('monthly_amount');

        return response()->json([
            'data'    => $bills,
            'summary' => [
                'total_monthly_forecast' => $totalMonthly,
                'due_soon'               => $bills->where('days_until_due', '<=', 7)->count(),
            ],
        ]);
    }

    /**
     * POST /api/recurring-bills
     */
    public function store(StoreRecurringBillRequest $request): JsonResponse
    {
        $bill = RecurringBill::create($request->validated());

        return response()->json([
            'data'    => $bill->load('jar'),
            'message' => 'Recurring bill created.',
        ], 201);
    }

    /**
     * GET /api/recurring-bills/{id}
     */
    public function show(RecurringBill $recurringBill): JsonResponse
    {
        return response()->json([
            'data' => $recurringBill->load('jar'),
        ]);
    }

    /**
     * PUT /api/recurring-bills/{id}
     */
    public function update(Request $request, RecurringBill $recurringBill): JsonResponse
    {
        $validated = $request->validate([
            'name'          => ['sometimes', 'string', 'max:255'],
            'amount'        => ['sometimes', 'integer', 'min:1'],
            'frequency'     => ['sometimes', 'in:monthly,quarterly,semi_annually,annually'],
            'jar_id'        => ['sometimes', 'nullable', 'exists:jars,id'],
            'due_day'       => ['sometimes', 'nullable', 'integer', 'min:1', 'max:31'],
            'next_due_date' => ['sometimes', 'nullable', 'date'],
            'category'      => ['sometimes', 'nullable', 'string', 'max:100'],
            'is_active'     => ['sometimes', 'boolean'],
            'notes'         => ['sometimes', 'nullable', 'string'],
        ]);

        $recurringBill->update($validated);

        return response()->json([
            'data'    => $recurringBill->fresh()->load('jar'),
            'message' => 'Recurring bill updated.',
        ]);
    }

    /**
     * DELETE /api/recurring-bills/{id}
     */
    public function destroy(RecurringBill $recurringBill): JsonResponse
    {
        $recurringBill->delete();

        return response()->json([
            'message' => 'Recurring bill deleted.',
        ]);
    }

    /**
     * GET /api/recurring-bills/due-soon
     *
     * Bills due in the next N days.
     */
    public function dueSoon(Request $request): JsonResponse
    {
        $days = $request->integer('days', 7);

        $bills = RecurringBill::with('jar')
            ->dueSoon($days)
            ->orderBy('next_due_date')
            ->get();

        return response()->json([
            'data'             => $bills,
            'days_ahead'       => $days,
            'total_due_amount' => $bills->sum('amount'),
        ]);
    }
}
