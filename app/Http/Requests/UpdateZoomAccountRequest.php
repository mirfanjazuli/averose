<?php

namespace App\Http\Requests;

use App\UserRole;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateZoomAccountRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->role === UserRole::Admin;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'account_id' => [
                'required',
                'string',
                'max:255',
                Rule::unique('zoom_accounts', 'account_id')->ignore($this->route('zoom_account')),
            ],
            'client_id' => ['required', 'string', 'max:255'],
            'client_secret' => ['nullable', 'string', 'max:4000'],
            'token_secret' => ['nullable', 'string', 'max:4000'],
        ];
    }
}
