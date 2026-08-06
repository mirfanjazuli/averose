<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Concerns\FormatsRecordings;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreManualRecordingRequest;
use App\Models\Recording;
use App\Models\Schedule;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class RecordingController extends Controller
{
    use FormatsRecordings;

    public function index(): Response
    {
        return Inertia::render('admin/monitoring/recordings/index', [
            'recordings' => $this->recordings(),
            'sessionOptions' => $this->sessionOptions(),
        ]);
    }

    public function store(StoreManualRecordingRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $schedule = Schedule::query()
            ->with(['subject:id,name', 'zoomAccount:id'])
            ->findOrFail($validated['schedule_id']);

        if (! $schedule->zoom_account_id) {
            return back()->withErrors([
                'schedule_id' => 'The selected session does not have a Zoom account.',
            ]);
        }

        $videoId = $request->youtubeVideoId();

        Recording::query()->updateOrCreate(
            ['youtube_video_id' => $videoId],
            [
                'metadata' => ['source' => 'manual'],
                'recorded_at' => $validated['recorded_at'] ?? $schedule->scheduled_at,
                'schedule_id' => $schedule->id,
                'status' => 'active',
                'title' => $validated['title'] ?: ($schedule->subject?->name ?? 'Session recording'),
                'user_id' => $schedule->user_id,
                'youtube_url' => $validated['youtube_url'],
                'zoom_account_id' => $schedule->zoom_account_id,
                'zoom_meeting_id' => $schedule->zoom_meeting_id ?? "manual-{$schedule->id}",
                'zoom_meeting_uuid' => null,
                'zoom_recording_file_id' => null,
            ],
        );

        return back()->with('success', 'Recording added.');
    }

    public function destroy(Recording $recording): RedirectResponse
    {
        $recording->update(['status' => 'inactive']);

        return back()->with('success', 'Recording deactivated.');
    }

    private function recordings(): array
    {
        return Recording::query()
            ->with([
                'schedule.mentor:id,name',
                'schedule.subject:id,name',
                'schedule.enrollment.program:id,name',
                'user:id,name',
                'zoomAccount:id,name',
            ])
            ->latest('recorded_at')
            ->latest()
            ->get()
            ->map(fn (Recording $recording): array => $this->recordingData($recording))
            ->all();
    }

    private function sessionOptions(): array
    {
        return Schedule::query()
            ->with(['mentor:id,name', 'subject:id,name', 'user:id,name', 'zoomAccount:id,name'])
            ->whereNotNull('zoom_account_id')
            ->latest('scheduled_at')
            ->limit(100)
            ->get()
            ->map(function (Schedule $schedule): array {
                return [
                    'id' => (string) $schedule->id,
                    'meetingId' => $schedule->zoom_meeting_id,
                    'scheduledAt' => $schedule->scheduled_at->toJSON(),
                    'student' => $schedule->user?->name ?? '-',
                    'subject' => $schedule->subject?->name ?? 'Session',
                    'zoomAccount' => $schedule->zoomAccount?->name ?? '-',
                ];
            })
            ->all();
    }
}
