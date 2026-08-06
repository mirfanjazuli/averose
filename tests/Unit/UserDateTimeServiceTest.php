<?php

namespace Tests\Unit;

use App\Services\DateTime\UserDateTimeService;
use Carbon\CarbonImmutable;
use PHPUnit\Framework\TestCase;

class UserDateTimeServiceTest extends TestCase
{
    private UserDateTimeService $dateTimes;

    protected function setUp(): void
    {
        parent::setUp();

        $this->dateTimes = new UserDateTimeService;
    }

    public function test_it_converts_supported_asian_timezones_to_utc(): void
    {
        $expectations = [
            'Asia/Jakarta' => '2026-07-31T02:00:00Z',
            'Asia/Makassar' => '2026-07-31T01:00:00Z',
            'Asia/Jayapura' => '2026-07-31T00:00:00Z',
            'Asia/Tokyo' => '2026-07-31T00:00:00Z',
        ];

        foreach ($expectations as $timezone => $expected) {
            $utc = $this->dateTimes->fromLocal('2026-07-31 09:00', $timezone);

            $this->assertSame($expected, $this->dateTimes->toUtcIso($utc));
        }
    }

    public function test_it_builds_a_half_open_utc_range_from_local_dates(): void
    {
        $range = $this->dateTimes->utcDateRange('2026-06-01', '2026-06-06', 'Asia/Jakarta');

        $this->assertSame('2026-05-31T17:00:00Z', $this->dateTimes->toUtcIso($range->startInclusive));
        $this->assertSame('2026-06-06T17:00:00Z', $this->dateTimes->toUtcIso($range->endExclusive));
    }

    public function test_it_formats_utc_for_a_users_local_timezone_without_mutating_source(): void
    {
        $utc = $this->dateTimes->fromLocal('2026-07-31 09:00', 'Asia/Jakarta');
        $tokyo = $this->dateTimes->toLocal($utc, 'Asia/Tokyo');

        $this->assertSame('2026-07-31 11:00', $tokyo->format('Y-m-d H:i'));
        $this->assertSame('UTC', $utc->timezoneName);
    }

    public function test_it_converts_a_utc_report_timestamp_to_the_users_timezone(): void
    {
        $utc = CarbonImmutable::parse('2026-07-31 09:40:00', 'UTC');
        $jakarta = $this->dateTimes->toLocal($utc, 'Asia/Jakarta');

        $this->assertSame('31 Jul 2026 16:40 WIB', $jakarta->format('d M Y H:i T'));
    }
}
