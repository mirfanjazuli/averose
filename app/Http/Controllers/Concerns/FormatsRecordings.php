<?php

namespace App\Http\Controllers\Concerns;

use App\Models\Recording;
use Illuminate\Support\Str;

trait FormatsRecordings
{
    private function recordingData(Recording $recording): array
    {
        return [
            'id' => (string) $recording->id,
            'mentor' => $recording->schedule?->mentor?->name ?? '-',
            'program' => $recording->schedule?->enrollment?->program?->name ?? '-',
            'recordedAt' => $recording->recorded_at?->toJSON(),
            'source' => Str::headline((string) data_get($recording->metadata, 'source', 'n8n')),
            'status' => Str::headline($recording->status),
            'student' => $recording->user?->name ?? '-',
            'subject' => $recording->schedule?->subject?->name ?? 'Session',
            'title' => $recording->title,
            'youtubeEmbedUrl' => "https://www.youtube-nocookie.com/embed/{$recording->youtube_video_id}",
            'youtubeUrl' => $recording->youtube_url,
            'zoomAccount' => $recording->zoomAccount?->name ?? '-',
            'zoomMeetingId' => $recording->zoom_meeting_id,
        ];
    }
}
