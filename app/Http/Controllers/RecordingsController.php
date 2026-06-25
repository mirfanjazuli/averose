<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreManualRecordingRequest;
use App\Models\SessionBooking;
use App\Models\SessionRecording;
use App\UserRole;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class RecordingsController extends Controller
{
    public function index(Request $request): Response
    {
        return match ($request->user()->role) {
            UserRole::Admin => Inertia::render('admin/monitoring/recordings', [
                'recordings' => $this->recordings(),
                'sessionOptions' => $this->sessionOptions(),
            ]),
            UserRole::Student => Inertia::render('student/recordings', [
                'recordings' => $this->recordings($request->user()->id),
            ]),
            default => abort(403),
        };
    }

    public function store(StoreManualRecordingRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $booking = SessionBooking::query()
            ->with(['subject:id,name', 'zoomAccount:id'])
            ->findOrFail($validated['session_booking_id']);

        if (! $booking->zoom_account_id) {
            return back()->withErrors([
                'session_booking_id' => 'The selected session does not have a Zoom account.',
            ]);
        }

        $videoId = $request->youtubeVideoId();

        SessionRecording::query()->updateOrCreate(
            ['youtube_video_id' => $videoId],
            [
                'metadata' => ['source' => 'manual'],
                'recorded_at' => $validated['recorded_at'] ?? $booking->scheduled_at,
                'session_booking_id' => $booking->id,
                'title' => $validated['title'] ?: ($booking->subject?->name ?? 'Session recording'),
                'user_id' => $booking->user_id,
                'youtube_url' => $validated['youtube_url'],
                'zoom_account_id' => $booking->zoom_account_id,
                'zoom_meeting_id' => $booking->zoom_meeting_id ?? "manual-{$booking->id}",
                'zoom_meeting_uuid' => null,
                'zoom_recording_file_id' => null,
            ],
        );

        return back()->with('success', 'Recording added.');
    }

    private function recordings(?int $studentId = null): array
    {
        return SessionRecording::query()
            ->with([
                'sessionBooking.mentor:id,name',
                'sessionBooking.subject:id,name',
                'sessionBooking.enrollment.program:id,name',
                'user:id,name',
                'zoomAccount:id,name',
            ])
            ->when($studentId, fn ($query) => $query->where('user_id', $studentId))
            ->latest('recorded_at')
            ->latest()
            ->get()
            ->map(fn (SessionRecording $recording): array => $this->recordingData($recording))
            ->all();
    }

    private function sessionOptions(): array
    {
        return SessionBooking::query()
            ->with(['mentor:id,name', 'subject:id,name', 'user:id,name', 'zoomAccount:id,name'])
            ->whereNotNull('zoom_account_id')
            ->latest('scheduled_at')
            ->limit(100)
            ->get()
            ->map(function (SessionBooking $booking): array {
                return [
                    'id' => (string) $booking->id,
                    'label' => sprintf(
                        '%s - %s - %s',
                        $booking->scheduled_at->format('M d, H:i'),
                        $booking->user?->name ?? 'Student',
                        $booking->subject?->name ?? 'Session',
                    ),
                    'meetingId' => $booking->zoom_meeting_id,
                    'student' => $booking->user?->name ?? '-',
                    'zoomAccount' => $booking->zoomAccount?->name ?? '-',
                ];
            })
            ->all();
    }

    private function recordingData(SessionRecording $recording): array
    {
        return [
            'id' => (string) $recording->id,
            'mentor' => $recording->sessionBooking?->mentor?->name ?? '-',
            'program' => $recording->sessionBooking?->enrollment?->program?->name ?? '-',
            'recordedAt' => $recording->recorded_at?->toJSON(),
            'recordedDate' => $recording->recorded_at?->format('M d, Y') ?? '-',
            'source' => Str::headline((string) data_get($recording->metadata, 'source', 'n8n')),
            'student' => $recording->user?->name ?? '-',
            'subject' => $recording->sessionBooking?->subject?->name ?? 'Session',
            'title' => $recording->title,
            'youtubeEmbedUrl' => "https://www.youtube-nocookie.com/embed/{$recording->youtube_video_id}",
            'youtubeUrl' => $recording->youtube_url,
            'zoomAccount' => $recording->zoomAccount?->name ?? '-',
            'zoomMeetingId' => $recording->zoom_meeting_id,
        ];
    }
}
