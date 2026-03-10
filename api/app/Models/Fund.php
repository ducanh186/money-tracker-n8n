<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Fund extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'type',
        'jar_id',
        'goal_id',
        'target_amount',
        'reserved_amount',
        'spent_amount',
        'monthly_reserve',
        'status',
        'notes',
        'last_contributed_at',
        'sort_order',
    ];

    protected $attributes = [
        'type'            => 'sinking_fund',
        'target_amount'   => 0,
        'reserved_amount' => 0,
        'spent_amount'    => 0,
        'monthly_reserve' => 0,
        'status'          => 'active',
        'sort_order'      => 0,
    ];

    protected function casts(): array
    {
        return [
            'target_amount'      => 'integer',
            'reserved_amount'    => 'integer',
            'spent_amount'       => 'integer',
            'monthly_reserve'    => 'integer',
            'sort_order'         => 'integer',
            'last_contributed_at' => 'datetime',
        ];
    }

    // ── Relationships ──────────────────────────────────────────────

    public function jar(): BelongsTo
    {
        return $this->belongsTo(Jar::class);
    }

    public function goal(): BelongsTo
    {
        return $this->belongsTo(Goal::class);
    }

    public function budgetLines(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(BudgetLine::class);
    }

    // ── Computed ────────────────────────────────────────────────────

    public function getAvailableAttribute(): int
    {
        return $this->reserved_amount - $this->spent_amount;
    }

    public function getProgressPercentAttribute(): float
    {
        if ($this->target_amount <= 0) {
            return 100;
        }
        return round(($this->reserved_amount / $this->target_amount) * 100, 1);
    }

    // ── Scopes ─────────────────────────────────────────────────────

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeInvestment($query)
    {
        return $query->where('type', 'investment');
    }

    public function scopeSinkingFund($query)
    {
        return $query->where('type', 'sinking_fund');
    }
}
