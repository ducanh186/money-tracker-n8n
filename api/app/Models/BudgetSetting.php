<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BudgetSetting extends Model
{
    protected $fillable = [
        'month',
        'base_income_override',
    ];

    protected function casts(): array
    {
        return [
            'base_income_override' => 'integer',
        ];
    }
}
