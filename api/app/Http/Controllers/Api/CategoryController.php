<?php

namespace App\Http\Controllers\Api;

use App\Models\BudgetTemplate;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;

class CategoryController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'data' => Category::active()
                ->ordered()
                ->get()
                ->map(fn (Category $category) => [
                    'id' => $category->id,
                    'key' => $category->key,
                    'name' => $category->name,
                    'group' => $category->group,
                    'sort_order' => $category->sort_order,
                    'is_active' => $category->is_active,
                ]),
        ]);
    }

    public function templates(): JsonResponse
    {
        return response()->json([
            'data' => BudgetTemplate::query()
                ->where('is_active', true)
                ->with(['items.category', 'items.jar'])
                ->orderByDesc('is_default')
                ->orderBy('name')
                ->get()
                ->map(fn (BudgetTemplate $template) => [
                    'id' => $template->id,
                    'key' => $template->key,
                    'name' => $template->name,
                    'type' => $template->type,
                    'is_default' => $template->is_default,
                    'items' => $template->items
                        ->sortBy('sort_order')
                        ->values()
                        ->map(fn ($item) => [
                            'category' => $item->category ? [
                                'id' => $item->category->id,
                                'key' => $item->category->key,
                                'name' => $item->category->name,
                            ] : null,
                            'jar' => $item->jar ? [
                                'id' => $item->jar->id,
                                'key' => $item->jar->key,
                                'label' => $item->jar->label,
                            ] : null,
                            'percent' => (float) $item->percent,
                            'sort_order' => $item->sort_order,
                        ]),
                ]),
        ]);
    }
}
