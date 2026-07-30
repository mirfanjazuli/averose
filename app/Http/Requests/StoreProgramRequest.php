<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreProgramRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->hasAnyPermission(['programs.create', 'programs.update']) ?? false;
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
            'thumbnail' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'description' => ['nullable', 'string', 'max:4000'],
            'max_reschedule' => ['required', 'integer', 'min:0', 'max:255'],
            'fields' => ['sometimes', 'array', 'min:1'],
            'fields.*' => ['integer', Rule::exists('fields', 'id')],
            'subjects' => ['nullable', 'array'],
            'subjects.*' => ['integer', Rule::exists('subjects', 'id')],
            'variants' => ['nullable', 'array'],
            'variants.*.id' => ['nullable', 'integer', Rule::exists('program_variants', 'id')],
            'variants.*.field_id' => ['required', 'integer', Rule::exists('fields', 'id')],
            'variants.*.session' => ['required', 'integer', 'min:1', 'max:255'],
            'variants.*.duration' => ['required', 'integer', 'min:1', 'max:10000'],
            'variants.*.price' => ['required', 'numeric', 'min:0', 'max:9999999999.99'],
        ];
    }
}
