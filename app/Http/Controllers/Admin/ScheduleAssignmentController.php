<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\AssignScheduleRequest;
use App\Models\Schedule;
use App\Models\User;
use App\NotificationEvent;
use App\Notifications\ScheduleNotification;
use App\Rules\IanaTimezone;
use App\ScheduleDeliveryMode;
use App\Services\DateTime\UserDateTimeService;
use App\Services\Scheduling\MentorAvailabilityService;
use App\Services\Scheduling\ZoomAccountAvailabilityService;
use App\Services\Zoom\ZoomMeetingService;
use App\UserRole;
use Carbon\CarbonInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ScheduleAssignmentController extends Controller
{
    public function __construct(
        private readonly UserDateTimeService $dateTimes,
        private readonly MentorAvailabilityService $mentorAvailability,
        private readonly ZoomAccountAvailabilityService $zoomAccountAvailability,
        private readonly ZoomMeetingService $zoomMeetings,
    ) {}

    public function createOptions(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'date' => ['required', 'date_format:Y-m-d'],
            'duration' => ['required', 'integer', 'min:1', 'max:1440'],
            'time' => ['required', 'date_format:H:i'],
            'timezone' => ['required', 'string', 'max:64', new IanaTimezone],
        ]);

        return $this->mentorOptionsResponse(
            $this->dateTimes->fromLocal(
                "{$validated['date']} {$validated['time']}",
                $validated['timezone'],
            ),
            (int) $validated['duration'],
        );
    }

    public function options(Schedule $schedule): JsonResponse
    {
        return $this->mentorOptionsResponse(
            $schedule->scheduled_at,
            $schedule->duration,
            $schedule->id,
        );
    }

    private function mentorOptionsResponse(
        CarbonInterface $startAt,
        int $duration,
        ?int $ignoredScheduleId = null,
    ): JsonResponse {
        $mentors = User::query()
            ->with('mentorProfile.mentorLevel:id,name,hourly_rate,status')
            ->where('role', UserRole::Mentor)
            ->where('status', 'active')
            ->orderBy('name')
            ->get(['id', 'name', 'role']);
        $conflicts = $this->mentorAvailability->conflictsForMentors(
            $mentors->pluck('id'),
            $startAt,
            $duration,
            $ignoredScheduleId,
        );

        return response()->json([
            'mentors' => $mentors->map(function (User $mentor) use ($conflicts): array {
                $mentorLevel = $mentor->resolvedMentorLevel();
                $conflict = $conflicts->get($mentor->id);

                return [
                    'available' => $conflict === null,
                    'conflict' => $conflict ? [
                        'code' => $conflict->code,
                        'endAt' => $this->dateTimes->toUtcIso($conflict->scheduled_at->copy()->addMinutes($conflict->duration)),
                        'startAt' => $this->dateTimes->toUtcIso($conflict->scheduled_at),
                    ] : null,
                    'hourlyRate' => $mentorLevel?->hourly_rate,
                    'id' => (string) $mentor->id,
                    'level' => $mentorLevel?->name,
                    'name' => $mentor->name,
                ];
            })->values(),
        ]);
    }

    public function update(AssignScheduleRequest $request, Schedule $schedule): RedirectResponse
    {
        DB::transaction(function () use ($request, $schedule): void {
            $booking = Schedule::query()
                ->with(['subject:id,name', 'enrollment.program:id,name', 'user:id,name'])
                ->whereKey($schedule->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($booking->status === 'completed') {
                throw ValidationException::withMessages([
                    'mentor_id' => 'Completed schedules cannot be reassigned.',
                ]);
            }

            $mentor = $this->mentorAvailability->lockActiveMentor($request->integer('mentor_id'));

            if (! $mentor) {
                throw ValidationException::withMessages([
                    'mentor_id' => 'The selected mentor is no longer active.',
                ]);
            }

            $conflict = $this->mentorAvailability->findConflict(
                $mentor->id,
                $booking->scheduled_at,
                $booking->duration,
                $booking->id,
            );

            if ($conflict) {
                throw ValidationException::withMessages([
                    'mentor_id' => "Mentor sudah memiliki jadwal pada {$this->formatConflictTime($conflict, $this->dateTimes->timezoneFor($request->user()))}.",
                ]);
            }

            $zoomAccount = null;
            $meeting = null;

            if ($booking->delivery_mode === ScheduleDeliveryMode::Online) {
                $zoomAccount = $this->zoomAccountAvailability->findFor($booking);

                if (! $zoomAccount) {
                    throw ValidationException::withMessages([
                        'mentor_id' => 'No Zoom account is available for this schedule.',
                    ]);
                }

                $meeting = $this->zoomMeetings->create($zoomAccount, $booking);
            }

            $previousMentorId = $booking->mentor_id;
            $previousMentor = $previousMentorId
                ? User::query()->find($previousMentorId)
                : null;
            $previousStatus = $booking->status;

            $booking->update([
                'assigned_at' => now(),
                'mentor_id' => $mentor->id,
                'status' => 'assigned',
                'zoom_account_id' => $zoomAccount?->id,
                'zoom_link' => $meeting?->joinUrl,
                'zoom_meeting_id' => $meeting?->meetingId,
                'zoom_passcode' => $meeting?->passcode,
                'zoom_start_url' => $meeting?->startUrl,
            ]);
            $booking->load(['mentor:id,name', 'zoomAccount:id,name']);
            $booking->recordHistory('assigned', "Mentor dan Zoom ditetapkan oleh {$request->user()->name}.", $request->user(), [
                'mentor_id' => [
                    'from' => $previousMentorId,
                    'to' => $booking->mentor_id,
                ],
                'mentor_name' => $booking->mentor?->name,
                'status' => [
                    'from' => $previousStatus,
                    'to' => $booking->status,
                ],
                'zoom_account' => $booking->zoomAccount?->name,
                'zoom_meeting_id' => $booking->zoom_meeting_id,
            ], $request->ip());

            $newMentor = $booking->mentor;
            $student = $booking->user;
            $scheduleCode = $booking->code ?? "Schedule #{$booking->id}";
            $studentName = $booking->user?->name ?? 'a student';

            DB::afterCommit(function () use ($newMentor, $student, $scheduleCode, $studentName, $booking): void {
                $newMentor?->notify(new ScheduleNotification(
                    event: NotificationEvent::ScheduleAssigned,
                    title: 'New schedule assigned',
                    message: "{$scheduleCode} with {$studentName} has been assigned to you.",
                    scheduleCode: $scheduleCode,
                    url: "/schedules/{$booking->id}",
                ));
                $student?->notify(new ScheduleNotification(
                    event: NotificationEvent::MentorAssigned,
                    title: 'Mentor sudah ditetapkan',
                    message: "{$newMentor?->name} akan mendampingi {$scheduleCode}.",
                    scheduleCode: $scheduleCode,
                    url: '/schedules',
                ));
            });

            if ($previousMentor && $previousMentor->isNot($newMentor)) {
                DB::afterCommit(function () use ($previousMentor, $scheduleCode): void {
                    $previousMentor->notify(new ScheduleNotification(
                        event: NotificationEvent::ScheduleReassigned,
                        title: 'Schedule reassigned',
                        message: "You are no longer assigned to {$scheduleCode}.",
                        scheduleCode: $scheduleCode,
                        url: '/schedules',
                    ));
                });
            }
        });

        return back()->with('success', 'Session assigned.');
    }

    private function formatConflictTime(Schedule $schedule, string $timezone): string
    {
        $startAt = $this->dateTimes->toLocal($schedule->scheduled_at, $timezone);
        $endAt = $startAt->addMinutes($schedule->duration);

        return $startAt->format('H:i').'–'.$endAt->format('H:i').' '.$startAt->format('T');
    }
}
