<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Concerns\FormatsScheduleSessions;
use App\Http\Controllers\Controller;
use App\Models\Schedule;
use App\Models\User;
use App\UserRole;
use Inertia\Inertia;
use Inertia\Response;

class ScheduleController extends Controller
{
    use FormatsScheduleSessions;

    public function index(): Response
    {
        return Inertia::render('admin/scheduling/schedules/index', [
            'mentors' => $this->mentorOptions(),
            'sessions' => $this->sessions(),
        ]);
    }

    private function sessions(): array
    {
        return Schedule::query()
            ->with(['mentor:id,name', 'pendingRescheduleRequest', 'subject:id,name,icon', 'user:id,name', 'zoomAccount:id,name,slug', 'enrollment.program:id,name'])
            ->orderBy('scheduled_at')
            ->get()
            ->map(fn (Schedule $schedule): array => $this->sessionData($schedule, includeStudent: true))
            ->all();
    }

    private function mentorOptions(): array
    {
        return User::query()
            ->where('role', UserRole::Mentor)
            ->where('status', 'active')
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn (User $mentor): array => [
                'id' => (string) $mentor->id,
                'name' => $mentor->name,
            ])
            ->all();
    }
}
