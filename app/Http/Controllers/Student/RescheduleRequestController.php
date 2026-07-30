<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\RescheduleRequest;
use App\Models\Schedule;
use App\Models\User;
use App\Notifications\ScheduleNotification;
use App\Services\Scheduling\MentorAvailabilityService;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class RescheduleRequestController extends Controller
{
    public function __construct(private readonly MentorAvailabilityService $mentorAvailability) {}

    public function store(Request $request, Schedule $schedule): RedirectResponse
    {
        abort_unless($schedule->user_id === $request->user()->id, 403);

        $validated = $request->validate([
            'notes' => ['required', 'string', 'max:1000'],
            'reason' => ['required', 'string', 'max:120'],
            'requested_scheduled_at' => ['required', 'date'],
        ]);

        $requestedScheduledAt = CarbonImmutable::parse($validated['requested_scheduled_at'], config('app.timezone'));

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
                'duration' => $booking->duration,
                'mentor_id' => $booking->mentor_id,
                'notes' => $validated['notes'],
                'reason' => $validated['reason'],
                'requested_scheduled_at' => $requestedScheduledAt,
                'schedule_id' => $booking->id,
                'status' => 'pending',
                'user_id' => $request->user()->id,
            ]);
            $booking->recordHistory('reschedule_requested', sprintf(
                'Reschedule diajukan oleh %s dari %s menjadi %s.',
                $request->user()->name,
                $this->formatHistoryScheduleTime($booking->scheduled_at),
                $this->formatHistoryScheduleTime($requestedScheduledAt),
            ), $request->user(), [
                'current_scheduled_at' => $booking->scheduled_at->toDateTimeString(),
                'requested_scheduled_at' => $requestedScheduledAt->toDateTimeString(),
                'reason' => $validated['reason'],
            ], $request->ip());

            $mentor = User::query()->find($booking->mentor_id);
            $scheduleCode = $booking->code ?? "Schedule #{$booking->id}";
            $studentName = $request->user()->name;
            $requestedTime = $this->formatHistoryScheduleTime($requestedScheduledAt);

            DB::afterCommit(function () use ($mentor, $scheduleCode, $studentName, $requestedTime, $booking): void {
                $mentor?->notify(new ScheduleNotification(
                    event: 'reschedule_requested',
                    title: 'Reschedule requested',
                    message: "{$studentName} requested {$scheduleCode} to move to {$requestedTime}.",
                    scheduleCode: $scheduleCode,
                    url: "/schedules/{$booking->id}",
                ));
            });
        });

        return back()->with('success', 'Reschedule request sent. Waiting for admin approval.');
    }

    private function formatHistoryScheduleTime(CarbonInterface $date): string
    {
        return $date->copy()->locale('id')->translatedFormat('d M Y, H:i').' WIB';
    }
}
