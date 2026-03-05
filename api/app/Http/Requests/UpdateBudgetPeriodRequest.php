<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateBudgetPeriodRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'total_income' => ['sometimes', 'integer', 'min:0'],
            'status'       => ['sometimes', 'in:draft,active,closed'],
            'notes'        => ['sometimes', 'nullable', 'string'],
        ];
    }
}
