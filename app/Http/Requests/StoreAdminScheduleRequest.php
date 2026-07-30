<?php

namespace App\Http\Requests;

use App\Models\ProgramEnrollment;
use App\ScheduleDeliveryMode;
use App\UserRole;
use Carbon\CarbonImmutable;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreAdminScheduleRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->hasPermission('schedules.assign') ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'date' => ['required', 'date_format:Y-m-d'],
            'delivery_mode' => ['required', Rule::enum(ScheduleDeliveryMode::class)],
            'mentor_id' => [
                'required',
                'integer',
                Rule::exists('users', 'id')
                    ->where('role', UserRole::Mentor->value)
                    ->where('status', 'active'),
            ],
            'program_enrollment_id' => ['required', 'integer', 'exists:program_enrollments,id'],
            'subject_id' => ['required', 'integer', 'exists:subjects,id'],
            'time' => ['required', 'date_format:H:i'],
            'user_id' => [
                'required',
                'integer',
                Rule::exists('users', 'id')->where('role', UserRole::Student->value),
            ],
        ];
    }

    public function after(): array
    {
        return [
            function (Validator $validator): void {
                if ($validator->errors()->isNotEmpty()) {
                    return;
                }

                $scheduledAt = CarbonImmutable::parse(
                    "{$this->string('date')} {$this->string('time')}",
                    config('app.timezone'),
                );

                if ($scheduledAt->isPast()) {
                    $validator->errors()->add('date', 'The schedule date and time must be in the future.');
                }

                $enrollment = ProgramEnrollment::query()
                    ->with(['program.subjects:id', 'variant:id,session'])
                    ->whereKey($this->integer('program_enrollment_id'))
                    ->where('user_id', $this->integer('user_id'))
                    ->where('status', 'active')
                    ->first();

                if (! $enrollment) {
                    $validator->errors()->add('program_enrollment_id', 'The selected enrollment is invalid.');

                    return;
                }

                if (! $enrollment->program?->subjects->contains('id', $this->integer('subject_id'))) {
                    $validator->errors()->add('subject_id', 'The selected subject is not available for this enrollment.');
                }

                if ($enrollment->sessionsRemaining() < 1) {
                    $validator->errors()->add('program_enrollment_id', 'There are no remaining sessions for this enrollment.');
                }
            },
        ];
    }
}
