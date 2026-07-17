<?php

namespace App\Http\Controllers\Mentor;

use App\Http\Controllers\Concerns\FormatsScheduleSessions;
use App\Http\Controllers\Controller;
use App\Models\Schedule;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ScheduleController extends Controller
{
    use FormatsScheduleSessions;

    public function index(Request $request): Response
    {
        return Inertia::render('mentor/schedules/index', [
            'sessions' => $this->sessions($request),
        ]);
    }

    private function sessions(Request $request): array
    {
        return Schedule::query()
            ->with(['pendingRescheduleRequest', 'subject:id,name,icon', 'user:id,name', 'zoomAccount:id,name,slug', 'enrollment.program:id,name'])
            ->where('mentor_id', $request->user()->id)
            ->orderBy('scheduled_at')
            ->get()
            ->map(fn (Schedule $schedule): array => $this->sessionData($schedule, includeStudent: true))
            ->all();
    }
}
