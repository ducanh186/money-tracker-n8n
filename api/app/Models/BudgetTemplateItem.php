<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BudgetTemplateItem extends Model
{
    protected $fillable = [
        'budget_template_id',
        'category_id',
        'jar_id',
        'percent',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'percent' => 'decimal:2',
            'sort_order' => 'integer',
        ];
    }

    public function template(): BelongsTo
    {
        return $this->belongsTo(BudgetTemplate::class, 'budget_template_id');
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function jar(): BelongsTo
    {
        return $this->belongsTo(Jar::class);
    }
}
