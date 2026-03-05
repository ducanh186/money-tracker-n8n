<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\StoreDebtRequest;
use App\Models\Debt;
use App\Models\DebtPayment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;

class DebtController extends Controller
{
    /**
     * GET /api/debts
     */
    public function index(Request $request): JsonResponse
    {
        $query = Debt::with('payments');

        if ($request->has('status')) {
            $query->where('status', $request->query('status'));
        }

        $strategy = $request->query('strategy', 'snowball');
        $query->byStrategy($strategy);

        $debts = $query->get()->map(fn (Debt $d) => [
            'id'               => $d->id,
            'name'             => $d->name,
            'total_amount'     => $d->total_amount,
            'remaining_amount' => $d->remaining_amount,
            'paid_amount'      => $d->paid_amount,
            'progress_pct'     => $d->progress_percent,
            'interest_rate'    => $d->interest_rate,
            'minimum_payment'  => $d->minimum_payment,
            'due_day_of_month' => $d->due_day_of_month,
            'days_until_due'   => $d->days_until_due,
            'strategy'         => $d->strategy,
            'status'           => $d->status,
            'notes'            => $d->notes,
            'total_paid'       => $d->payments->sum('amount'),
            'total_interest_paid' => $d->payments->sum('interest'),
        ]);

        return response()->json([
            'data'    => $debts,
            'summary' => [
                'total_debt'      => $debts->sum('remaining_amount'),
                'total_minimum'   => $debts->sum('minimum_payment'),
                'count_active'    => $debts->where('status', 'active')->count(),
            ],
        ]);
    }

    /**
     * POST /api/debts
     */
    public function store(StoreDebtRequest $request): JsonResponse
    {
        $debt = Debt::create($request->validated());

        return response()->json([
            'data'    => $debt,
            'message' => 'Debt created.',
        ], 201);
    }

    /**
     * GET /api/debts/{id}
     */
    public function show(Debt $debt): JsonResponse
    {
        $debt->load('payments.budgetPeriod');

        return response()->json([
            'data' => [
                'id'               => $debt->id,
                'name'             => $debt->name,
                'total_amount'     => $debt->total_amount,
                'remaining_amount' => $debt->remaining_amount,
                'paid_amount'      => $debt->paid_amount,
                'progress_pct'     => $debt->progress_percent,
                'interest_rate'    => $debt->interest_rate,
                'minimum_payment'  => $debt->minimum_payment,
                'due_day_of_month' => $debt->due_day_of_month,
                'days_until_due'   => $debt->days_until_due,
                'strategy'         => $debt->strategy,
                'status'           => $debt->status,
                'notes'            => $debt->notes,
                'payments'         => $debt->payments->map(fn ($p) => [
                    'id'        => $p->id,
                    'amount'    => $p->amount,
                    'principal' => $p->principal,
                    'interest'  => $p->interest,
                    'period'    => $p->budgetPeriod?->month,
                    'paid_at'   => $p->paid_at,
                ]),
            ],
        ]);
    }

    /**
     * PUT /api/debts/{id}
     */
    public function update(Request $request, Debt $debt): JsonResponse
    {
        $validated = $request->validate([
            'name'             => ['sometimes', 'string', 'max:255'],
            'remaining_amount' => ['sometimes', 'integer', 'min:0'],
            'interest_rate'    => ['sometimes', 'numeric', 'min:0', 'max:100'],
            'minimum_payment'  => ['sometimes', 'integer', 'min:0'],
            'due_day_of_month' => ['sometimes', 'nullable', 'integer', 'min:1', 'max:31'],
            'strategy'         => ['sometimes', 'in:snowball,avalanche'],
            'status'           => ['sometimes', 'in:active,paid_off,defaulted'],
            'notes'            => ['sometimes', 'nullable', 'string'],
        ]);

        $debt->update($validated);

        return response()->json([
            'data'    => $debt->fresh(),
            'message' => 'Debt updated.',
        ]);
    }

    /**
     * DELETE /api/debts/{id}
     */
    public function destroy(Debt $debt): JsonResponse
    {
        $debt->delete();

        return response()->json([
            'message' => 'Debt deleted.',
        ]);
    }

    /**
     * POST /api/debts/{id}/pay
     *
     * Record a debt payment.
     */
    public function pay(Request $request, Debt $debt): JsonResponse
    {
        $validated = $request->validate([
            'amount'           => ['required', 'integer', 'min:1'],
            'principal'        => ['sometimes', 'integer', 'min:0'],
            'interest'         => ['sometimes', 'integer', 'min:0'],
            'budget_period_id' => ['sometimes', 'nullable', 'exists:budget_periods,id'],
        ]);

        return DB::transaction(function () use ($debt, $validated) {
            $principal = $validated['principal'] ?? $validated['amount'];
            $interest = $validated['interest'] ?? 0;

            $payment = DebtPayment::create([
                'debt_id'          => $debt->id,
                'budget_period_id' => $validated['budget_period_id'] ?? null,
                'amount'           => $validated['amount'],
                'principal'        => $principal,
                'interest'         => $interest,
                'paid_at'          => now(),
            ]);

            $debt->decrement('remaining_amount', $principal);

            // Auto mark as paid off
            if ($debt->fresh()->remaining_amount <= 0) {
                $debt->update([
                    'remaining_amount' => 0,
                    'status' => 'paid_off',
                ]);
            }

            return response()->json([
                'data'    => $payment,
                'debt'    => [
                    'remaining_amount' => $debt->fresh()->remaining_amount,
                    'progress_pct'     => $debt->fresh()->progress_percent,
                    'status'           => $debt->fresh()->status,
                ],
                'message' => 'Payment recorded.',
            ], 201);
        });
    }
}
