<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\StoreGoalRequest;
use App\Models\Goal;
use App\Models\GoalContribution;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;

class GoalController extends Controller
{
    /**
     * GET /api/goals
     */
    public function index(Request $request): JsonResponse
    {
        $query = Goal::with('jar', 'contributions');

        if ($request->has('status')) {
            $query->where('status', $request->query('status'));
        }

        $goals = $query->orderByDesc('priority')->orderBy('deadline')->get()->map(fn (Goal $g) => [
            'id'              => $g->id,
            'name'            => $g->name,
            'target_amount'   => $g->target_amount,
            'current_amount'  => $g->current_amount,
            'shortfall'       => $g->shortfall,
            'progress_pct'    => $g->progress_percent,
            'jar'             => $g->jar ? ['key' => $g->jar->key, 'label' => $g->jar->label] : null,
            'deadline'        => $g->deadline?->format('Y-m-d'),
            'priority'        => $g->priority,
            'funding_mode'    => $g->funding_mode,
            'status'          => $g->status,
            'notes'           => $g->notes,
            'contributions_count' => $g->contributions->count(),
            'created_at'      => $g->created_at,
        ]);

        return response()->json([
            'data' => $goals,
        ]);
    }

    /**
     * POST /api/goals
     */
    public function store(StoreGoalRequest $request): JsonResponse
    {
        $goal = Goal::create($request->validated());

        return response()->json([
            'data'    => $goal->load('jar'),
            'message' => 'Goal created.',
        ], 201);
    }

    /**
     * GET /api/goals/{id}
     */
    public function show(Goal $goal): JsonResponse
    {
        $goal->load(['jar', 'contributions.sourceJar', 'contributions.budgetPeriod']);

        return response()->json([
            'data' => [
                'id'              => $goal->id,
                'name'            => $goal->name,
                'target_amount'   => $goal->target_amount,
                'current_amount'  => $goal->current_amount,
                'shortfall'       => $goal->shortfall,
                'progress_pct'    => $goal->progress_percent,
                'jar'             => $goal->jar ? ['key' => $goal->jar->key, 'label' => $goal->jar->label] : null,
                'deadline'        => $goal->deadline?->format('Y-m-d'),
                'priority'        => $goal->priority,
                'funding_mode'    => $goal->funding_mode,
                'status'          => $goal->status,
                'notes'           => $goal->notes,
                'contributions'   => $goal->contributions->map(fn ($c) => [
                    'id'            => $c->id,
                    'amount'        => $c->amount,
                    'source_jar'    => $c->sourceJar ? $c->sourceJar->key : null,
                    'period'        => $c->budgetPeriod?->month,
                    'notes'         => $c->notes,
                    'contributed_at' => $c->contributed_at,
                ]),
            ],
        ]);
    }

    /**
     * PUT /api/goals/{id}
     */
    public function update(Request $request, Goal $goal): JsonResponse
    {
        $validated = $request->validate([
            'name'          => ['sometimes', 'string', 'max:255'],
            'target_amount' => ['sometimes', 'integer', 'min:1'],
            'jar_id'        => ['sometimes', 'nullable', 'exists:jars,id'],
            'deadline'      => ['sometimes', 'nullable', 'date'],
            'priority'      => ['sometimes', 'integer', 'min:0', 'max:255'],
            'funding_mode'  => ['sometimes', 'in:fund_now,fund_over_time'],
            'status'        => ['sometimes', 'in:active,completed,paused,cancelled'],
            'notes'         => ['sometimes', 'nullable', 'string'],
        ]);

        $goal->update($validated);

        return response()->json([
            'data'    => $goal->fresh()->load('jar'),
            'message' => 'Goal updated.',
        ]);
    }

    /**
     * DELETE /api/goals/{id}
     */
    public function destroy(Goal $goal): JsonResponse
    {
        $goal->delete();

        return response()->json([
            'message' => 'Goal deleted.',
        ]);
    }

    /**
     * POST /api/goals/{id}/contribute
     *
     * Add money to a goal.
     */
    public function contribute(Request $request, Goal $goal): JsonResponse
    {
        $validated = $request->validate([
            'amount'           => ['required', 'integer', 'min:1'],
            'source_jar_id'    => ['sometimes', 'nullable', 'exists:jars,id'],
            'budget_period_id' => ['sometimes', 'nullable', 'exists:budget_periods,id'],
            'notes'            => ['sometimes', 'nullable', 'string'],
        ]);

        return DB::transaction(function () use ($goal, $validated) {
            $contribution = GoalContribution::create([
                'goal_id'          => $goal->id,
                'budget_period_id' => $validated['budget_period_id'] ?? null,
                'amount'           => $validated['amount'],
                'source_jar_id'    => $validated['source_jar_id'] ?? null,
                'notes'            => $validated['notes'] ?? null,
                'contributed_at'   => now(),
            ]);

            $goal->increment('current_amount', $validated['amount']);

            // Auto-complete if target reached
            if ($goal->fresh()->current_amount >= $goal->target_amount) {
                $goal->update(['status' => 'completed']);
            }

            return response()->json([
                'data'    => $contribution->load('sourceJar'),
                'goal'    => [
                    'current_amount' => $goal->fresh()->current_amount,
                    'progress_pct'   => $goal->fresh()->progress_percent,
                    'status'         => $goal->fresh()->status,
                ],
                'message' => 'Contribution recorded.',
            ], 201);
        });
    }
}
