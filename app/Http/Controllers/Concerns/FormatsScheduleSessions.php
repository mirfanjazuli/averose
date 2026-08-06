<?php

namespace App\Http\Controllers\Concerns;

use App\Models\Schedule;
use Illuminate\Support\Str;

trait FormatsScheduleSessions
{
    private function sessionData(Schedule $schedule, bool $includeStudent = false): array
    {
        $startAt = $schedule->scheduled_at;
        $endAt = $schedule->scheduled_at->copy()->addMinutes($schedule->duration);
        $feedback = $includeStudent ? null : $schedule->feedback;

        $data = [
            'attachments' => $schedule->relationLoaded('mentorJournal')
                && $schedule->mentorJournal?->relationLoaded('attachments')
                ? $schedule->mentorJournal->attachments->map(fn ($attachment): array => [
                    'mimeType' => $attachment->mime_type,
                    'name' => $attachment->original_name,
                    'size' => $attachment->size,
                    'url' => route('mentor-journal-attachments.show', $attachment, absolute: false),
                    'uuid' => $attachment->uuid,
                ])->values()->all()
                : [],
            'code' => $schedule->code,
            'deliveryMode' => $schedule->delivery_mode->value,
            'id' => (string) $schedule->id,
            'canGiveFeedback' => ! $includeStudent
                && $feedback === null
                && ($schedule->status === 'completed' || $endAt->isPast()),
            'endAt' => $endAt->toJSON(),
            'feedback' => $feedback ? [
                'audioQualityRating' => $feedback->audio_quality_rating,
                'comment' => $feedback->comment,
                'interactivityRating' => $feedback->interactivity_rating,
                'materialClarityRating' => $feedback->material_clarity_rating,
                'visualQualityRating' => $feedback->visual_quality_rating,
            ] : null,
            'mentor' => $schedule->mentor?->name ?? 'Unassigned mentor',
            'program' => $schedule->enrollment?->program?->name ?? '-',
            'startAt' => $startAt->toJSON(),
            'status' => Str::headline($schedule->status),
            'subjectIcon' => $schedule->subject?->icon,
            'title' => $schedule->subject?->name ?? 'Session',
            'zoomAccount' => $schedule->zoomAccount?->name,
            'zoomAccountSlug' => $schedule->zoomAccount?->slug,
            'zoomLink' => $schedule->zoom_link,
            'zoomMeetingId' => $schedule->zoom_meeting_id,
            'zoomPasscode' => $schedule->zoom_passcode,
        ];

        if ($schedule->pendingRescheduleRequest) {
            $requestedAt = $schedule->pendingRescheduleRequest->requested_scheduled_at;
            $requestedEndAt = $requestedAt->copy()->addMinutes($schedule->pendingRescheduleRequest->duration);

            $data['rescheduleRequest'] = [
                'id' => (string) $schedule->pendingRescheduleRequest->id,
                'reason' => $schedule->pendingRescheduleRequest->reason,
                'requestedEndAt' => $requestedEndAt->toJSON(),
                'requestedStartAt' => $requestedAt->toJSON(),
                'status' => Str::headline($schedule->pendingRescheduleRequest->status),
            ];
        } else {
            $data['rescheduleRequest'] = null;
        }

        if ($includeStudent) {
            $data['zoomStartUrl'] = $schedule->zoom_start_url;
            $data['student'] = $schedule->user?->name ?? '-';
        } else {
            $data['canRequestReschedule'] = $schedule->mentor_id !== null && $schedule->scheduled_at->isFuture() && ! $schedule->pendingRescheduleRequest;
        }

        return $data;
    }
}
