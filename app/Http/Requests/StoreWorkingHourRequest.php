<?php

namespace App\Http\Requests;

use App\UserRole;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreWorkingHourRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->role === UserRole::Admin
            && $this->user()->hasPermission('schedules.view');
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'end_time' => ['nullable', 'required_if:is_active,1', 'date_format:H:i', 'after:start_time'],
            'is_active' => ['required', 'boolean'],
            'start_time' => ['nullable', 'required_if:is_active,1', 'date_format:H:i'],
        ];
    }
}
