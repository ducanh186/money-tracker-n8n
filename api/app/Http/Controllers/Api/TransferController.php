<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\StoreTransferRequest;
use App\Models\Account;
use App\Models\Transfer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;

class TransferController extends Controller
{
    /**
     * GET /api/transfers
     */
    public function index(Request $request): JsonResponse
    {
        $query = Transfer::with(['fromAccount', 'toAccount', 'goal', 'jar', 'budgetPeriod']);

        if ($request->has('budget_period_id')) {
            $query->where('budget_period_id', $request->query('budget_period_id'));
        }

        $transfers = $query->orderByDesc('transferred_at')->get()->map(fn (Transfer $t) => [
            'id'              => $t->id,
            'from_account'    => $t->fromAccount ? ['id' => $t->fromAccount->id, 'name' => $t->fromAccount->name] : null,
            'to_account'      => $t->toAccount ? ['id' => $t->toAccount->id, 'name' => $t->toAccount->name] : null,
            'amount'          => $t->amount,
            'goal'            => $t->goal ? ['id' => $t->goal->id, 'name' => $t->goal->name] : null,
            'jar'             => $t->jar ? ['key' => $t->jar->key, 'label' => $t->jar->label] : null,
            'description'     => $t->description,
            'transferred_at'  => $t->transferred_at,
            'period'          => $t->budgetPeriod?->month,
        ]);

        return response()->json([
            'data' => $transfers,
        ]);
    }

    /**
     * POST /api/transfers
     *
     * Create a transfer between accounts.
     * Updates both account balances and optionally links to a goal.
     */
    public function store(StoreTransferRequest $request): JsonResponse
    {
        $validated = $request->validated();

        return DB::transaction(function () use ($validated) {
            $transfer = Transfer::create(array_merge($validated, [
                'transferred_at' => $validated['transferred_at'] ?? now(),
            ]));

            // Update account balances
            Account::where('id', $validated['from_account_id'])
                ->decrement('balance', $validated['amount']);

            Account::where('id', $validated['to_account_id'])
                ->increment('balance', $validated['amount']);

            // If linked to a goal, record as a contribution
            if (!empty($validated['goal_id'])) {
                $goal = \App\Models\Goal::find($validated['goal_id']);
                if ($goal) {
                    \App\Models\GoalContribution::create([
                        'goal_id'          => $goal->id,
                        'budget_period_id' => $validated['budget_period_id'] ?? null,
                        'amount'           => $validated['amount'],
                        'source_jar_id'    => $validated['jar_id'] ?? null,
                        'notes'            => 'Transfer: ' . ($validated['description'] ?? ''),
                        'contributed_at'   => $validated['transferred_at'] ?? now(),
                    ]);

                    $goal->increment('current_amount', $validated['amount']);

                    if ($goal->fresh()->current_amount >= $goal->target_amount) {
                        $goal->update(['status' => 'completed']);
                    }
                }
            }

            $transfer->load(['fromAccount', 'toAccount', 'goal', 'jar']);

            return response()->json([
                'data'    => $transfer,
                'message' => 'Transfer recorded. Account balances updated.',
            ], 201);
        });
    }
}
