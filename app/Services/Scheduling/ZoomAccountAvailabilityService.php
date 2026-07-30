<?php

namespace App\Services\Scheduling;

use App\Models\Schedule;
use App\Models\ZoomAccount;

class ZoomAccountAvailabilityService
{
    public function findFor(Schedule $schedule): ?ZoomAccount
    {
        $startAt = $schedule->scheduled_at;
        $endAt = $schedule->scheduled_at->copy()->addMinutes($schedule->duration);

        return ZoomAccount::query()
            ->where('status', 'active')
            ->orderBy('name')
            ->get()
            ->first(function (ZoomAccount $account) use ($schedule, $startAt, $endAt): bool {
                $overlappingMeetings = Schedule::query()
                    ->where('zoom_account_id', $account->id)
                    ->whereKeyNot($schedule->id)
                    ->whereNotNull('zoom_link')
                    ->where('scheduled_at', '<', $endAt)
                    ->get(['id', 'scheduled_at', 'duration'])
                    ->filter(fn (Schedule $assignedSchedule): bool => $assignedSchedule->scheduled_at
                        ->copy()
                        ->addMinutes($assignedSchedule->duration)
                        ->greaterThan($startAt))
                    ->count();

                return $overlappingMeetings < 2;
            });
    }
}
