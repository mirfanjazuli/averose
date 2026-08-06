<?php

namespace App\Services\Scheduling;

use App\Models\PublicHoliday;
use App\Models\WorkingHour;
use App\Services\DateTime\UserDateTimeService;
use Carbon\CarbonInterface;

class BusinessCalendarService
{
    public function __construct(private readonly UserDateTimeService $dateTimes) {}

    public function unavailabilityReason(CarbonInterface $startAtUtc, int $duration): ?string
    {
        $timezone = config('business.timezone');
        $startAt = $this->dateTimes->toLocal($startAtUtc, $timezone);
        $endAt = $startAt->addMinutes($duration);

        if ($endAt->toDateString() !== $startAt->toDateString()) {
            return 'Jadwal harus selesai pada hari operasional yang sama.';
        }

        if (PublicHoliday::query()
            ->whereDate('date', $startAt->toDateString())
            ->where('status', 'active')
            ->exists()) {
            return 'Tanggal yang dipilih merupakan hari libur.';
        }

        $workingHour = WorkingHour::query()
            ->where('day_of_week', $startAt->dayOfWeekIso)
            ->first();

        if (! $workingHour) {
            return null;
        }

        if (! $workingHour->is_active || ! $workingHour->start_time || ! $workingHour->end_time) {
            return 'Tanggal yang dipilih berada di luar hari operasional.';
        }

        $businessStart = $startAt->setTimeFromTimeString($workingHour->start_time);
        $businessEnd = $startAt->setTimeFromTimeString($workingHour->end_time);

        if ($startAt->lessThan($businessStart) || $endAt->greaterThan($businessEnd)) {
            return sprintf(
                'Jadwal harus berada dalam jam operasional %s–%s %s.',
                $businessStart->format('H.i'),
                $businessEnd->format('H.i'),
                $businessStart->format('T'),
            );
        }

        return null;
    }
}
