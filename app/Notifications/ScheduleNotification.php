<?php

namespace App\Notifications;

use App\NotificationEvent;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;

class ScheduleNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public NotificationEvent $event,
        public string $title,
        public string $message,
        public string $scheduleCode,
        public string $url,
    ) {
        $this->afterCommit();
        $this->onQueue('notifications');
    }

    /** @return array<int, string> */
    public function via(object $notifiable): array
    {
        return ['database', 'broadcast'];
    }

    /** @return array<string, string> */
    public function viaConnections(): array
    {
        return [
            'broadcast' => config('queue.default'),
            'database' => 'sync',
        ];
    }

    /** @return array<string, string> */
    public function viaQueues(): array
    {
        return [
            'broadcast' => 'notifications',
        ];
    }

    /** @return array<string, mixed> */
    public function toArray(object $notifiable): array
    {
        return [
            'event' => $this->event->value,
            'message' => $this->message,
            'occurred_at' => now()->toJSON(),
            'schedule_code' => $this->scheduleCode,
            'title' => $this->title,
            'url' => $this->url,
            'version' => 1,
        ];
    }

    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return new BroadcastMessage($this->toArray($notifiable));
    }

    public function broadcastType(): string
    {
        return $this->event->value;
    }
}
