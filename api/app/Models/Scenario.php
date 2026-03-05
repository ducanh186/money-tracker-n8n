<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Scenario extends Model
{
    use HasFactory;

    protected $fillable = [
        'budget_period_id',
        'name',
        'description',
        'purchase_amount',
        'target_jar_id',
        'proposals',
        'impact',
    ];

    protected function casts(): array
    {
        return [
            'purchase_amount' => 'integer',
            'proposals'       => 'array',
            'impact'          => 'array',
        ];
    }

    // ── Relationships ──────────────────────────────────────────────

    public function budgetPeriod(): BelongsTo
    {
        return $this->belongsTo(BudgetPeriod::class);
    }

    public function targetJar(): BelongsTo
    {
        return $this->belongsTo(Jar::class, 'target_jar_id');
    }
}
