<?php

namespace App\Http\Requests;

use App\Models\ProgramEnrollment;
use App\UserRole;
use Carbon\CarbonImmutable;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Collection;
use Illuminate\Validation\Validator;

class StoreScheduleRequest extends FormRequest
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
            'program_enrollment_id' => ['nullable', 'required_without:sessions', 'integer', 'exists:program_enrollments,id'],
            'subject_id' => ['nullable', 'required_without:sessions', 'integer', 'exists:subjects,id'],
            'date' => ['nullable', 'required_without_all:dates,sessions', 'date_format:Y-m-d'],
            'dates' => ['nullable', 'array', 'min:1'],
            'dates.*' => ['required', 'date_format:Y-m-d'],
            'time' => ['nullable', 'required_without:sessions', 'date_format:H:i'],
            'sessions' => ['nullable', 'array', 'min:1'],
            'sessions.*.program_enrollment_id' => ['required_with:sessions', 'integer', 'exists:program_enrollments,id'],
            'sessions.*.subject_id' => ['required_with:sessions', 'integer', 'exists:subjects,id'],
            'sessions.*.date' => ['required_with:sessions', 'date_format:Y-m-d'],
            'sessions.*.time' => ['required_with:sessions', 'date_format:H:i'],
        ];
    }

    public function after(): array
    {
        return [
            function (Validator $validator): void {
                if ($validator->errors()->isNotEmpty()) {
                    return;
                }

                $sessions = $this->normalizedSessions();

                $sessions
                    ->groupBy('program_enrollment_id')
                    ->each(function ($items, int|string $enrollmentId) use ($validator): void {
                        $enrollment = ProgramEnrollment::query()
                            ->with(['program.subjects:id', 'variant:id,session'])
                            ->whereKey($enrollmentId)
                            ->where('user_id', $this->user()->id)
                            ->first();

                        if (! $enrollment) {
                            $validator->errors()->add('program_enrollment_id', 'The selected enrollment is invalid.');

                            return;
                        }

                        $items->each(function (array $session) use ($enrollment, $validator): void {
                            if (! $enrollment->program?->subjects->contains('id', (int) $session['subject_id'])) {
                                $validator->errors()->add('subject_id', 'The selected subject is not available for this enrollment.');
                            }

                            CarbonImmutable::parse("{$session['date']} {$session['time']}", config('app.timezone'));
                        });

                        if ($enrollment->sessionsRemaining() < $items->count()) {
                            $validator->errors()->add('subject_id', 'There are no remaining sessions for this enrollment.');
                        }
                    });
            },
        ];
    }

    private function normalizedSessions(): Collection
    {
        if (is_array($this->input('sessions'))) {
            return collect($this->input('sessions'))->map(fn (array $session): array => [
                'date' => $session['date'],
                'program_enrollment_id' => (int) $session['program_enrollment_id'],
                'subject_id' => (int) $session['subject_id'],
                'time' => $session['time'],
            ]);
        }

        return collect($this->input('dates', []))
            ->when(
                $this->filled('date'),
                fn ($items) => $items->push($this->string('date')->toString()),
            )
            ->filter()
            ->unique()
            ->values()
            ->map(fn (string $date): array => [
                'date' => $date,
                'program_enrollment_id' => $this->integer('program_enrollment_id'),
                'subject_id' => $this->integer('subject_id'),
                'time' => $this->string('time')->toString(),
            ]);
    }
}
