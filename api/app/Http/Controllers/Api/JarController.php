<?php

namespace App\Http\Controllers\Api;

use App\Models\Jar;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class JarController extends Controller
{
    /**
     * GET /api/jars
     */
    public function index(): JsonResponse
    {
        $jars = Jar::active()->ordered()->get();

        return response()->json([
            'data' => $jars,
        ]);
    }

    /**
     * GET /api/jars/{id}
     */
    public function show(Jar $jar): JsonResponse
    {
        return response()->json([
            'data' => $jar,
        ]);
    }

    /**
     * PUT /api/jars/{id}
     */
    public function update(Request $request, Jar $jar): JsonResponse
    {
        $validated = $request->validate([
            'label'      => ['sometimes', 'string', 'max:255'],
            'percent'    => ['sometimes', 'numeric', 'min:0', 'max:100'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
            'is_active'  => ['sometimes', 'boolean'],
        ]);

        $jar->update($validated);

        return response()->json([
            'data'    => $jar->fresh(),
            'message' => 'Jar updated.',
        ]);
    }
}
