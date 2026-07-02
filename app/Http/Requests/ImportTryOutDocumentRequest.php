<?php

namespace App\Http\Requests;

use App\UserRole;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class ImportTryOutDocumentRequest extends FormRequest
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
            'document' => ['required', 'file', 'extensions:docx', 'max:10240'],
            'duration_minutes' => ['nullable', 'integer', 'min:1', 'max:1000'],
            'status' => ['required', 'in:draft,published'],
            'title' => ['nullable', 'string', 'max:255'],
        ];
    }
}
