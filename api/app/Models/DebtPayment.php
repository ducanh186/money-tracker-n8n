<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DebtPayment extends Model
{
    use HasFactory;

    protected $fillable = [
        'debt_id',
        'budget_period_id',
        'amount',
        'principal',
        'interest',
        'paid_at',
    ];

    protected function casts(): array
    {
        return [
            'amount'    => 'integer',
            'principal' => 'integer',
            'interest'  => 'integer',
            'paid_at'   => 'datetime',
        ];
    }

    // ── Relationships ──────────────────────────────────────────────

    public function debt(): BelongsTo
    {
        return $this->belongsTo(Debt::class);
    }

    public function budgetPeriod(): BelongsTo
    {
        return $this->belongsTo(BudgetPeriod::class);
    }
}
