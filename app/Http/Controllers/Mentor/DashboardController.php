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
            'completionSession' => $this->completionSession($request),
            'nextSessions' => $this->nextSessions($request),
            'pendingJournals' => $this->pendingJournals($request),
            'recentJournals' => $this->recentJournals($request),
            'stats' => $this->stats($request),
            'todaySessions' => $this->todaySessions($request),
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
            ->count();
        $monthlySessions = Schedule::query()
            ->where('mentor_id', $mentorId)
            ->whereBetween('scheduled_at', [now()->startOfMonth(), now()->endOfMonth()])
            ->count();

        return [
            [
                'helper' => 'Scheduled today',
                'label' => 'Today',
                'value' => (string) $todaySessions,
            ],
            [
                'helper' => 'Assigned upcoming',
                'label' => 'Upcoming',
                'value' => (string) $upcomingSessions,
            ],
            [
                'helper' => 'Need completion',
                'label' => 'Pending journals',
                'value' => (string) $pendingJournals,
            ],
            [
                'helper' => 'This month',
                'label' => 'Monthly sessions',
                'value' => (string) $monthlySessions,
            ],
        ];
    }

    private function todaySessions(Request $request): array
    {
        return Schedule::query()
            ->with(['subject:id,name', 'user:id,name', 'enrollment.program:id,name', 'zoomAccount:id,name'])
            ->where('mentor_id', $request->user()->id)
            ->whereDate('scheduled_at', today())
            ->orderBy('scheduled_at')
            ->get()
            ->map(fn (Schedule $booking): array => $this->sessionData($booking))
            ->all();
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
            ->map(fn (Schedule $booking): array => $this->sessionData($booking))
            ->all();
    }

    private function completionSession(Request $request): ?array
    {
        $booking = Schedule::query()
            ->with(['subject:id,name', 'user:id,name', 'enrollment.program:id,name', 'zoomAccount:id,name'])
            ->where('mentor_id', $request->user()->id)
            ->where('scheduled_at', '<=', now())
            ->whereIn('status', ['assigned', 'rescheduled'])
            ->whereDoesntHave('mentorJournal')
            ->orderByDesc('scheduled_at')
            ->first();

        if (! $booking) {
            return null;
        }

        $session = $this->sessionData($booking);
        $session['needsCompletion'] = true;

        return $session;
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
            ->limit(2)
            ->get()
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
            ->with(['schedule:id,scheduled_at,duration,program_enrollment_id', 'schedule.enrollment.program:id,name', 'student:id,name', 'subject:id,name'])
            ->where('mentor_id', $request->user()->id)
            ->latest()
            ->limit(5)
            ->get()
            ->map(fn (MentorJournal $journal): array => [
                'date' => $journal->schedule?->scheduled_at?->format('D, M j') ?? $journal->created_at->format('D, M j'),
                'id' => (string) $journal->id,
                'improvementPlan' => $journal->next_improvement_plan,
                'note' => Str::headline($journal->note),
                'program' => $journal->schedule?->enrollment?->program?->name ?? '-',
                'slug' => $journal->slug,
                'student' => $journal->student?->name ?? '-',
                'title' => $journal->subject?->name ?? 'Session',
            ])
            ->all();
    }

    private function sessionData(Schedule $booking): array
    {
        $startAt = $booking->scheduled_at;
        $endAt = $booking->scheduled_at->copy()->addMinutes($booking->duration);
        $previousSession = Schedule::query()
            ->with('mentorJournal:id,schedule_id,next_improvement_plan')
            ->where('mentor_id', $booking->mentor_id)
            ->where('user_id', $booking->user_id)
            ->where('scheduled_at', '<', $booking->scheduled_at)
            ->where('status', 'completed')
            ->whereHas('mentorJournal')
            ->latest('scheduled_at')
            ->first();

        return [
            'duration' => "{$booking->duration} minutes",
            'endAt' => $endAt->toJSON(),
            'id' => (string) $booking->id,
            'improvementPlan' => $previousSession
                ? $previousSession->mentorJournal?->next_improvement_plan
                : 'No previous improvement plan recorded yet.',
            'program' => $booking->enrollment?->program?->name ?? '-',
            'startAt' => $startAt->toJSON(),
            'status' => Str::headline($booking->status),
            'student' => $booking->user?->name ?? '-',
            'time' => "{$startAt->format('D, M j, H:i')} - {$endAt->format('H:i')}",
            'title' => $booking->subject?->name ?? 'Session',
            'zoomAccount' => $booking->zoomAccount?->name,
            'zoomLink' => $booking->zoom_link,
        ];
    }
}
