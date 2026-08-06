<?php

namespace App\Http\Requests;

use App\Rules\IanaTimezone;
use App\UserTimezoneMode;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTimezonePreferenceRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'mode' => ['required', Rule::enum(UserTimezoneMode::class)],
            'timezone' => ['required', 'string', 'max:64', new IanaTimezone],
        ];
    }
}
