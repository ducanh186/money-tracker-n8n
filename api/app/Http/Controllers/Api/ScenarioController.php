<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\SimulateScenarioRequest;
use App\Models\Scenario;
use App\Services\ScenarioService;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;

class ScenarioController extends Controller
{
    public function __construct(
        private readonly ScenarioService $scenarioService,
    ) {}

    /**
     * POST /api/scenarios/simulate
     *
     * "What if I buy X?" — returns proposals and impact analysis.
     */
    public function simulate(SimulateScenarioRequest $request): JsonResponse
    {
        $result = $this->scenarioService->simulate(
            name: $request->input('name'),
            purchaseAmount: $request->integer('purchase_amount'),
            targetJarKey: $request->input('target_jar_key'),
            month: $request->input('month'),
        );

        if (isset($result['error'])) {
            return response()->json($result, 422);
        }

        return response()->json([
            'data' => $result,
        ], 201);
    }

    /**
     * GET /api/scenarios
     */
    public function index(): JsonResponse
    {
        $scenarios = Scenario::with(['budgetPeriod', 'targetJar'])
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'data' => $scenarios,
        ]);
    }

    /**
     * GET /api/scenarios/{id}
     */
    public function show(Scenario $scenario): JsonResponse
    {
        $scenario->load(['budgetPeriod', 'targetJar']);

        return response()->json([
            'data' => $scenario,
        ]);
    }
}
