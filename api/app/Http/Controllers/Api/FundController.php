<?php

namespace App\Http\Controllers\Api;

use App\Models\Fund;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;

class FundController extends Controller
{
    /**
     * GET /api/funds?jar_id=X&status=active
     */
    public function index(Request $request): JsonResponse
    {
        $query = Fund::with('jar', 'goal');

        if ($request->has('jar_id')) {
            $query->where('jar_id', $request->query('jar_id'));
        }
        if ($request->has('status')) {
            $query->where('status', $request->query('status'));
        }

        $funds = $query->orderBy('sort_order')->get()->map(fn (Fund $f) => $this->serialize($f));

        return response()->json(['data' => $funds]);
    }

    /**
     * POST /api/funds
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'            => ['required', 'string', 'max:255'],
            'jar_id'          => ['required', 'exists:jars,id'],
            'goal_id'         => ['sometimes', 'nullable', 'exists:goals,id'],
            'target_amount'   => ['sometimes', 'integer', 'min:0'],
            'monthly_reserve' => ['sometimes', 'integer', 'min:0'],
            'notes'           => ['sometimes', 'nullable', 'string'],
            'sort_order'      => ['sometimes', 'integer', 'min:0'],
        ]);

        $fund = Fund::create($validated);

        return response()->json([
            'data'    => $this->serialize($fund->load('jar', 'goal')),
            'message' => 'Quỹ con đã được tạo.',
        ], 201);
    }

    /**
     * GET /api/funds/{fund}
     */
    public function show(Fund $fund): JsonResponse
    {
        return response()->json([
            'data' => $this->serialize($fund->load('jar', 'goal')),
        ]);
    }

    /**
     * PUT /api/funds/{fund}
     */
    public function update(Request $request, Fund $fund): JsonResponse
    {
        $validated = $request->validate([
            'name'            => ['sometimes', 'string', 'max:255'],
            'jar_id'          => ['sometimes', 'exists:jars,id'],
            'goal_id'         => ['sometimes', 'nullable', 'exists:goals,id'],
            'target_amount'   => ['sometimes', 'integer', 'min:0'],
            'monthly_reserve' => ['sometimes', 'integer', 'min:0'],
            'status'          => ['sometimes', 'in:active,completed,paused'],
            'notes'           => ['sometimes', 'nullable', 'string'],
            'sort_order'      => ['sometimes', 'integer', 'min:0'],
        ]);

        $fund->update($validated);

        return response()->json([
            'data'    => $this->serialize($fund->fresh()->load('jar', 'goal')),
            'message' => 'Quỹ con đã được cập nhật.',
        ]);
    }

    /**
     * DELETE /api/funds/{fund}
     */
    public function destroy(Fund $fund): JsonResponse
    {
        $fund->delete();

        return response()->json(['message' => 'Quỹ con đã được xoá.']);
    }

    /**
     * POST /api/funds/{fund}/reserve
     *
     * Add money to fund reserve (from jar available).
     */
    public function reserve(Request $request, Fund $fund): JsonResponse
    {
        $validated = $request->validate([
            'amount' => ['required', 'integer', 'min:1'],
        ]);

        return DB::transaction(function () use ($fund, $validated) {
            $fund->increment('reserved_amount', $validated['amount']);

            return response()->json([
                'data'    => $this->serialize($fund->fresh()->load('jar', 'goal')),
                'message' => 'Đã dành tiền cho quỹ.',
            ]);
        });
    }

    /**
     * POST /api/funds/{fund}/spend
     *
     * Spend from fund (for purchases that the fund was meant for).
     */
    public function spend(Request $request, Fund $fund): JsonResponse
    {
        $validated = $request->validate([
            'amount'      => ['required', 'integer', 'min:1'],
            'description' => ['sometimes', 'nullable', 'string'],
        ]);

        if ($validated['amount'] > $fund->available) {
            return response()->json([
                'error'   => 'insufficient_funds',
                'message' => 'Số tiền chi vượt quá số dư quỹ.',
            ], 422);
        }

        return DB::transaction(function () use ($fund, $validated) {
            $fund->increment('spent_amount', $validated['amount']);

            return response()->json([
                'data'    => $this->serialize($fund->fresh()->load('jar', 'goal')),
                'message' => 'Đã chi từ quỹ.',
            ]);
        });
    }

    private function serialize(Fund $fund): array
    {
        return [
            'id'              => $fund->id,
            'name'            => $fund->name,
            'jar'             => $fund->jar ? ['id' => $fund->jar->id, 'key' => $fund->jar->key, 'label' => $fund->jar->label] : null,
            'goal'            => $fund->goal ? ['id' => $fund->goal->id, 'name' => $fund->goal->name] : null,
            'target_amount'   => $fund->target_amount,
            'reserved_amount' => $fund->reserved_amount,
            'spent_amount'    => $fund->spent_amount,
            'available'       => $fund->available,
            'monthly_reserve' => $fund->monthly_reserve,
            'progress_pct'    => $fund->progress_percent,
            'status'          => $fund->status,
            'notes'           => $fund->notes,
            'sort_order'      => $fund->sort_order,
        ];
    }
}
