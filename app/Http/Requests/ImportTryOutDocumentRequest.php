<?php

namespace App\Http\Requests;

use App\TryOutScoringMode;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class ImportTryOutDocumentRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $this->merge([
            'scoring_mode' => $this->input('scoring_mode', TryOutScoringMode::RawScore->value),
        ]);
    }

    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->hasPermission('try_outs.import') ?? false;
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
            'scoring_mode' => ['required', 'in:'.collect(TryOutScoringMode::cases())->pluck('value')->implode(',')],
            'correct_points' => ['nullable', 'required_if:scoring_mode,negative_marking', 'numeric', 'gt:0'],
            'wrong_points' => ['nullable', 'required_if:scoring_mode,negative_marking', 'numeric', 'lt:correct_points'],
            'unanswered_points' => ['nullable', 'required_if:scoring_mode,negative_marking', 'numeric', 'lt:correct_points'],
            'duration_minutes' => ['nullable', 'integer', 'min:1', 'max:1000'],
            'status' => ['required', 'in:draft,public,private'],
            'title' => ['nullable', 'string', 'max:255'],
        ];
    }
}
