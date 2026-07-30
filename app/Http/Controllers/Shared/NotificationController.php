<?php

namespace App\Http\Controllers\Shared;

use App\Http\Controllers\Controller;
use App\Support\NotificationFeed;
use App\UserRole;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Notifications\DatabaseNotification;
use Inertia\Inertia;
use Inertia\Response;

class NotificationController extends Controller
{
    public function index(Request $request): Response
    {
        $filter = $request->string('filter')->value() === 'unread' ? 'unread' : 'all';
        $query = $filter === 'unread'
            ? $request->user()->unreadNotifications()
            : $request->user()->notifications();

        $notifications = $query
            ->latest()
            ->paginate(10)
            ->withQueryString()
            ->through(fn (DatabaseNotification $notification): array => NotificationFeed::item($notification));
        $component = $request->user()->role === UserRole::Student
            ? 'student/notifications/index'
            : 'mentor/notifications/index';

        return Inertia::render($component, [
            'filter' => $filter,
            'notifications' => $notifications,
        ]);
    }

    public function feed(Request $request): JsonResponse
    {
        return response()->json(NotificationFeed::for($request->user()));
    }

    public function read(Request $request, string $notification): RedirectResponse
    {
        $notification = $request->user()
            ->notifications()
            ->whereKey($notification)
            ->firstOrFail();

        $notification->markAsRead();
        $target = $notification->data['url'] ?? '/notifications';

        if (! is_string($target) || ! str_starts_with($target, '/')) {
            $target = '/notifications';
        }

        return redirect($target);
    }

    public function readAll(Request $request): RedirectResponse
    {
        $request->user()->unreadNotifications()->update(['read_at' => now()]);

        return back();
    }
}
