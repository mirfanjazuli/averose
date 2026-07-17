<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\RescheduleRequest;
use App\Models\Schedule;
use Carbon\CarbonImmutable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class RescheduleRequestController extends Controller
{
    public function store(Request $request, Schedule $schedule): RedirectResponse
    {
        abort_unless($schedule->user_id === $request->user()->id, 403);

        $validated = $request->validate([
            'notes' => ['nullable', 'string', 'max:1000'],
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

            if (! $this->isMentorAvailable($booking, $requestedScheduledAt)) {
                throw ValidationException::withMessages([
                    'requested_scheduled_at' => 'The selected slot is no longer available.',
                ]);
            }

            RescheduleRequest::create([
                'current_scheduled_at' => $booking->scheduled_at,
                'duration' => $booking->duration,
                'mentor_id' => $booking->mentor_id,
                'notes' => $validated['notes'] ?? null,
                'reason' => $validated['reason'],
                'requested_scheduled_at' => $requestedScheduledAt,
                'schedule_id' => $booking->id,
                'status' => 'pending',
                'user_id' => $request->user()->id,
            ]);
        });

        return back()->with('success', 'Reschedule request sent. Waiting for admin approval.');
    }

    private function isMentorAvailable(Schedule $booking, CarbonImmutable $requestedScheduledAt): bool
    {
        $endAt = $requestedScheduledAt->addMinutes($booking->duration);

        if ($requestedScheduledAt->lessThanOrEqualTo(now())) {
            return false;
        }

        return ! Schedule::query()
            ->where('mentor_id', $booking->mentor_id)
            ->whereKeyNot($booking->id)
            ->where('scheduled_at', '<', $endAt)
            ->get(['id', 'scheduled_at', 'duration'])
            ->contains(fn (Schedule $mentorBooking): bool => $mentorBooking->scheduled_at->copy()->addMinutes($mentorBooking->duration)->greaterThan($requestedScheduledAt));
    }
}
