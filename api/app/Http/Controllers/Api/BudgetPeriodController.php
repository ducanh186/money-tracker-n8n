<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\StoreBudgetPeriodRequest;
use App\Http\Requests\UpdateBudgetPeriodRequest;
use App\Models\BudgetPeriod;
use App\Services\BudgetAllocationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class BudgetPeriodController extends Controller
{
    public function __construct(
        private readonly BudgetAllocationService $allocationService,
    ) {}

    /**
     * GET /api/budget-periods
     */
    public function index(): JsonResponse
    {
        $periods = BudgetPeriod::orderByDesc('year')
            ->orderByDesc('month_num')
            ->get();

        return response()->json([
            'data' => $periods,
        ]);
    }

    /**
     * POST /api/budget-periods
     *
     * Create a new budget period and auto-allocate income to jars.
     */
    public function store(StoreBudgetPeriodRequest $request): JsonResponse
    {
        $period = BudgetPeriod::create($request->validated());

        // Auto-allocate income to jars based on default %
        $period = $this->allocationService->allocateIncome($period, $period->total_income);

        return response()->json([
            'data'    => $this->allocationService->getWorkspace($period),
            'message' => 'Budget period created and income allocated.',
        ], 201);
    }

    /**
     * GET /api/budget-periods/{id}
     *
     * Full workspace view.
     */
    public function show(BudgetPeriod $budgetPeriod): JsonResponse
    {
        return response()->json([
            'data' => $this->allocationService->getWorkspace($budgetPeriod),
        ]);
    }

    /**
     * PUT /api/budget-periods/{id}
     */
    public function update(UpdateBudgetPeriodRequest $request, BudgetPeriod $budgetPeriod): JsonResponse
    {
        $budgetPeriod->update($request->validated());

        // Re-allocate if income changed
        if ($request->has('total_income')) {
            $this->allocationService->allocateIncome($budgetPeriod, $request->integer('total_income'));
        }

        return response()->json([
            'data'    => $this->allocationService->getWorkspace($budgetPeriod),
            'message' => 'Budget period updated.',
        ]);
    }

    /**
     * POST /api/budget-periods/{id}/allocate
     *
     * Re-run auto-allocation with optional income override.
     */
    public function allocate(Request $request, BudgetPeriod $budgetPeriod): JsonResponse
    {
        $income = $request->integer('total_income', $budgetPeriod->total_income);

        $period = $this->allocationService->allocateIncome($budgetPeriod, $income);

        return response()->json([
            'data'    => $this->allocationService->getWorkspace($period),
            'message' => 'Income allocated to jars.',
        ]);
    }

    /**
     * POST /api/budget-periods/{id}/bonus
     *
     * Handle bonus / extra income.
     */
    public function bonus(Request $request, BudgetPeriod $budgetPeriod): JsonResponse
    {
        $request->validate([
            'amount' => ['required', 'integer', 'min:1'],
            'policy' => ['sometimes', 'in:savings_first,proportional'],
        ]);

        $period = $this->allocationService->allocateBonus(
            $budgetPeriod,
            $request->integer('amount'),
            $request->input('policy', 'savings_first')
        );

        return response()->json([
            'data'    => $this->allocationService->getWorkspace($period),
            'message' => 'Bonus allocated.',
        ]);
    }

    /**
     * PUT /api/budget-periods/{periodId}/jar-override/{jarId}
     *
     * Override a jar's percent allocation for this period.
     */
    public function jarOverride(Request $request, BudgetPeriod $budgetPeriod, int $jarId): JsonResponse
    {
        $request->validate([
            'percent' => ['required', 'numeric', 'min:0', 'max:100'],
        ]);

        $allocation = $this->allocationService->overrideJarPercent(
            $budgetPeriod,
            $jarId,
            $request->float('percent')
        );

        return response()->json([
            'data'    => $allocation,
            'message' => 'Jar percent overridden for this period.',
        ]);
    }
}
