<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\RescheduleRequest;
use App\NotificationEvent;
use App\Notifications\ScheduleNotification;
use App\Services\DateTime\UserDateTimeService;
use App\Services\Scheduling\BusinessCalendarService;
use App\Services\Scheduling\MentorAvailabilityService;
use App\Services\Zoom\ZoomMeetingService;
use Carbon\CarbonInterface;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class RescheduleRequestController extends Controller
{
    public function __construct(
        private readonly BusinessCalendarService $businessCalendar,
        private readonly UserDateTimeService $dateTimes,
        private readonly MentorAvailabilityService $mentorAvailability,
        private readonly ZoomMeetingService $zoomMeetings,
    ) {}

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

    public function show(RescheduleRequest $rescheduleRequest): Response
    {
        $rescheduleRequest->load([
            'schedule.subject:id,name',
            'schedule.enrollment.program:id,name',
            'mentor:id,name',
            'reviewer:id,name',
            'user:id,name',
        ]);

        return Inertia::render('admin/scheduling/reschedule-requests/show', [
            'breadcrumbs' => [
                [
                    'title' => 'Scheduling',
                    'href' => '/scheduling/schedules',
                ],
                [
                    'title' => 'Reschedule Requests',
                    'href' => '/scheduling/reschedule-requests',
                ],
                [
                    'title' => $rescheduleRequest->schedule?->code ?? "Request #{$rescheduleRequest->id}",
                    'href' => "/scheduling/reschedule-requests/{$rescheduleRequest->id}",
                ],
            ],
            'request' => $this->requestData($rescheduleRequest),
        ]);
    }

    public function approve(Request $request, RescheduleRequest $rescheduleRequest): RedirectResponse
    {
        DB::transaction(function () use ($request, $rescheduleRequest): void {
            $rescheduleRequest = RescheduleRequest::query()
                ->with(['schedule.mentor:id,name', 'schedule.user:id,name', 'schedule.zoomAccount', 'schedule.subject', 'schedule.enrollment.program'])
                ->whereKey($rescheduleRequest->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($rescheduleRequest->status !== 'pending') {
                return;
            }

            $booking = $rescheduleRequest->schedule;
            $mentor = $booking?->mentor_id
                ? $this->mentorAvailability->lockActiveMentor($booking->mentor_id)
                : null;

            if (! $mentor
                || $this->businessCalendar->unavailabilityReason(
                    $rescheduleRequest->requested_scheduled_at,
                    $rescheduleRequest->duration,
                )
                || $this->mentorAvailability->findConflict(
                    $mentor->id,
                    $rescheduleRequest->requested_scheduled_at,
                    $rescheduleRequest->duration,
                    $booking->id,
                )) {
                throw ValidationException::withMessages([
                    'requested_scheduled_at' => 'The requested slot is no longer available.',
                ]);
            }

            $previousScheduledAt = $booking->scheduled_at->copy();
            $previousTimezone = $booking->timezone;
            $previousDuration = $booking->duration;
            $previousStatus = $booking->status;

            $booking->scheduled_at = $rescheduleRequest->requested_scheduled_at;
            $booking->timezone = $rescheduleRequest->requested_timezone;
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
            $booking->recordHistory('rescheduled', sprintf(
                'Waktu schedule diubah oleh %s dari %s menjadi %s.',
                $request->user()->name,
                $this->formatHistoryScheduleTime($previousScheduledAt, $this->dateTimes->timezoneFor($request->user())),
                $this->formatHistoryScheduleTime($booking->scheduled_at, $this->dateTimes->timezoneFor($request->user())),
            ), $request->user(), [
                'duration' => [
                    'from' => $previousDuration,
                    'to' => $booking->duration,
                ],
                'scheduled_at' => [
                    'from' => $previousScheduledAt->toDateTimeString(),
                    'to' => $booking->scheduled_at->toDateTimeString(),
                ],
                'status' => [
                    'from' => $previousStatus,
                    'to' => $booking->status,
                ],
                'timezone' => [
                    'from' => $previousTimezone,
                    'to' => $booking->timezone,
                ],
            ], $request->ip());

            $rescheduleRequest->update([
                'reviewed_at' => now(),
                'reviewed_by' => $request->user()->id,
                'status' => 'approved',
            ]);

            $mentor = $booking->mentor;
            $student = $booking->user;
            $scheduleCode = $booking->code ?? "Schedule #{$booking->id}";

            DB::afterCommit(function () use ($mentor, $student, $scheduleCode, $booking): void {
                $mentor?->notify(new ScheduleNotification(
                    event: NotificationEvent::RescheduleApproved,
                    title: 'Reschedule approved',
                    message: "{$scheduleCode} has been rescheduled.",
                    scheduleCode: $scheduleCode,
                    url: "/schedules/{$booking->id}",
                ));
                $student?->notify(new ScheduleNotification(
                    event: NotificationEvent::RescheduleApproved,
                    title: 'Perubahan jadwal disetujui',
                    message: "{$scheduleCode} telah dijadwalkan ulang.",
                    scheduleCode: $scheduleCode,
                    url: '/schedules',
                ));
            });
        });

        return back()->with('success', 'Reschedule request approved.');
    }

    public function reject(Request $request, RescheduleRequest $rescheduleRequest): RedirectResponse
    {
        $validated = $request->validate([
            'admin_note' => ['required', 'string', 'max:1000'],
        ]);

        DB::transaction(function () use ($request, $rescheduleRequest, $validated): void {
            $rescheduleRequest = RescheduleRequest::query()
                ->with(['schedule.mentor:id,name', 'schedule.user:id,name'])
                ->whereKey($rescheduleRequest->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($rescheduleRequest->status !== 'pending') {
                return;
            }

            $rescheduleRequest->update([
                'admin_note' => $validated['admin_note'] ?? null,
                'reviewed_at' => now(),
                'reviewed_by' => $request->user()->id,
                'status' => 'rejected',
            ]);
            $rescheduleRequest->schedule?->recordHistory('reschedule_rejected', "Reschedule ditolak oleh {$request->user()->name}.", $request->user(), [
                'admin_note' => $validated['admin_note'] ?? null,
                'requested_scheduled_at' => $rescheduleRequest->requested_scheduled_at->toDateTimeString(),
            ], $request->ip());

            $schedule = $rescheduleRequest->schedule;

            if (! $schedule) {
                return;
            }

            $mentor = $schedule->mentor;
            $student = $schedule->user;
            $scheduleCode = $schedule->code ?? "Schedule #{$schedule->id}";
            $rejectionReason = $rescheduleRequest->admin_note;

            DB::afterCommit(function () use ($mentor, $student, $scheduleCode, $rejectionReason, $schedule): void {
                $mentor?->notify(new ScheduleNotification(
                    event: NotificationEvent::RescheduleRejected,
                    title: 'Reschedule rejected',
                    message: "The reschedule request for {$scheduleCode} was rejected. The original schedule remains unchanged.",
                    scheduleCode: $scheduleCode,
                    url: "/schedules/{$schedule->id}",
                ));
                $student?->notify(new ScheduleNotification(
                    event: NotificationEvent::RescheduleRejected,
                    title: 'Perubahan jadwal ditolak',
                    message: "Permintaan perubahan {$scheduleCode} ditolak. Alasan: {$rejectionReason}",
                    scheduleCode: $scheduleCode,
                    url: '/schedules',
                ));
            });
        });

        return back()->with('success', 'Reschedule request rejected.');
    }

    private function requestData(RescheduleRequest $request): array
    {
        $currentEndAt = $request->current_scheduled_at->copy()->addMinutes($request->duration);
        $requestedEndAt = $request->requested_scheduled_at->copy()->addMinutes($request->duration);

        return [
            'adminNote' => $request->admin_note,
            'currentEndAt' => $currentEndAt->toJSON(),
            'currentStartAt' => $request->current_scheduled_at->toJSON(),
            'id' => (string) $request->id,
            'mentor' => $request->mentor?->name ?? 'Unassigned mentor',
            'notes' => $request->notes,
            'program' => $request->schedule?->enrollment?->program?->name ?? '-',
            'reason' => $request->reason,
            'requestedEndAt' => $requestedEndAt->toJSON(),
            'requestedStartAt' => $request->requested_scheduled_at->toJSON(),
            'reviewedAt' => $request->reviewed_at?->toJSON(),
            'reviewer' => $request->reviewer?->name,
            'scheduleCode' => $request->schedule?->code ?? "Request #{$request->id}",
            'session' => $request->schedule?->subject?->name ?? 'Session',
            'status' => Str::headline($request->status),
            'student' => $request->user?->name ?? '-',
        ];
    }

    private function formatHistoryScheduleTime(CarbonInterface $date, string $timezone): string
    {
        $localDate = $this->dateTimes->toLocal($date, $timezone)->locale('id');

        return $localDate->translatedFormat('d M Y, H:i').' '.$localDate->format('T');
    }
}
