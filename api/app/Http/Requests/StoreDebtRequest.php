<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreDebtRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'             => ['required', 'string', 'max:255'],
            'total_amount'     => ['required', 'integer', 'min:1'],
            'remaining_amount' => ['required', 'integer', 'min:0'],
            'interest_rate'    => ['sometimes', 'numeric', 'min:0', 'max:100'],
            'minimum_payment'  => ['sometimes', 'integer', 'min:0'],
            'due_day_of_month' => ['sometimes', 'nullable', 'integer', 'min:1', 'max:31'],
            'strategy'         => ['sometimes', 'in:snowball,avalanche'],
            'notes'            => ['sometimes', 'nullable', 'string'],
        ];
    }
}
