<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreTransferRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'from_account_id'  => ['required', 'exists:accounts,id'],
            'to_account_id'    => ['required', 'exists:accounts,id', 'different:from_account_id'],
            'amount'           => ['required', 'integer', 'min:1'],
            'goal_id'          => ['sometimes', 'nullable', 'exists:goals,id'],
            'jar_id'           => ['sometimes', 'nullable', 'exists:jars,id'],
            'description'      => ['sometimes', 'nullable', 'string', 'max:500'],
            'transferred_at'   => ['sometimes', 'date'],
            'budget_period_id' => ['sometimes', 'nullable', 'exists:budget_periods,id'],
        ];
    }
}
