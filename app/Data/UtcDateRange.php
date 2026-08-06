<?php

namespace App\Data;

use Carbon\CarbonImmutable;

class UtcDateRange
{
    public function __construct(
        public readonly CarbonImmutable $startInclusive,
        public readonly CarbonImmutable $endExclusive,
    ) {}
}
