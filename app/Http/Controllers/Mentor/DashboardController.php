<?php

namespace App\Http\Controllers\Mentor;

use App\Http\Controllers\Controller;
use App\Models\MentorJournal;
use App\Models\Schedule;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        return Inertia::render('mentor/dashboard/index', [
            'nextSessions' => $this->nextSessions($request),
            'pendingJournals' => $this->pendingJournals($request),
            'recentJournals' => $this->recentJournals($request),
            'stats' => $this->stats($request),
        ]);
    }

    private function stats(Request $request): array
    {
        $mentorId = $request->user()->id;
        $todaySessions = Schedule::query()
            ->where('mentor_id', $mentorId)
            ->whereDate('scheduled_at', today())
            ->count();
        $upcomingSessions = Schedule::query()
            ->where('mentor_id', $mentorId)
            ->where('scheduled_at', '>=', now())
            ->whereIn('status', ['assigned', 'rescheduled'])
            ->count();
        $pendingJournals = Schedule::query()
            ->where('mentor_id', $mentorId)
            ->where('scheduled_at', '<=', now())
            ->whereIn('status', ['assigned', 'rescheduled'])
            ->whereDoesntHave('mentorJournal')
            ->get(['id', 'scheduled_at', 'duration'])
            ->filter(fn (Schedule $schedule): bool => $schedule->scheduled_at->copy()->addMinutes($schedule->duration)->isPast())
            ->count();

        return [
            [
                'label' => 'Today',
                'value' => (string) $todaySessions,
            ],
            [
                'label' => 'Upcoming',
                'value' => (string) $upcomingSessions,
            ],
            [
                'label' => 'Pending journals',
                'value' => (string) $pendingJournals,
            ],
        ];
    }

    private function nextSessions(Request $request): array
    {
        return Schedule::query()
            ->with(['subject:id,name', 'user:id,name', 'enrollment.program:id,name', 'zoomAccount:id,name'])
            ->where('mentor_id', $request->user()->id)
            ->where('scheduled_at', '>=', now())
            ->whereIn('status', ['assigned', 'rescheduled'])
            ->orderBy('scheduled_at')
            ->limit(2)
            ->get()
            ->values()
            ->map(fn (Schedule $booking, int $index): array => $this->sessionData(
                $booking,
                includeImprovementPlan: $index === 0,
            ))
            ->all();
    }

    private function pendingJournals(Request $request): array
    {
        return Schedule::query()
            ->with(['subject:id,name', 'user:id,name', 'enrollment.program:id,name', 'zoomAccount:id,name'])
            ->where('mentor_id', $request->user()->id)
            ->where('scheduled_at', '<=', now())
            ->whereIn('status', ['assigned', 'rescheduled'])
            ->whereDoesntHave('mentorJournal')
            ->orderBy('scheduled_at')
            ->get()
            ->filter(fn (Schedule $schedule): bool => $schedule->scheduled_at->copy()->addMinutes($schedule->duration)->isPast())
            ->take(2)
            ->values()
            ->map(function (Schedule $booking): array {
                $session = $this->sessionData($booking);
                $session['needsCompletion'] = true;

                return $session;
            })
            ->all();
    }

    private function recentJournals(Request $request): array
    {
        return MentorJournal::query()
            ->with(['schedule:id,code,scheduled_at,duration,program_enrollment_id', 'schedule.enrollment.program:id,name', 'student:id,name', 'subject:id,name'])
            ->where('mentor_id', $request->user()->id)
            ->latest()
            ->limit(5)
            ->get()
            ->map(fn (MentorJournal $journal): array => [
                'date' => $journal->schedule?->scheduled_at?->format('D, M j') ?? $journal->created_at->format('D, M j'),
                'id' => (string) $journal->id,
                'program' => $journal->schedule?->enrollment?->program?->name ?? '-',
                'slug' => $journal->routeIdentifier(),
                'student' => $journal->student?->name ?? '-',
                'title' => $journal->subject?->name ?? 'Session',
            ])
            ->all();
    }

    private function sessionData(Schedule $booking, bool $includeImprovementPlan = false): array
    {
        $startAt = $booking->scheduled_at;
        $endAt = $booking->scheduled_at->copy()->addMinutes($booking->duration);

        $data = [
            'duration' => "{$booking->duration} minutes",
            'endAt' => $endAt->toJSON(),
            'id' => (string) $booking->id,
            'program' => $booking->enrollment?->program?->name ?? '-',
            'startAt' => $startAt->toJSON(),
            'status' => Str::headline($booking->status),
            'student' => $booking->user?->name ?? '-',
            'time' => "{$startAt->format('D, M j, H:i')} - {$endAt->format('H:i')}",
            'title' => $booking->subject?->name ?? 'Session',
            'zoomAccount' => $booking->zoomAccount?->name,
            'zoomLink' => $booking->zoom_link,
        ];

        if ($includeImprovementPlan) {
            $previousSession = Schedule::query()
                ->with('mentorJournal:id,schedule_id,next_improvement_plan')
                ->where('mentor_id', $booking->mentor_id)
                ->where('user_id', $booking->user_id)
                ->where('scheduled_at', '<', $booking->scheduled_at)
                ->where('status', 'completed')
                ->whereHas('mentorJournal')
                ->latest('scheduled_at')
                ->first();

            $data['improvementPlan'] = $previousSession
                ? $previousSession->mentorJournal?->next_improvement_plan
                : 'No previous improvement plan recorded yet.';
        }

        return $data;
    }
}
