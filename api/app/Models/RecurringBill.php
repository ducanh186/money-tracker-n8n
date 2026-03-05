<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RecurringBill extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'amount',
        'frequency',
        'jar_id',
        'due_day',
        'next_due_date',
        'category',
        'is_active',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'amount'        => 'integer',
            'due_day'       => 'integer',
            'next_due_date' => 'date',
            'is_active'     => 'boolean',
        ];
    }

    // ── Relationships ──────────────────────────────────────────────

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
     * Monthly equivalent amount (for budgeting).
     */
    public function getMonthlyAmountAttribute(): int
    {
        return match ($this->frequency) {
            'monthly'       => $this->amount,
            'quarterly'     => (int) round($this->amount / 3),
            'semi_annually' => (int) round($this->amount / 6),
            'annually'      => (int) round($this->amount / 12),
            default         => $this->amount,
        };
    }

    public function getDaysUntilDueAttribute(): ?int
    {
        if (!$this->next_due_date) {
            return null;
        }
        return max(0, now()->diffInDays($this->next_due_date, false));
    }

    // ── Scopes ─────────────────────────────────────────────────────

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeDueSoon($query, int $days = 7)
    {
        return $query->where('is_active', true)
            ->whereNotNull('next_due_date')
            ->where('next_due_date', '<=', now()->addDays($days));
    }
}
