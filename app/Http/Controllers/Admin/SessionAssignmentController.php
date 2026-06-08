<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\AssignSessionBookingRequest;
use App\Models\SessionBooking;
use App\Models\ZoomAccount;
use App\Services\Zoom\ZoomMeetingService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SessionAssignmentController extends Controller
{
    public function __construct(private readonly ZoomMeetingService $zoomMeetings) {}

    public function update(AssignSessionBookingRequest $request, SessionBooking $sessionBooking): RedirectResponse
    {
        DB::transaction(function () use ($request, $sessionBooking): void {
            $booking = SessionBooking::query()
                ->with(['subject:id,name', 'enrollment.program:id,name'])
                ->whereKey($sessionBooking->id)
                ->lockForUpdate()
                ->firstOrFail();

            $zoomAccount = $this->availableZoomAccount($booking);

            if (! $zoomAccount) {
                throw ValidationException::withMessages([
                    'mentor_id' => 'No Zoom account is available for this schedule.',
                ]);
            }

            $meeting = $this->zoomMeetings->create($zoomAccount, $booking);

            $booking->update([
                'assigned_at' => now(),
                'mentor_id' => $request->integer('mentor_id'),
                'status' => 'assigned',
                'zoom_account_id' => $zoomAccount->id,
                'zoom_link' => $meeting->joinUrl,
                'zoom_meeting_id' => $meeting->meetingId,
                'zoom_passcode' => $meeting->passcode,
                'zoom_start_url' => $meeting->startUrl,
            ]);
        });

        return back()->with('success', 'Session assigned.');
    }

    private function availableZoomAccount(SessionBooking $booking): ?ZoomAccount
    {
        $startAt = $booking->scheduled_at;
        $endAt = $booking->scheduled_at->copy()->addMinutes($booking->duration);

        return ZoomAccount::query()
            ->orderBy('name')
            ->get()
            ->first(function (ZoomAccount $account) use ($booking, $startAt, $endAt): bool {
                $overlappingMeetings = SessionBooking::query()
                    ->where('zoom_account_id', $account->id)
                    ->whereKeyNot($booking->id)
                    ->whereNotNull('zoom_link')
                    ->where('scheduled_at', '<', $endAt)
                    ->get(['id', 'scheduled_at', 'duration'])
                    ->filter(fn (SessionBooking $assignedBooking): bool => $assignedBooking->scheduled_at->copy()->addMinutes($assignedBooking->duration)->greaterThan($startAt))
                    ->count();

                return $overlappingMeetings < 2;
            });
    }
}
