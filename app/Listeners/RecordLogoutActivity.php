<?php

namespace App\Listeners;

use App\Models\ActivityLog;
use App\Models\User;
use App\UserRole;
use Illuminate\Auth\Events\Logout;

class RecordLogoutActivity
{
    /**
     * Handle the event.
     */
    public function handle(Logout $event): void
    {
        if (! $event->user instanceof User) {
            return;
        }

        $request = request();

        ActivityLog::query()->create([
            'action' => 'Logout',
            'description' => "{$event->user->name} berhasil logout.",
            'ip_address' => $request->ip(),
            'method' => $request->method(),
            'path' => $request->path(),
            'properties' => null,
            'route_name' => $request->route()?->getName(),
            'status_code' => null,
            'user_agent' => $request->userAgent(),
            'user_email' => $event->user->email,
            'user_id' => $event->user->id,
            'user_name' => $event->user->name,
            'user_role' => $event->user->role instanceof UserRole ? $event->user->role->value : (string) $event->user->role,
        ]);
    }
}
