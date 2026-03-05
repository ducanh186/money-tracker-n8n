<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\StoreAccountRequest;
use App\Models\Account;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class AccountController extends Controller
{
    /**
     * GET /api/accounts
     */
    public function index(): JsonResponse
    {
        $accounts = Account::active()->ordered()->get();

        return response()->json([
            'data' => $accounts,
        ]);
    }

    /**
     * POST /api/accounts
     */
    public function store(StoreAccountRequest $request): JsonResponse
    {
        $account = Account::create($request->validated());

        return response()->json([
            'data'    => $account,
            'message' => 'Account created.',
        ], 201);
    }

    /**
     * GET /api/accounts/{id}
     */
    public function show(Account $account): JsonResponse
    {
        return response()->json([
            'data' => $account,
        ]);
    }

    /**
     * PUT /api/accounts/{id}
     */
    public function update(Request $request, Account $account): JsonResponse
    {
        $validated = $request->validate([
            'name'        => ['sometimes', 'string', 'max:255'],
            'type'        => ['sometimes', 'in:checking,savings,cash,ewallet,investment'],
            'institution' => ['sometimes', 'nullable', 'string', 'max:255'],
            'balance'     => ['sometimes', 'integer'],
            'currency'    => ['sometimes', 'string', 'size:3'],
            'is_active'   => ['sometimes', 'boolean'],
            'sort_order'  => ['sometimes', 'integer', 'min:0'],
        ]);

        $account->update($validated);

        return response()->json([
            'data'    => $account->fresh(),
            'message' => 'Account updated.',
        ]);
    }

    /**
     * DELETE /api/accounts/{id}
     */
    public function destroy(Account $account): JsonResponse
    {
        $account->delete();

        return response()->json([
            'message' => 'Account deleted.',
        ]);
    }

    /**
     * GET /api/accounts/net-worth
     */
    public function netWorth(): JsonResponse
    {
        $accounts = Account::active()->ordered()->get();

        $netWorth = $accounts->sum('balance');
        $breakdown = $accounts->map(fn ($a) => [
            'id'          => $a->id,
            'name'        => $a->name,
            'type'        => $a->type,
            'institution' => $a->institution,
            'balance'     => $a->balance,
        ]);

        return response()->json([
            'net_worth' => $netWorth,
            'currency'  => 'VND',
            'accounts'  => $breakdown,
        ]);
    }
}
