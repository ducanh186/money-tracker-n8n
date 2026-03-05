<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreRecurringBillRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'          => ['required', 'string', 'max:255'],
            'amount'        => ['required', 'integer', 'min:1'],
            'frequency'     => ['sometimes', 'in:monthly,quarterly,semi_annually,annually'],
            'jar_id'        => ['sometimes', 'nullable', 'exists:jars,id'],
            'due_day'       => ['sometimes', 'nullable', 'integer', 'min:1', 'max:31'],
            'next_due_date' => ['sometimes', 'nullable', 'date'],
            'category'      => ['sometimes', 'nullable', 'string', 'max:100'],
            'is_active'     => ['sometimes', 'boolean'],
            'notes'         => ['sometimes', 'nullable', 'string'],
        ];
    }
}
