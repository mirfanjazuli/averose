<?php

namespace App\Services\DateTime;

use App\Data\UtcDateRange;
use App\Models\User;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use DateTimeInterface;
use InvalidArgumentException;

class UserDateTimeService
{
    public function timezoneFor(?User $user): string
    {
        return $user?->timezone ?: config('business.timezone');
    }

    public function fromLocal(
        string $value,
        string $timezone,
        string $format = 'Y-m-d H:i',
    ): CarbonImmutable {
        return $this->parseLocal($value, $timezone, $format)->utc();
    }

    public function toLocal(CarbonInterface|DateTimeInterface $value, string $timezone): CarbonImmutable
    {
        return CarbonImmutable::instance($value)->setTimezone($timezone);
    }

    public function utcDateRange(string $fromDate, string $toDate, string $timezone): UtcDateRange
    {
        $startInclusive = $this->parseLocal($fromDate, $timezone, 'Y-m-d')->utc();
        $endExclusive = $this->parseLocal($toDate, $timezone, 'Y-m-d')->addDay()->utc();

        if ($endExclusive->lessThanOrEqualTo($startInclusive)) {
            throw new InvalidArgumentException('The end date must be on or after the start date.');
        }

        return new UtcDateRange($startInclusive, $endExclusive);
    }

    public function toUtcIso(CarbonInterface|DateTimeInterface $value): string
    {
        return CarbonImmutable::instance($value)->utc()->format('Y-m-d\TH:i:s\Z');
    }

    private function parseLocal(string $value, string $timezone, string $format): CarbonImmutable
    {
        $date = CarbonImmutable::createFromFormat("!{$format}", $value, $timezone);

        if ($date === false || $date->format($format) !== $value) {
            throw new InvalidArgumentException('The local date and time is invalid.');
        }

        return $date;
    }
}
