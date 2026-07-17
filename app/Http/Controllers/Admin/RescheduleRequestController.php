<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\RescheduleRequest;
use App\Models\Schedule;
use App\Services\Zoom\ZoomMeetingService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class RescheduleRequestController extends Controller
{
    public function __construct(private readonly ZoomMeetingService $zoomMeetings) {}

    public function index(): Response
    {
        $requests = RescheduleRequest::query()
            ->with([
                'schedule.subject:id,name',
                'schedule.enrollment.program:id,name',
                'mentor:id,name',
                'reviewer:id,name',
                'user:id,name',
            ])
            ->latest()
            ->get();

        return Inertia::render('admin/scheduling/reschedule-requests/index', [
            'requests' => $requests->map(fn (RescheduleRequest $request): array => $this->requestData($request))->all(),
            'summary' => [
                'approved' => $requests->where('status', 'approved')->count(),
                'pending' => $requests->where('status', 'pending')->count(),
                'rejected' => $requests->where('status', 'rejected')->count(),
            ],
        ]);
    }

    public function approve(Request $request, RescheduleRequest $rescheduleRequest): RedirectResponse
    {
        DB::transaction(function () use ($request, $rescheduleRequest): void {
            $rescheduleRequest = RescheduleRequest::query()
                ->with(['schedule.zoomAccount', 'schedule.subject', 'schedule.enrollment.program'])
                ->whereKey($rescheduleRequest->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($rescheduleRequest->status !== 'pending') {
                return;
            }

            $booking = $rescheduleRequest->schedule;

            if (! $this->isMentorAvailable($booking, $rescheduleRequest)) {
                throw ValidationException::withMessages([
                    'requested_scheduled_at' => 'The requested slot is no longer available.',
                ]);
            }

            $booking->scheduled_at = $rescheduleRequest->requested_scheduled_at;
            $booking->duration = $rescheduleRequest->duration;
            $booking->status = 'rescheduled';

            if ($booking->zoomAccount) {
                $meeting = $this->zoomMeetings->create($booking->zoomAccount, $booking);

                $booking->zoom_link = $meeting->joinUrl;
                $booking->zoom_meeting_id = $meeting->meetingId;
                $booking->zoom_passcode = $meeting->passcode;
                $booking->zoom_start_url = $meeting->startUrl;
            }

            $booking->save();

            $rescheduleRequest->update([
                'reviewed_at' => now(),
                'reviewed_by' => $request->user()->id,
                'status' => 'approved',
            ]);
        });

        return back()->with('success', 'Reschedule request approved.');
    }

    public function reject(Request $request, RescheduleRequest $rescheduleRequest): RedirectResponse
    {
        $validated = $request->validate([
            'admin_note' => ['nullable', 'string', 'max:1000'],
        ]);

        if ($rescheduleRequest->status !== 'pending') {
            return back();
        }

        $rescheduleRequest->update([
            'admin_note' => $validated['admin_note'] ?? null,
            'reviewed_at' => now(),
            'reviewed_by' => $request->user()->id,
            'status' => 'rejected',
        ]);

        return back()->with('success', 'Reschedule request rejected.');
    }

    private function requestData(RescheduleRequest $request): array
    {
        $currentEndAt = $request->current_scheduled_at->copy()->addMinutes($request->duration);
        $requestedEndAt = $request->requested_scheduled_at->copy()->addMinutes($request->duration);

        return [
            'adminNote' => $request->admin_note,
            'current' => "{$request->current_scheduled_at->format('D, M j, H:i')} - {$currentEndAt->format('H:i')}",
            'id' => (string) $request->id,
            'mentor' => $request->mentor?->name ?? 'Unassigned mentor',
            'notes' => $request->notes,
            'program' => $request->schedule?->enrollment?->program?->name ?? '-',
            'reason' => $request->reason,
            'requested' => "{$request->requested_scheduled_at->format('D, M j, H:i')} - {$requestedEndAt->format('H:i')}",
            'reviewedAt' => $request->reviewed_at?->format('M j, Y H:i'),
            'reviewer' => $request->reviewer?->name,
            'session' => $request->schedule?->subject?->name ?? 'Session',
            'status' => Str::headline($request->status),
            'student' => $request->user?->name ?? '-',
        ];
    }

    private function isMentorAvailable(Schedule $booking, RescheduleRequest $request): bool
    {
        $endAt = $request->requested_scheduled_at->copy()->addMinutes($request->duration);

        return ! Schedule::query()
            ->where('mentor_id', $request->mentor_id)
            ->whereKeyNot($booking->id)
            ->where('scheduled_at', '<', $endAt)
            ->get(['id', 'scheduled_at', 'duration'])
            ->contains(fn (Schedule $mentorBooking): bool => $mentorBooking->scheduled_at->copy()->addMinutes($mentorBooking->duration)->greaterThan($request->requested_scheduled_at));
    }
}
