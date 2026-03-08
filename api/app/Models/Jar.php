<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Jar extends Model
{
    use HasFactory;

    protected $fillable = [
        'key',
        'label',
        'percent',
        'sort_order',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'percent'    => 'decimal:2',
            'sort_order' => 'integer',
            'is_active'  => 'boolean',
        ];
    }

    // ── Relationships ──────────────────────────────────────────────

    public function allocations(): HasMany
    {
        return $this->hasMany(JarAllocation::class);
    }

    public function goals(): HasMany
    {
        return $this->hasMany(Goal::class);
    }

    public function funds(): HasMany
    {
        return $this->hasMany(Fund::class);
    }

    public function recurringBills(): HasMany
    {
        return $this->hasMany(RecurringBill::class);
    }

    public function transfers(): HasMany
    {
        return $this->hasMany(Transfer::class);
    }

    // ── Scopes ─────────────────────────────────────────────────────

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order');
    }
}
