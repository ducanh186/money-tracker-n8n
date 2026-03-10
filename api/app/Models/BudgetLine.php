<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BudgetLine extends Model
{
    use HasFactory;

    protected $fillable = [
        'jar_allocation_id',
        'name',
        'type',
        'planned_amount',
        'actual_amount',
        'goal_id',
        'debt_id',
        'recurring_bill_id',
        'fund_id',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'planned_amount' => 'integer',
            'actual_amount'  => 'integer',
        ];
    }

    // ── Relationships ──────────────────────────────────────────────

    public function jarAllocation(): BelongsTo
    {
        return $this->belongsTo(JarAllocation::class);
    }

    public function goal(): BelongsTo
    {
        return $this->belongsTo(Goal::class);
    }

    public function debt(): BelongsTo
    {
        return $this->belongsTo(Debt::class);
    }

    public function recurringBill(): BelongsTo
    {
        return $this->belongsTo(RecurringBill::class);
    }

    public function fund(): BelongsTo
    {
        return $this->belongsTo(Fund::class);
    }

    // ── Computed ────────────────────────────────────────────────────

    public function getRemainingAttribute(): int
    {
        return $this->planned_amount - $this->actual_amount;
    }

    public function getUsagePercentAttribute(): float
    {
        if ($this->planned_amount <= 0) {
            return 0;
        }
        return round(($this->actual_amount / $this->planned_amount) * 100, 1);
    }
}
