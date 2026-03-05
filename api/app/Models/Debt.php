<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Debt extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'total_amount',
        'remaining_amount',
        'interest_rate',
        'minimum_payment',
        'due_day_of_month',
        'strategy',
        'status',
        'notes',
    ];

    protected $attributes = [
        'interest_rate'    => 0,
        'minimum_payment'  => 0,
        'strategy'         => 'snowball',
        'status'           => 'active',
    ];

    protected function casts(): array
    {
        return [
            'total_amount'     => 'integer',
            'remaining_amount' => 'integer',
            'interest_rate'    => 'decimal:2',
            'minimum_payment'  => 'integer',
            'due_day_of_month' => 'integer',
        ];
    }

    // ── Relationships ──────────────────────────────────────────────

    public function payments(): HasMany
    {
        return $this->hasMany(DebtPayment::class);
    }

    public function budgetLines(): HasMany
    {
        return $this->hasMany(BudgetLine::class);
    }

    // ── Computed ────────────────────────────────────────────────────

    public function getPaidAmountAttribute(): int
    {
        return $this->total_amount - $this->remaining_amount;
    }

    public function getProgressPercentAttribute(): float
    {
        if ($this->total_amount <= 0) {
            return 100;
        }
        return round((($this->total_amount - $this->remaining_amount) / $this->total_amount) * 100, 1);
    }

    public function getDaysUntilDueAttribute(): ?int
    {
        if (!$this->due_day_of_month) {
            return null;
        }

        $today = now();
        $dueDate = $today->copy()->day($this->due_day_of_month);

        if ($dueDate->isPast()) {
            $dueDate->addMonth();
        }

        return $today->diffInDays($dueDate);
    }

    // ── Scopes ─────────────────────────────────────────────────────

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeByStrategy($query, string $strategy)
    {
        // snowball: smallest balance first
        // avalanche: highest interest first
        return match ($strategy) {
            'snowball'  => $query->orderBy('remaining_amount', 'asc'),
            'avalanche' => $query->orderBy('interest_rate', 'desc'),
            default     => $query,
        };
    }
}
