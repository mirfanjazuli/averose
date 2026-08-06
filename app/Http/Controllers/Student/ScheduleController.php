<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Concerns\FormatsScheduleSessions;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreScheduleRequest;
use App\Http\Requests\UpdateStudentScheduleRequest;
use App\Models\ProgramEnrollment;
use App\Models\Schedule;
use App\Services\DateTime\UserDateTimeService;
use App\Services\Scheduling\BusinessCalendarService;
use Carbon\CarbonInterface;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class ScheduleController extends Controller
{
    use FormatsScheduleSessions;

    public function index(Request $request): Response
    {
        return Inertia::render('student/schedules/index', [
            'sessions' => $this->sessions($request),
            'subjects' => $this->subjectOptions($request),
        ]);
    }

    public function store(StoreScheduleRequest $request): RedirectResponse
    {
        $data = $request->validated();

        DB::transaction(function () use ($data, $request): void {
            $this->normalizedSessions($data)
                ->groupBy('program_enrollment_id')
                ->each(function ($sessions, int|string $enrollmentId) use ($data, $request): void {
                    $enrollment = ProgramEnrollment::query()
                        ->with(['program.subjects:id', 'variant:id,session,duration'])
                        ->whereKey($enrollmentId)
                        ->where('user_id', $request->user()->id)
                        ->lockForUpdate()
                        ->firstOrFail();

                    if ($enrollment->sessionsRemaining() < $sessions->count()) {
                        $messages = isset($data['sessions'])
                            ? $sessions->keys()->mapWithKeys(fn (int|string $index): array => [
                                "sessions.{$index}.program_enrollment_id" => 'Sisa sesi untuk enrollment ini tidak mencukupi.',
                            ])->all()
                            : ['subject_id' => 'Sisa sesi untuk enrollment ini tidak mencukupi.'];

                        throw ValidationException::withMessages([
                            ...$messages,
                        ]);
                    }

                    $sessions->each(function (array $session, int|string $index) use ($data, $enrollment, $request): void {
                        if (! $enrollment->program?->subjects->contains('id', (int) $session['subject_id'])) {
                            throw ValidationException::withMessages([
                                isset($data['sessions']) ? "sessions.{$index}.subject_id" : 'subject_id' => 'Mata pelajaran tidak tersedia untuk enrollment ini.',
                            ]);
                        }

                        $scheduledAt = $request->scheduledAtUtc($session);

                        $schedule = Schedule::query()->create([
                            'duration' => $enrollment->variant?->duration ?? 60,
                            'program_enrollment_id' => $enrollment->id,
                            'scheduled_at' => $scheduledAt,
                            'timezone' => $request->timezone(),
                            'status' => 'pending',
                            'subject_id' => $session['subject_id'],
                            'user_id' => $request->user()->id,
                        ]);
                        $schedule->recordHistory('created', "Booking schedule dibuat oleh {$request->user()->name}.", $request->user(), [
                            'scheduled_at' => $scheduledAt->toDateTimeString(),
                            'status' => 'pending',
                            'timezone' => $request->timezone(),
                        ], $request->ip());
                    });

                    $enrollment->increment('sessions_used', $sessions->count());
                });
        });

        return back()->with('success', 'Session booked.');
    }

    public function update(
        UpdateStudentScheduleRequest $request,
        Schedule $schedule,
        BusinessCalendarService $businessCalendar,
    ): RedirectResponse {
        abort_unless($schedule->user_id === $request->user()->id, 403);

        if ($schedule->status !== 'pending') {
            throw ValidationException::withMessages([
                'date' => 'Only pending sessions can be edited.',
            ]);
        }

        $previousScheduledAt = $schedule->scheduled_at->copy();
        $previousTimezone = $schedule->timezone;
        $scheduledAt = $request->scheduledAtUtc();

        if ($reason = $businessCalendar->unavailabilityReason($scheduledAt, $schedule->duration)) {
            throw ValidationException::withMessages(['date' => $reason]);
        }

        $schedule->update([
            'scheduled_at' => $scheduledAt,
            'timezone' => $request->timezone(),
        ]);
        $schedule->recordHistory('updated', sprintf(
            'Waktu schedule diubah oleh %s dari %s menjadi %s.',
            $request->user()->name,
            $this->formatHistoryScheduleTime($previousScheduledAt, $request->timezone()),
            $this->formatHistoryScheduleTime($scheduledAt, $request->timezone()),
        ), $request->user(), [
            'scheduled_at' => [
                'from' => $previousScheduledAt->toDateTimeString(),
                'to' => $scheduledAt->toDateTimeString(),
            ],
            'timezone' => [
                'from' => $previousTimezone,
                'to' => $request->timezone(),
            ],
        ], $request->ip());

        return back()->with('success', 'Session updated.');
    }

    private function sessions(Request $request): array
    {
        $schedules = Schedule::query()
            ->with([
                'enrollment.program:id,name',
                'feedback',
                'mentor:id,name',
                'mentorJournal.attachments:id,uuid,mentor_journal_id,original_name,mime_type,size',
                'pendingRescheduleRequest',
                'subject:id,name,icon',
                'zoomAccount:id,name',
            ])
            ->where('user_id', $request->user()->id)
            ->orderBy('scheduled_at')
            ->get();

        $mentorRatings = DB::table('schedule_feedback')
            ->selectRaw('mentor_id, AVG((interactivity_rating + material_clarity_rating + audio_quality_rating + visual_quality_rating) / 4.0) as rating')
            ->whereIn('mentor_id', $schedules->pluck('mentor_id')->filter()->unique())
            ->groupBy('mentor_id')
            ->pluck('rating', 'mentor_id');

        return $schedules
            ->map(function (Schedule $schedule) use ($mentorRatings): array {
                $data = $this->sessionData($schedule);
                $rating = $schedule->mentor_id ? $mentorRatings->get($schedule->mentor_id) : null;

                $data['mentorRating'] = $rating === null ? null : round((float) $rating, 1);

                return $data;
            })
            ->all();
    }

    private function subjectOptions(Request $request): array
    {
        $enrollments = $request->user()
            ->programEnrollments()
            ->with(['program:id,name', 'program.subjects:id,name,icon', 'variant:id,duration,session'])
            ->latest()
            ->get();

        return $enrollments
            ->flatMap(fn (ProgramEnrollment $enrollment) => $enrollment->program?->subjects->map(fn ($subject): array => [
                'duration' => $enrollment->variant?->duration ?? 60,
                'enrollmentId' => (string) $enrollment->id,
                'icon' => $subject->icon,
                'label' => $subject->name,
                'program' => $enrollment->program?->name,
                'sessionsRemaining' => $enrollment->sessionsRemaining(),
                'subjectId' => (string) $subject->id,
                'value' => "{$enrollment->id}:{$subject->id}",
            ]) ?? [])
            ->values()
            ->all();
    }

    private function normalizedSessions(array $data): Collection
    {
        if (isset($data['sessions'])) {
            return collect($data['sessions'])->map(fn (array $session): array => [
                'date' => $session['date'],
                'program_enrollment_id' => (int) $session['program_enrollment_id'],
                'subject_id' => (int) $session['subject_id'],
                'time' => $session['time'],
            ]);
        }

        return collect($data['dates'] ?? [])
            ->when(
                isset($data['date']),
                fn ($items) => $items->push($data['date']),
            )
            ->filter()
            ->unique()
            ->values()
            ->map(fn (string $date): array => [
                'date' => $date,
                'program_enrollment_id' => (int) $data['program_enrollment_id'],
                'subject_id' => (int) $data['subject_id'],
                'time' => $data['time'],
            ]);
    }

    private function formatHistoryScheduleTime(CarbonInterface $date, string $timezone): string
    {
        $localDate = app(UserDateTimeService::class)->toLocal($date, $timezone)->locale('id');

        return $localDate->translatedFormat('d M Y, H:i').' '.$localDate->format('T');
    }
}
