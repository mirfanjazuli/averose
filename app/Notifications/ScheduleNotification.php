<?php

namespace App\Notifications;

use Illuminate\Notifications\Notification;

class ScheduleNotification extends Notification
{
    public function __construct(
        public string $event,
        public string $title,
        public string $message,
        public string $scheduleCode,
        public string $url,
    ) {}

    /** @return array<int, string> */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /** @return array<string, mixed> */
    public function toArray(object $notifiable): array
    {
        return [
            'event' => $this->event,
            'message' => $this->message,
            'occurred_at' => now()->toJSON(),
            'schedule_code' => $this->scheduleCode,
            'title' => $this->title,
            'url' => $this->url,
        ];
    }
}
