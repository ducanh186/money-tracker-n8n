<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SimulateScenarioRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'            => ['required', 'string', 'max:255'],
            'purchase_amount' => ['required', 'integer', 'min:1'],
            'target_jar_key'  => ['required', 'string', 'exists:jars,key'],
            'month'           => ['required', 'string', 'exists:budget_periods,month'],
        ];
    }
}
