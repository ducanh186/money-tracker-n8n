<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BudgetPeriod extends Model
{
    use HasFactory;

    protected $fillable = [
        'month',
        'year',
        'month_num',
        'total_income',
        'to_be_budgeted',
        'status',
        'rollover_policy',
        'notes',
        'salary_received_at',
        'allocation_locked_at',
    ];

    protected function casts(): array
    {
        return [
            'year'                 => 'integer',
            'month_num'            => 'integer',
            'total_income'         => 'integer',
            'to_be_budgeted'       => 'integer',
            'salary_received_at'   => 'date:Y-m-d',
            'allocation_locked_at' => 'date:Y-m-d',
        ];
    }

    // ── Relationships ──────────────────────────────────────────────

    public function jarAllocations(): HasMany
    {
        return $this->hasMany(JarAllocation::class);
    }

    public function budgetLines()
    {
        return $this->hasManyThrough(BudgetLine::class, JarAllocation::class);
    }

    public function goalContributions(): HasMany
    {
        return $this->hasMany(GoalContribution::class);
    }

    public function debtPayments(): HasMany
    {
        return $this->hasMany(DebtPayment::class);
    }

    public function transfers(): HasMany
    {
        return $this->hasMany(Transfer::class);
    }

    public function scenarios(): HasMany
    {
        return $this->hasMany(Scenario::class);
    }

    // ── Helpers ─────────────────────────────────────────────────────

    /**
     * Total amount already allocated across all jars.
     */
    public function getAllocatedAttribute(): int
    {
        return (int) $this->jarAllocations()->sum('planned_amount');
    }
}
