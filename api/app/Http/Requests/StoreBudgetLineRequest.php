<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreBudgetLineRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'jar_allocation_id' => ['required', 'exists:jar_allocations,id'],
            'name'              => ['required', 'string', 'max:255'],
            'type'              => ['sometimes', 'in:general,goal,bill,debt,sinking_fund'],
            'planned_amount'    => ['required', 'integer', 'min:0'],
            'actual_amount'     => ['sometimes', 'integer', 'min:0'],
            'goal_id'           => ['sometimes', 'nullable', 'exists:goals,id'],
            'debt_id'           => ['sometimes', 'nullable', 'exists:debts,id'],
            'recurring_bill_id' => ['sometimes', 'nullable', 'exists:recurring_bills,id'],
            'notes'             => ['sometimes', 'nullable', 'string'],
        ];
    }
}
