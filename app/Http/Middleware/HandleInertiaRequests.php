<?php

namespace App\Http\Middleware;

use App\Models\RescheduleRequest;
use App\Models\Schedule;
use App\Support\NotificationFeed;
use App\Support\PermissionRegistry;
use App\UserRole;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),

            'name' => config('app.name'),

            'auth' => [
                'user' => $request->user()
                    ? [
                        'id' => $request->user()->id,
                        'name' => $request->user()->name,
                        'nickname' => $request->user()->nickname,
                        'email' => $request->user()->email,
                        'permissions' => $this->permissions($request),
                        'role' => $request->user()->role->value,
                        'roleName' => $request->user()->internalRole?->name,
                    ]
                    : null,
            ],

            'flash' => [
                'success' => $request->session()->get('success'),
                'tryOutImportPreview' => $request->session()->get('tryOutImportPreview'),
                'tryOutResult' => $request->session()->get('tryOutResult'),
            ],

            'navigation' => [
                'pendingSchedules' => $request->user()?->role === UserRole::Admin
                    && $request->user()?->hasPermission('schedules.view')
                    ? Schedule::query()->where('status', 'pending')->count()
                    : 0,
                'pendingRescheduleRequests' => $request->user()?->role === UserRole::Admin
                    && $request->user()?->hasPermission('schedules.view')
                    ? RescheduleRequest::query()->where('status', 'pending')->count()
                    : 0,
            ],

            'notificationFeed' => fn (): array => in_array(
                $request->user()?->role,
                [UserRole::Mentor, UserRole::Student],
                true,
            )
                ? NotificationFeed::for($request->user())
                : ['items' => [], 'unreadCount' => 0],

            'sidebarOpen' => ! $request->hasCookie('sidebar_state')
                || $request->cookie('sidebar_state') === 'true',
        ];
    }

    /**
     * @return list<string>
     */
    private function permissions(Request $request): array
    {
        $user = $request->user();

        if (! $user || ! $user->isAdmin()) {
            return [];
        }

        if ($user->isSuperAdmin()) {
            return PermissionRegistry::keys();
        }

        $user->loadMissing('internalRole.permissions');

        if ($user->internalRole?->status !== 'active') {
            return [];
        }

        return $user->internalRole
            ->permissions
            ->pluck('key')
            ->values()
            ->all();
    }
}
