<?php

namespace App\Http\Requests;

use App\UserRole;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ImportPublicHolidaysRequest extends FormRequest
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
            'holidays' => ['required', 'array', 'min:1'],
            'holidays.*.date' => ['required', 'date_format:Y-m-d'],
            'holidays.*.name' => ['required', 'string', 'max:255'],
            'holidays.*.type' => ['required', Rule::in(['national', 'collective_leave', 'internal'])],
            'year' => ['required', 'integer', 'min:2000', 'max:2100'],
        ];
    }
}
