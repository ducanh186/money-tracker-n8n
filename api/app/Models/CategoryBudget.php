<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CategoryBudget extends Model
{
    protected $fillable = [
        'budget_period_id',
        'category_id',
        'budgeted_amount',
        'reserved_amount',
        'rollover_amount',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'budgeted_amount' => 'integer',
            'reserved_amount' => 'integer',
            'rollover_amount' => 'integer',
        ];
    }

    public function budgetPeriod(): BelongsTo
    {
        return $this->belongsTo(BudgetPeriod::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }
}
