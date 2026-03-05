<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreBudgetPeriodRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'month'        => ['required', 'string', 'max:20', 'unique:budget_periods,month'],
            'year'         => ['required', 'integer', 'min:2020', 'max:2100'],
            'month_num'    => ['required', 'integer', 'min:1', 'max:12'],
            'total_income' => ['required', 'integer', 'min:0'],
            'status'       => ['sometimes', 'in:draft,active,closed'],
            'notes'        => ['sometimes', 'nullable', 'string'],
        ];
    }
}
