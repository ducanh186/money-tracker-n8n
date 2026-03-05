<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreAccountRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'        => ['required', 'string', 'max:255'],
            'type'        => ['sometimes', 'in:checking,savings,cash,ewallet,investment'],
            'institution' => ['sometimes', 'nullable', 'string', 'max:255'],
            'balance'     => ['sometimes', 'integer'],
            'currency'    => ['sometimes', 'string', 'size:3'],
            'is_active'   => ['sometimes', 'boolean'],
            'sort_order'  => ['sometimes', 'integer', 'min:0'],
        ];
    }
}
