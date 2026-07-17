<?php

namespace App\Http\Controllers\Concerns;

use App\Models\Schedule;
use Carbon\CarbonImmutable;
use Illuminate\Support\Str;

trait FormatsScheduleSessions
{
    private function sessionData(Schedule $schedule, bool $includeStudent = false): array
    {
        $startAt = $schedule->scheduled_at;
        $endAt = $schedule->scheduled_at->copy()->addMinutes($schedule->duration);

        $data = [
            'id' => (string) $schedule->id,
            'endAt' => $endAt->toJSON(),
            'mentor' => $schedule->mentor?->name ?? 'Unassigned mentor',
            'program' => $schedule->enrollment?->program?->name ?? '-',
            'startAt' => $startAt->toJSON(),
            'status' => Str::headline($schedule->status),
            'subjectIcon' => $schedule->subject?->icon,
            'time' => "{$startAt->format('D, M j, H:i')} - {$endAt->format('H:i')}",
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
                'requested' => "{$requestedAt->format('D, M j, H:i')} - {$requestedEndAt->format('H:i')}",
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
            $data['rescheduleSlots'] = $this->rescheduleSlots($schedule);
        }

        return $data;
    }

    private function rescheduleSlots(Schedule $schedule): array
    {
        if (! $schedule->mentor_id || $schedule->scheduled_at->isPast() || $schedule->pendingRescheduleRequest) {
            return [];
        }

        $slots = [];
        $cursor = $this->nextHalfHour(CarbonImmutable::now()->addHour());
        $lastDay = CarbonImmutable::now()->addDays(14)->endOfDay();

        while ($cursor->lessThanOrEqualTo($lastDay) && count($slots) < 18) {
            if ($cursor->hour >= 8 && $cursor->hour < 20 && $this->mentorAvailableAt($schedule, $cursor)) {
                $endAt = $cursor->addMinutes($schedule->duration);

                $slots[] = [
                    'label' => "{$cursor->format('D, M j, H:i')} - {$endAt->format('H:i')}",
                    'value' => $cursor->format('Y-m-d H:i:s'),
                ];
            }

            $cursor = $cursor->addMinutes(30);
        }

        return $slots;
    }

    private function mentorAvailableAt(Schedule $schedule, CarbonImmutable $startAt): bool
    {
        $endAt = $startAt->addMinutes($schedule->duration);

        if ($startAt->equalTo(CarbonImmutable::instance($schedule->scheduled_at))) {
            return false;
        }

        return ! Schedule::query()
            ->where('mentor_id', $schedule->mentor_id)
            ->whereKeyNot($schedule->id)
            ->where('scheduled_at', '<', $endAt)
            ->get(['id', 'scheduled_at', 'duration'])
            ->contains(fn (Schedule $mentorSchedule): bool => $mentorSchedule->scheduled_at->copy()->addMinutes($mentorSchedule->duration)->greaterThan($startAt));
    }

    private function nextHalfHour(CarbonImmutable $date): CarbonImmutable
    {
        $minute = $date->minute;
        $roundedMinute = (int) (ceil($minute / 30) * 30);

        if ($roundedMinute >= 60) {
            $nextHour = $date->addHour();

            return $nextHour->setTime($nextHour->hour, 0, 0);
        }

        return $date->setTime($date->hour, $roundedMinute, 0);
    }
}
