<?php

namespace App\Http\Requests;

use App\Models\ProgramEnrollment;
use App\UserRole;
use Carbon\CarbonImmutable;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreSessionBookingRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->role === UserRole::Student;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'program_enrollment_id' => ['required', 'integer', 'exists:program_enrollments,id'],
            'subject_id' => ['required', 'integer', 'exists:subjects,id'],
            'date' => ['required', 'date_format:Y-m-d'],
            'time' => ['required', 'date_format:H:i'],
        ];
    }

    public function after(): array
    {
        return [
            function (Validator $validator): void {
                if ($validator->errors()->isNotEmpty()) {
                    return;
                }

                $enrollment = ProgramEnrollment::query()
                    ->with(['program.subjects:id', 'variant:id,session'])
                    ->whereKey($this->integer('program_enrollment_id'))
                    ->where('user_id', $this->user()->id)
                    ->first();

                if (! $enrollment) {
                    $validator->errors()->add('program_enrollment_id', 'The selected enrollment is invalid.');

                    return;
                }

                if (! $enrollment->program?->subjects->contains('id', $this->integer('subject_id'))) {
                    $validator->errors()->add('subject_id', 'The selected subject is not available for this enrollment.');
                }

                if ($enrollment->sessionsRemaining() < 1) {
                    $validator->errors()->add('subject_id', 'There are no remaining sessions for this enrollment.');
                }

                CarbonImmutable::parse("{$this->string('date')} {$this->string('time')}", config('app.timezone'));
            },
        ];
    }
}
