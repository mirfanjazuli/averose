<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreRescheduleRequest;
use App\Models\RescheduleRequest;
use App\Models\Schedule;
use App\Models\User;
use App\NotificationEvent;
use App\Notifications\ScheduleNotification;
use App\Services\DateTime\UserDateTimeService;
use App\Services\Scheduling\BusinessCalendarService;
use App\Services\Scheduling\MentorAvailabilityService;
use Carbon\CarbonInterface;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class RescheduleRequestController extends Controller
{
    public function __construct(
        private readonly BusinessCalendarService $businessCalendar,
        private readonly UserDateTimeService $dateTimes,
        private readonly MentorAvailabilityService $mentorAvailability,
    ) {}

    public function store(StoreRescheduleRequest $request, Schedule $schedule): RedirectResponse
    {
        abort_unless($schedule->user_id === $request->user()->id, 403);

        $validated = $request->validated();
        $requestedScheduledAt = $request->requestedScheduledAtUtc();

        DB::transaction(function () use ($request, $schedule, $validated, $requestedScheduledAt): void {
            $booking = Schedule::query()
                ->whereKey($schedule->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($booking->scheduled_at->isPast()) {
                throw ValidationException::withMessages([
                    'requested_scheduled_at' => 'Past sessions cannot be rescheduled.',
                ]);
            }

            if (! $booking->mentor_id) {
                throw ValidationException::withMessages([
                    'requested_scheduled_at' => 'This session needs an assigned mentor before requesting a reschedule.',
                ]);
            }

            if ($booking->pendingRescheduleRequest()->exists()) {
                throw ValidationException::withMessages([
                    'requested_scheduled_at' => 'This session already has a pending reschedule request.',
                ]);
            }

            $mentor = $this->mentorAvailability->lockActiveMentor($booking->mentor_id);

            if (! $mentor
                || $requestedScheduledAt->lessThanOrEqualTo(now())
                || $this->businessCalendar->unavailabilityReason($requestedScheduledAt, $booking->duration)
                || $this->mentorAvailability->findConflict(
                    $mentor->id,
                    $requestedScheduledAt,
                    $booking->duration,
                    $booking->id,
                )) {
                throw ValidationException::withMessages([
                    'requested_scheduled_at' => 'The selected slot is no longer available.',
                ]);
            }

            RescheduleRequest::create([
                'current_scheduled_at' => $booking->scheduled_at,
                'current_timezone' => $booking->timezone,
                'duration' => $booking->duration,
                'mentor_id' => $booking->mentor_id,
                'notes' => $validated['notes'],
                'reason' => $validated['reason'],
                'current_timezone' => $booking->timezone,
                'requested_timezone' => $request->timezone(),
                'requested_scheduled_at' => $requestedScheduledAt,
                'requested_timezone' => $request->timezone(),
                'schedule_id' => $booking->id,
                'status' => 'pending',
                'user_id' => $request->user()->id,
            ]);
            $booking->recordHistory('reschedule_requested', sprintf(
                'Reschedule diajukan oleh %s dari %s menjadi %s.',
                $request->user()->name,
                $this->formatHistoryScheduleTime($booking->scheduled_at, $request->timezone()),
                $this->formatHistoryScheduleTime($requestedScheduledAt, $request->timezone()),
            ), $request->user(), [
                'current_scheduled_at' => $booking->scheduled_at->toDateTimeString(),
                'requested_scheduled_at' => $requestedScheduledAt->toDateTimeString(),
                'reason' => $validated['reason'],
            ], $request->ip());

            $mentor = User::query()->find($booking->mentor_id);
            $scheduleCode = $booking->code ?? "Schedule #{$booking->id}";
            $studentName = $request->user()->name;

            DB::afterCommit(function () use ($mentor, $scheduleCode, $studentName, $booking): void {
                $mentor?->notify(new ScheduleNotification(
                    event: NotificationEvent::RescheduleRequested,
                    title: 'Reschedule requested',
                    message: "{$studentName} requested a new time for {$scheduleCode}.",
                    scheduleCode: $scheduleCode,
                    url: "/schedules/{$booking->id}",
                ));
            });
        });

        return back()->with('success', 'Reschedule request sent. Waiting for admin approval.');
    }

    private function formatHistoryScheduleTime(CarbonInterface $date, string $timezone): string
    {
        $localDate = $this->dateTimes->toLocal($date, $timezone)->locale('id');

        return $localDate->translatedFormat('d M Y, H:i').' '.$localDate->format('T');
    }
}
