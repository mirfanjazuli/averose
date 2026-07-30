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
            'serverNow' => now()->toJSON(),
            'sessions' => $this->sessions($request),
        ]);
    }

    public function show(Request $request, Schedule $schedule): Response
    {
        abort_unless($schedule->mentor_id === $request->user()->id, 404);

        $schedule->load([
            'enrollment.program:id,name',
            'feedback',
            'histories' => fn ($query) => $query->latest(),
            'mentorJournal.schedule:id,code',
            'pendingRescheduleRequest',
            'subject:id,name',
            'user:id,name',
            'zoomAccount:id,name',
        ]);

        $endAt = $schedule->scheduled_at->copy()->addMinutes($schedule->duration);
        $creationHistory = $schedule->histories->firstWhere('action', 'created');

        return Inertia::render('mentor/schedules/show', [
            'breadcrumbs' => [
                [
                    'title' => 'Schedules',
                    'href' => '/schedules',
                ],
                [
                    'title' => $schedule->code,
                    'href' => "/schedules/{$schedule->id}",
                ],
            ],
            'schedule' => [
                'code' => $schedule->code,
                'createdVia' => match ($creationHistory?->user_role) {
                    'student' => 'Student booking',
                    'admin' => 'Created by admin',
                    default => '-',
                },
                'deliveryMode' => $schedule->delivery_mode->value,
                'duration' => $schedule->duration,
                'endAt' => $endAt->toJSON(),
                'feedback' => $schedule->feedback ? [
                    'audioQualityRating' => $schedule->feedback->audio_quality_rating,
                    'comment' => $schedule->feedback->comment,
                    'interactivityRating' => $schedule->feedback->interactivity_rating,
                    'materialClarityRating' => $schedule->feedback->material_clarity_rating,
                    'visualQualityRating' => $schedule->feedback->visual_quality_rating,
                ] : null,
                'histories' => $schedule->histories
                    ->map(fn ($history): array => [
                        'action' => $history->action,
                        'createdAt' => $history->created_at->toJSON(),
                        'description' => $history->description,
                        'id' => (string) $history->id,
                    ])
                    ->all(),
                'id' => (string) $schedule->id,
                'journal' => $schedule->mentorJournal ? [
                    'completedAt' => $schedule->mentorJournal->created_at->toJSON(),
                    'slug' => $schedule->mentorJournal->routeIdentifier(),
                ] : null,
                'pendingRescheduleRequest' => $schedule->pendingRescheduleRequest ? [
                    'reason' => $schedule->pendingRescheduleRequest->reason,
                    'requestedAt' => $schedule->pendingRescheduleRequest->requested_scheduled_at->toJSON(),
                    'status' => $schedule->pendingRescheduleRequest->status,
                ] : null,
                'program' => $schedule->enrollment?->program?->name ?? '-',
                'startAt' => $schedule->scheduled_at->toJSON(),
                'status' => $schedule->status,
                'student' => $schedule->user?->name ?? '-',
                'subject' => $schedule->subject?->name ?? '-',
                'zoomAccount' => $schedule->zoomAccount?->name,
                'zoomLink' => $schedule->zoom_link,
                'zoomMeetingId' => $schedule->zoom_meeting_id,
            ],
        ]);
    }

    private function sessions(Request $request): array
    {
        return Schedule::query()
            ->with(['mentorJournal:id,schedule_id', 'pendingRescheduleRequest', 'subject:id,name,icon', 'user:id,name', 'zoomAccount:id,name,slug', 'enrollment.program:id,name'])
            ->where('mentor_id', $request->user()->id)
            ->orderBy('scheduled_at')
            ->get()
            ->map(function (Schedule $schedule): array {
                return [
                    ...$this->sessionData($schedule, includeStudent: true),
                    'hasJournal' => $schedule->mentorJournal !== null,
                ];
            })
            ->all();
    }
}
