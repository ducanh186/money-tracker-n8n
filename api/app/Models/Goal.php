<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Goal extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'target_amount',
        'current_amount',
        'jar_id',
        'deadline',
        'priority',
        'funding_mode',
        'status',
        'notes',
    ];

    protected $attributes = [
        'current_amount' => 0,
        'priority'       => 0,
        'funding_mode'   => 'fund_over_time',
        'status'         => 'active',
    ];

    protected function casts(): array
    {
        return [
            'target_amount'  => 'integer',
            'current_amount' => 'integer',
            'deadline'       => 'date',
            'priority'       => 'integer',
        ];
    }

    // ── Relationships ──────────────────────────────────────────────

    public function jar(): BelongsTo
    {
        return $this->belongsTo(Jar::class);
    }

    public function contributions(): HasMany
    {
        return $this->hasMany(GoalContribution::class);
    }

    public function budgetLines(): HasMany
    {
        return $this->hasMany(BudgetLine::class);
    }

    public function transfers(): HasMany
    {
        return $this->hasMany(Transfer::class);
    }

    // ── Computed ────────────────────────────────────────────────────

    public function getProgressPercentAttribute(): float
    {
        if ($this->target_amount <= 0) {
            return 100;
        }
        return round(($this->current_amount / $this->target_amount) * 100, 1);
    }

    public function getShortfallAttribute(): int
    {
        return max(0, $this->target_amount - $this->current_amount);
    }

    public function getIsCompletedAttribute(): bool
    {
        return $this->current_amount >= $this->target_amount;
    }

    // ── Scopes ─────────────────────────────────────────────────────

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }
}
