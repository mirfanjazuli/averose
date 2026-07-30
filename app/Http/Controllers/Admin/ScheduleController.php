<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Concerns\FormatsScheduleSessions;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAdminScheduleRequest;
use App\Http\Requests\UpdateAdminScheduleRequest;
use App\Models\ProgramEnrollment;
use App\Models\Schedule;
use App\Notifications\ScheduleNotification;
use App\ScheduleDeliveryMode;
use App\Services\Scheduling\MentorAvailabilityService;
use App\Services\Scheduling\ZoomAccountAvailabilityService;
use App\Services\Zoom\ZoomMeetingService;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class ScheduleController extends Controller
{
    use FormatsScheduleSessions;

    public function __construct(
        private readonly MentorAvailabilityService $mentorAvailability,
        private readonly ZoomAccountAvailabilityService $zoomAccountAvailability,
        private readonly ZoomMeetingService $zoomMeetings,
    ) {}

    public function index(): Response
    {
        return Inertia::render('admin/scheduling/schedules/index', [
            'enrollments' => $this->enrollmentOptions(),
            'sessions' => $this->sessions(),
        ]);
    }

    public function store(StoreAdminScheduleRequest $request): RedirectResponse
    {
        $data = $request->validated();

        DB::transaction(function () use ($data, $request): void {
            $enrollment = ProgramEnrollment::query()
                ->with(['program.subjects:id', 'variant:id,duration,session'])
                ->whereKey($data['program_enrollment_id'])
                ->where('user_id', $data['user_id'])
                ->where('status', 'active')
                ->lockForUpdate()
                ->firstOrFail();

            if (! $enrollment->program?->subjects->contains('id', (int) $data['subject_id'])) {
                throw ValidationException::withMessages([
                    'subject_id' => 'The selected subject is not available for this enrollment.',
                ]);
            }

            if ($enrollment->sessionsRemaining() < 1) {
                throw ValidationException::withMessages([
                    'program_enrollment_id' => 'There are no remaining sessions for this enrollment.',
                ]);
            }

            $scheduledAt = CarbonImmutable::parse(
                "{$data['date']} {$data['time']}",
                config('app.timezone'),
            );
            $duration = $enrollment->variant?->duration ?? 60;
            $mentor = $this->mentorAvailability->lockActiveMentor((int) $data['mentor_id']);

            if (! $mentor) {
                throw ValidationException::withMessages([
                    'mentor_id' => 'The selected mentor is no longer active.',
                ]);
            }

            $conflict = $this->mentorAvailability->findConflict(
                $mentor->id,
                $scheduledAt,
                $duration,
            );

            if ($conflict) {
                $conflictEndAt = $conflict->scheduled_at->copy()->addMinutes($conflict->duration);

                throw ValidationException::withMessages([
                    'mentor_id' => sprintf(
                        'Mentor sudah memiliki jadwal pada %s–%s WIB.',
                        $conflict->scheduled_at->format('H:i'),
                        $conflictEndAt->format('H:i'),
                    ),
                ]);
            }

            $deliveryMode = ScheduleDeliveryMode::from($data['delivery_mode']);

            $schedule = Schedule::query()->create([
                'assigned_at' => now(),
                'delivery_mode' => $deliveryMode,
                'duration' => $duration,
                'mentor_id' => $mentor->id,
                'program_enrollment_id' => $enrollment->id,
                'scheduled_at' => $scheduledAt,
                'status' => 'assigned',
                'subject_id' => $data['subject_id'],
                'user_id' => $data['user_id'],
            ]);
            $schedule->load(['subject:id,name', 'enrollment.program:id,name']);

            if ($deliveryMode === ScheduleDeliveryMode::Online) {
                $zoomAccount = $this->zoomAccountAvailability->findFor($schedule);

                if (! $zoomAccount) {
                    throw ValidationException::withMessages([
                        'mentor_id' => 'No Zoom account is available for this schedule.',
                    ]);
                }

                $meeting = $this->zoomMeetings->create($zoomAccount, $schedule);
                $schedule->update([
                    'zoom_account_id' => $zoomAccount->id,
                    'zoom_link' => $meeting->joinUrl,
                    'zoom_meeting_id' => $meeting->meetingId,
                    'zoom_passcode' => $meeting->passcode,
                    'zoom_start_url' => $meeting->startUrl,
                ]);
            }

            $schedule->recordHistory('created', "Schedule dibuat manual oleh {$request->user()->name} dengan mentor {$mentor->name}.", $request->user(), [
                'delivery_mode' => $deliveryMode->value,
                'mentor_id' => $mentor->id,
                'mentor_name' => $mentor->name,
                'scheduled_at' => $scheduledAt->toDateTimeString(),
                'status' => 'assigned',
            ], $request->ip());

            $enrollment->increment('sessions_used');

            $student = $schedule->user;
            $scheduleCode = $schedule->code ?? "Schedule #{$schedule->id}";
            $scheduleTime = $scheduledAt->format('d M Y, H:i').' WIB';

            DB::afterCommit(function () use ($mentor, $student, $schedule, $scheduleCode, $scheduleTime): void {
                $mentor->notify(new ScheduleNotification(
                    event: 'schedule_assigned',
                    title: 'New schedule assigned',
                    message: "{$scheduleCode} is scheduled for {$scheduleTime}.",
                    scheduleCode: $scheduleCode,
                    url: "/schedules/{$schedule->id}",
                ));
                $student?->notify(new ScheduleNotification(
                    event: 'mentor_assigned',
                    title: 'Mentor sudah ditetapkan',
                    message: "{$mentor->name} akan mendampingi {$scheduleCode} pada {$scheduleTime}.",
                    scheduleCode: $scheduleCode,
                    url: '/schedules',
                ));
            });
        });

        return back()->with('success', 'Schedule added.');
    }

    public function update(UpdateAdminScheduleRequest $request, Schedule $schedule): RedirectResponse
    {
        $data = $request->validated();
        $scheduledAt = CarbonImmutable::parse(
            "{$data['date']} {$data['time']}",
            config('app.timezone'),
        );

        if ($scheduledAt->isPast()) {
            throw ValidationException::withMessages([
                'date' => 'The schedule must be in the future.',
            ]);
        }

        DB::transaction(function () use ($request, $schedule, $scheduledAt): void {
            $schedule = Schedule::query()
                ->with(['enrollment.program', 'mentor:id,name', 'subject:id,name', 'user:id,name'])
                ->whereKey($schedule->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($schedule->status === 'completed') {
                throw ValidationException::withMessages([
                    'date' => 'Completed schedules cannot be edited.',
                ]);
            }

            $previousScheduledAt = $schedule->scheduled_at->copy();

            if ($previousScheduledAt->equalTo($scheduledAt)) {
                return;
            }

            if ($schedule->mentor_id) {
                $mentor = $this->mentorAvailability->lockActiveMentor($schedule->mentor_id);

                if (! $mentor) {
                    throw ValidationException::withMessages([
                        'date' => 'The assigned mentor is no longer active.',
                    ]);
                }

                $conflict = $this->mentorAvailability->findConflict(
                    $mentor->id,
                    $scheduledAt,
                    $schedule->duration,
                    $schedule->id,
                );

                if ($conflict) {
                    $conflictEndAt = $conflict->scheduled_at->copy()->addMinutes($conflict->duration);

                    throw ValidationException::withMessages([
                        'date' => sprintf(
                            'Mentor sudah memiliki jadwal pada %s–%s WIB.',
                            $conflict->scheduled_at->format('H:i'),
                            $conflictEndAt->format('H:i'),
                        ),
                    ]);
                }
            }

            $schedule->scheduled_at = $scheduledAt;

            if ($schedule->delivery_mode === ScheduleDeliveryMode::Online && $schedule->mentor_id) {
                $zoomAccount = $this->zoomAccountAvailability->findFor($schedule);

                if (! $zoomAccount) {
                    throw ValidationException::withMessages([
                        'date' => 'No Zoom account is available for this schedule.',
                    ]);
                }

                $meeting = $this->zoomMeetings->create($zoomAccount, $schedule);
                $schedule->zoom_account_id = $zoomAccount->id;
                $schedule->zoom_link = $meeting->joinUrl;
                $schedule->zoom_meeting_id = $meeting->meetingId;
                $schedule->zoom_passcode = $meeting->passcode;
                $schedule->zoom_start_url = $meeting->startUrl;
            }

            $schedule->save();
            $schedule->recordHistory('updated', sprintf(
                'Waktu schedule diubah oleh %s dari %s menjadi %s.',
                $request->user()->name,
                $this->formatHistoryScheduleTime($previousScheduledAt),
                $this->formatHistoryScheduleTime($schedule->scheduled_at),
            ), $request->user(), [
                'scheduled_at' => [
                    'from' => $previousScheduledAt->toDateTimeString(),
                    'to' => $schedule->scheduled_at->toDateTimeString(),
                ],
            ], $request->ip());

            $mentor = $schedule->mentor;
            $student = $schedule->user;
            $scheduleCode = $schedule->code ?? "Schedule #{$schedule->id}";
            $scheduleTime = $this->formatHistoryScheduleTime($schedule->scheduled_at);

            DB::afterCommit(function () use ($mentor, $student, $schedule, $scheduleCode, $scheduleTime): void {
                $mentor?->notify(new ScheduleNotification(
                    event: 'schedule_updated',
                    title: 'Schedule updated',
                    message: "{$scheduleCode} has been moved to {$scheduleTime}.",
                    scheduleCode: $scheduleCode,
                    url: "/schedules/{$schedule->id}",
                ));
                $student?->notify(new ScheduleNotification(
                    event: 'schedule_updated',
                    title: 'Jadwal diperbarui',
                    message: "{$scheduleCode} dipindahkan ke {$scheduleTime}.",
                    scheduleCode: $scheduleCode,
                    url: '/schedules',
                ));
            });
        });

        return back()->with('success', 'Schedule updated.');
    }

    public function show(Schedule $schedule): Response
    {
        $schedule->load([
            'histories' => fn ($query) => $query->latest(),
            'mentor:id,name',
            'subject:id,name',
            'user:id,name',
            'zoomAccount:id,name,slug',
            'enrollment.program:id,name',
        ]);

        return Inertia::render('admin/scheduling/schedules/show', [
            'breadcrumbs' => [
                [
                    'title' => 'Scheduling',
                    'href' => '/scheduling/schedules',
                ],
                [
                    'title' => 'Schedules',
                    'href' => '/scheduling/schedules',
                ],
                [
                    'title' => $schedule->code,
                    'href' => "/scheduling/schedules/{$schedule->id}",
                ],
            ],
            'schedule' => [
                ...$this->sessionData($schedule, includeStudent: true),
                'duration' => $schedule->duration,
                'histories' => $schedule->histories
                    ->map(fn ($history): array => [
                        'action' => $history->action,
                        'actor' => $history->user_name ?? 'System',
                        'changes' => $history->changes ?? [],
                        'createdAt' => $history->created_at->toJSON(),
                        'description' => $history->description,
                        'id' => (string) $history->id,
                        'ipAddress' => $history->ip_address,
                        'role' => $history->user_role,
                    ])
                    ->all(),
            ],
        ]);
    }

    private function sessions(): array
    {
        return Schedule::query()
            ->with(['mentor:id,name', 'pendingRescheduleRequest', 'subject:id,name,icon', 'user:id,name', 'zoomAccount:id,name,slug', 'enrollment.program:id,name'])
            ->orderBy('scheduled_at')
            ->get()
            ->map(fn (Schedule $schedule): array => $this->sessionData($schedule, includeStudent: true))
            ->all();
    }

    private function enrollmentOptions(): array
    {
        return ProgramEnrollment::query()
            ->with(['program.subjects:id,name,icon', 'user:id,name', 'variant:id,duration,session'])
            ->where('status', 'active')
            ->latest()
            ->get()
            ->filter(fn (ProgramEnrollment $enrollment): bool => $enrollment->sessionsRemaining() > 0)
            ->map(fn (ProgramEnrollment $enrollment): array => [
                'duration' => $enrollment->variant?->duration ?? 60,
                'id' => (string) $enrollment->id,
                'label' => "{$enrollment->user?->name} · {$enrollment->program?->name}",
                'program' => $enrollment->program?->name ?? '-',
                'remainingSessions' => $enrollment->sessionsRemaining(),
                'student' => $enrollment->user?->name ?? '-',
                'subjects' => $enrollment->program?->subjects
                    ->map(fn ($subject): array => [
                        'icon' => $subject->icon,
                        'id' => (string) $subject->id,
                        'name' => $subject->name,
                    ])
                    ->values()
                    ->all() ?? [],
                'userId' => (string) $enrollment->user_id,
            ])
            ->values()
            ->all();
    }

    private function formatHistoryScheduleTime(CarbonInterface $date): string
    {
        return $date->copy()->locale('id')->translatedFormat('d M Y, H:i').' WIB';
    }
}
