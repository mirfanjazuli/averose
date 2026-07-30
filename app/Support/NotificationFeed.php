<?php

namespace App\Support;

use App\Models\User;
use Illuminate\Notifications\DatabaseNotification;

class NotificationFeed
{
    /** @return array{items: list<array<string, mixed>>, unreadCount: int} */
    public static function for(User $user): array
    {
        return [
            'items' => $user->notifications()
                ->latest()
                ->limit(5)
                ->get()
                ->map(fn (DatabaseNotification $notification): array => self::item($notification))
                ->all(),
            'unreadCount' => $user->unreadNotifications()->count(),
        ];
    }

    /** @return array<string, mixed> */
    public static function item(DatabaseNotification $notification): array
    {
        return [
            'createdAt' => $notification->created_at?->toJSON(),
            'event' => $notification->data['event'] ?? 'schedule_updated',
            'id' => $notification->id,
            'isRead' => $notification->read_at !== null,
            'message' => $notification->data['message'] ?? '',
            'scheduleCode' => $notification->data['schedule_code'] ?? null,
            'title' => $notification->data['title'] ?? 'Schedule update',
            'url' => $notification->data['url'] ?? '/notifications',
        ];
    }
}
