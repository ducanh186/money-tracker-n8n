<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class JarAllocation extends Model
{
    use HasFactory;

    protected $fillable = [
        'budget_period_id',
        'jar_id',
        'percent_override',
        'planned_amount',
        'funded_amount',
        'committed_amount',
        'spent_amount',
        'rollover_amount',
    ];

    protected function casts(): array
    {
        return [
            'percent_override'  => 'decimal:2',
            'planned_amount'    => 'integer',
            'funded_amount'     => 'integer',
            'committed_amount'  => 'integer',
            'spent_amount'      => 'integer',
            'rollover_amount'   => 'integer',
        ];
    }

    // ── Relationships ──────────────────────────────────────────────

    public function budgetPeriod(): BelongsTo
    {
        return $this->belongsTo(BudgetPeriod::class);
    }

    public function jar(): BelongsTo
    {
        return $this->belongsTo(Jar::class);
    }

    public function budgetLines(): HasMany
    {
        return $this->hasMany(BudgetLine::class);
    }

    // ── Computed ────────────────────────────────────────────────────

    /**
     * Effective percent (override or jar default).
     */
    public function getEffectivePercentAttribute(): float
    {
        return $this->percent_override ?? $this->jar->percent;
    }

    /**
     * Remaining = planned - sum of budget line planned amounts.
     */
    public function getRemainingAttribute(): int
    {
        return $this->planned_amount - (int) $this->budgetLines()->sum('planned_amount');
    }

    /**
     * Available = Planned + Rollover - Reserved - Spent.
     * committed_amount is kept for compatibility and now stores reserved lines.
     */
    public function getAvailableAttribute(): int
    {
        return $this->planned_amount + $this->rollover_amount - $this->committed_amount - $this->spent_amount;
    }
}
