<?php

namespace App\Http\Requests;

use App\Models\Program;
use App\Models\ProgramVariant;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreProgramEnrollmentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'program_id' => ['required', 'integer', 'exists:programs,id'],
            'field_id' => ['required', 'integer', 'exists:fields,id'],
            'program_variant_id' => ['required', 'integer', 'exists:program_variants,id'],
            'start_date' => ['required', 'date'],
            'max_reschedule' => ['nullable', 'integer', 'min:0', 'max:255'],
        ];
    }

    public function after(): array
    {
        return [
            function (Validator $validator): void {
                $program = Program::query()
                    ->with(['fields:id', 'variants:id,field_id'])
                    ->find($this->integer('program_id'));
                $variant = ProgramVariant::query()->find($this->integer('program_variant_id'));
                $fieldId = $this->integer('field_id');

                if (! $program || ! $variant) {
                    return;
                }

                if (! $program->fields->contains('id', $fieldId)) {
                    $validator->errors()->add('field_id', 'The selected field is not available for this program.');
                }

                if (! $program->variants->contains('id', $variant->id)) {
                    $validator->errors()->add('program_variant_id', 'The selected variant is not available for this program.');
                }

                if ($variant->field_id !== $fieldId) {
                    $validator->errors()->add('program_variant_id', 'The selected variant is not available for this field.');
                }
            },
        ];
    }
}
