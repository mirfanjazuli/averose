<?php

namespace App\Services\Zoom;

class ZoomMeetingData
{
    public function __construct(
        public string $joinUrl,
        public ?string $meetingId = null,
        public ?string $passcode = null,
        public ?string $startUrl = null,
    ) {}
}
