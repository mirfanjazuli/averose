<?php

namespace App\Http\Requests;

use App\Models\ProgramEnrollment;
use App\Rules\IanaTimezone;
use App\Services\DateTime\UserDateTimeService;
use App\Services\Scheduling\BusinessCalendarService;
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
            'timezone' => ['required', 'string', 'max:64', new IanaTimezone],
            'sessions' => ['nullable', 'array', 'min:1'],
            'sessions.*.program_enrollment_id' => ['required_with:sessions', 'integer', 'exists:program_enrollments,id'],
            'sessions.*.subject_id' => ['required_with:sessions', 'integer', 'exists:subjects,id'],
            'sessions.*.date' => ['required_with:sessions', 'date_format:Y-m-d'],
            'sessions.*.time' => ['required_with:sessions', 'date_format:H:i'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'date.date_format' => 'Tanggal sesi harus menggunakan format yang valid.',
            'date.required_without_all' => 'Tanggal sesi wajib dipilih.',
            'dates.array' => 'Daftar tanggal sesi tidak valid.',
            'dates.min' => 'Pilih minimal satu tanggal sesi.',
            'dates.*.date_format' => 'Tanggal sesi harus menggunakan format yang valid.',
            'dates.*.required' => 'Tanggal sesi wajib dipilih.',
            'program_enrollment_id.exists' => 'Enrollment yang dipilih tidak valid.',
            'program_enrollment_id.required_without' => 'Enrollment wajib dipilih.',
            'sessions.array' => 'Daftar jadwal tidak valid.',
            'sessions.min' => 'Tambahkan minimal satu jadwal.',
            'sessions.*.date.date_format' => 'Tanggal sesi harus menggunakan format yang valid.',
            'sessions.*.date.required_with' => 'Tanggal sesi wajib dipilih.',
            'sessions.*.program_enrollment_id.exists' => 'Enrollment sesi yang dipilih tidak valid.',
            'sessions.*.program_enrollment_id.required_with' => 'Enrollment sesi wajib dipilih.',
            'sessions.*.subject_id.exists' => 'Mata pelajaran sesi yang dipilih tidak valid.',
            'sessions.*.subject_id.required_with' => 'Mata pelajaran sesi wajib dipilih.',
            'sessions.*.time.date_format' => 'Jam sesi harus menggunakan format yang valid.',
            'sessions.*.time.required_with' => 'Jam sesi wajib dipilih.',
            'subject_id.exists' => 'Mata pelajaran yang dipilih tidak valid.',
            'subject_id.required_without' => 'Mata pelajaran wajib dipilih.',
            'time.date_format' => 'Jam sesi harus menggunakan format yang valid.',
            'time.required_without' => 'Jam sesi wajib dipilih.',
            'timezone.max' => 'Zona waktu yang dipilih tidak valid.',
            'timezone.required' => 'Zona waktu belum tersedia. Muat ulang halaman lalu coba kembali.',
            'timezone.string' => 'Zona waktu yang dipilih tidak valid.',
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
                $usesSessionRows = is_array($this->input('sessions'));

                $sessions
                    ->groupBy('program_enrollment_id')
                    ->each(function ($items, int|string $enrollmentId) use ($usesSessionRows, $validator): void {
                        $enrollment = ProgramEnrollment::query()
                            ->with(['program.subjects:id', 'variant:id,session,duration'])
                            ->whereKey($enrollmentId)
                            ->where('user_id', $this->user()->id)
                            ->first();

                        if (! $enrollment) {
                            $items->each(function (array $session, int|string $index) use ($usesSessionRows, $validator): void {
                                $validator->errors()->add(
                                    $usesSessionRows ? "sessions.{$index}.program_enrollment_id" : 'program_enrollment_id',
                                    'Enrollment yang dipilih tidak valid.',
                                );
                            });

                            return;
                        }

                        $items->each(function (array $session, int|string $index) use ($enrollment, $usesSessionRows, $validator): void {
                            if (! $enrollment->program?->subjects->contains('id', (int) $session['subject_id'])) {
                                $validator->errors()->add(
                                    $usesSessionRows ? "sessions.{$index}.subject_id" : 'subject_id',
                                    'Mata pelajaran tidak tersedia untuk enrollment ini.',
                                );
                            }

                            $reason = app(BusinessCalendarService::class)->unavailabilityReason(
                                $this->scheduledAtUtc($session),
                                $enrollment->variant?->duration ?? 60,
                            );

                            if ($reason) {
                                $validator->errors()->add(
                                    $usesSessionRows ? "sessions.{$index}.date" : 'date',
                                    $reason,
                                );
                            }
                        });

                        if ($enrollment->sessionsRemaining() < $items->count()) {
                            $items->each(function (array $session, int|string $index) use ($usesSessionRows, $validator): void {
                                $validator->errors()->add(
                                    $usesSessionRows ? "sessions.{$index}.program_enrollment_id" : 'subject_id',
                                    'Sisa sesi untuk enrollment ini tidak mencukupi.',
                                );
                            });
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

    /** @param array{date: string, time: string} $session */
    public function scheduledAtUtc(array $session): CarbonImmutable
    {
        return app(UserDateTimeService::class)->fromLocal(
            "{$session['date']} {$session['time']}",
            $this->timezone(),
        );
    }

    public function timezone(): string
    {
        return $this->string('timezone')->toString();
    }
}
