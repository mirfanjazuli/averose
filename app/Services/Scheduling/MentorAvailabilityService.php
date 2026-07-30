<?php

namespace App\Services\Scheduling;

use App\Models\Schedule;
use App\Models\User;
use App\UserRole;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Illuminate\Support\Collection;

class MentorAvailabilityService
{
    /**
     * @param  iterable<int>  $mentorIds
     * @return Collection<int, Schedule>
     */
    public function conflictsForMentors(
        iterable $mentorIds,
        CarbonInterface $startAt,
        int $duration,
        ?int $ignoredScheduleId = null,
    ): Collection {
        $mentorIds = collect($mentorIds)
            ->map(fn (mixed $mentorId): int => (int) $mentorId)
            ->filter()
            ->unique()
            ->values();

        if ($mentorIds->isEmpty()) {
            return collect();
        }

        $startsAt = CarbonImmutable::instance($startAt);
        $endsAt = $startsAt->addMinutes($duration);

        return Schedule::query()
            ->whereIn('mentor_id', $mentorIds)
            ->whereIn('status', ['assigned', 'rescheduled'])
            ->when($ignoredScheduleId, fn ($query) => $query->whereKeyNot($ignoredScheduleId))
            ->where('scheduled_at', '<', $endsAt)
            ->orderBy('scheduled_at')
            ->get(['id', 'code', 'mentor_id', 'scheduled_at', 'duration'])
            ->filter(fn (Schedule $schedule): bool => $schedule->scheduled_at
                ->copy()
                ->addMinutes($schedule->duration)
                ->greaterThan($startsAt))
            ->groupBy('mentor_id')
            ->map(fn (Collection $schedules): Schedule => $schedules->first());
    }

    public function findConflict(
        int $mentorId,
        CarbonInterface $startAt,
        int $duration,
        ?int $ignoredScheduleId = null,
    ): ?Schedule {
        return $this->conflictsForMentors(
            [$mentorId],
            $startAt,
            $duration,
            $ignoredScheduleId,
        )->get($mentorId);
    }

    public function lockActiveMentor(int $mentorId): ?User
    {
        return User::query()
            ->whereKey($mentorId)
            ->where('role', UserRole::Mentor)
            ->where('status', 'active')
            ->lockForUpdate()
            ->first();
    }
}
