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

        $goals = $query
            ->orderByDesc('priority')
            ->orderBy('deadline')
            ->get()
            ->map(fn (Goal $goal) => $this->serializeGoal($goal));

        return response()->json([
            'data' => $goals,
        ]);
    }

    /**
     * POST /api/goals
     */
    public function store(StoreGoalRequest $request): JsonResponse
    {
        $goal = Goal::create($request->validated())->load('jar', 'contributions');

        return response()->json([
            'data'    => $this->serializeGoal($goal),
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
            'data' => $this->serializeGoal($goal, includeContributions: true),
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
            'data'    => $this->serializeGoal($goal->fresh()->load('jar', 'contributions')),
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
            ])->load(['sourceJar', 'budgetPeriod']);

            $goal->increment('current_amount', $validated['amount']);
            $goal = $goal->fresh();

            // Auto-complete if target reached
            if ($goal->current_amount >= $goal->target_amount && $goal->status !== 'completed') {
                $goal->update(['status' => 'completed']);
                $goal = $goal->fresh();
            }

            return response()->json([
                'data'    => $this->serializeContribution($contribution),
                'goal'    => [
                    'current_amount' => $goal->current_amount,
                    'progress_pct'   => $goal->progress_percent,
                    'status'         => $goal->status,
                ],
                'message' => 'Contribution recorded.',
            ], 201);
        });
    }

    private function serializeGoal(Goal $goal, bool $includeContributions = false): array
    {
        $goal->loadMissing('jar', 'contributions');

        $data = [
            'id'                  => $goal->id,
            'name'                => $goal->name,
            'target_amount'       => $goal->target_amount,
            'current_amount'      => $goal->current_amount,
            'shortfall'           => $goal->shortfall,
            'progress_pct'        => $goal->progress_percent,
            'jar'                 => $goal->jar ? ['key' => $goal->jar->key, 'label' => $goal->jar->label] : null,
            'deadline'            => $goal->deadline?->format('Y-m-d'),
            'priority'            => $goal->priority,
            'funding_mode'        => $goal->funding_mode,
            'status'              => $goal->status,
            'notes'               => $goal->notes,
            'contributions_count' => $goal->contributions->count(),
            'created_at'          => $goal->created_at,
        ];

        if ($includeContributions) {
            $goal->loadMissing('contributions.sourceJar', 'contributions.budgetPeriod');
            $data['contributions'] = $goal->contributions
                ->map(fn (GoalContribution $contribution) => $this->serializeContribution($contribution))
                ->values();
        }

        return $data;
    }

    private function serializeContribution(GoalContribution $contribution): array
    {
        $contribution->loadMissing('sourceJar', 'budgetPeriod');

        return [
            'id'             => $contribution->id,
            'amount'         => $contribution->amount,
            'source_jar'     => $contribution->sourceJar?->key,
            'period'         => $contribution->budgetPeriod?->month,
            'notes'          => $contribution->notes,
            'contributed_at' => $contribution->contributed_at,
        ];
    }
}
