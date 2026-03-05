<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreGoalRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'          => ['required', 'string', 'max:255'],
            'target_amount' => ['required', 'integer', 'min:1'],
            'jar_id'        => ['sometimes', 'nullable', 'exists:jars,id'],
            'deadline'      => ['sometimes', 'nullable', 'date', 'after:today'],
            'priority'      => ['sometimes', 'integer', 'min:0', 'max:255'],
            'funding_mode'  => ['sometimes', 'in:fund_now,fund_over_time'],
            'notes'         => ['sometimes', 'nullable', 'string'],
        ];
    }
}
