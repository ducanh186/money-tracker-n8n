<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GoalContribution extends Model
{
    use HasFactory;

    protected $fillable = [
        'goal_id',
        'budget_period_id',
        'amount',
        'source_jar_id',
        'notes',
        'contributed_at',
    ];

    protected function casts(): array
    {
        return [
            'amount'         => 'integer',
            'contributed_at' => 'datetime',
        ];
    }

    // ── Relationships ──────────────────────────────────────────────

    public function goal(): BelongsTo
    {
        return $this->belongsTo(Goal::class);
    }

    public function budgetPeriod(): BelongsTo
    {
        return $this->belongsTo(BudgetPeriod::class);
    }

    public function sourceJar(): BelongsTo
    {
        return $this->belongsTo(Jar::class, 'source_jar_id');
    }
}
