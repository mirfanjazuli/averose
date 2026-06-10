<?php

namespace App\Http\Controllers;

use App\Models\ProgramEnrollment;
use App\Models\SessionBooking;
use App\Models\User;
use App\UserRole;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request): Response
    {
        return match ($request->user()->role) {
            UserRole::Admin => Inertia::render('admin/dashboard', [
                'activities' => $this->adminActivities(),
                'programProgress' => $this->adminProgramProgress(),
                'stats' => $this->adminStats(),
                'todaySessions' => $this->adminTodaySessions(),
                'userComposition' => $this->adminUserComposition(),
            ]),
            UserRole::Mentor => Inertia::render('mentor/dashboard', [
                'completionSession' => $this->mentorCompletionSession($request),
                'focusItems' => $this->mentorFocusItems($request),
                'nextSession' => $this->mentorNextSession($request),
                'stats' => $this->mentorStats($request),
                'todaySessions' => $this->mentorTodaySessions($request),
            ]),
            UserRole::Student => Inertia::render('student/dashboard', [
                'sessions' => $this->studentSessions($request, 5),
                'stats' => $this->studentStats($request),
                'subjects' => $this->studentSubjectOptions($request),
            ]),
        };
    }

    private function adminStats(): array
    {
        $todayBookings = SessionBooking::query()
            ->whereDate('scheduled_at', today())
            ->count();

        return [
            [
                'href' => '/users/students',
                'label' => 'Students',
                'trend' => User::query()->where('role', UserRole::Student)->where('created_at', '>=', now()->startOfMonth())->count().' this month',
                'value' => (string) User::query()->where('role', UserRole::Student)->count(),
            ],
            [
                'href' => '/users/mentors',
                'label' => 'Mentors',
                'trend' => User::query()->where('role', UserRole::Mentor)->where('status', 'active')->count().' active',
                'value' => (string) User::query()->where('role', UserRole::Mentor)->count(),
            ],
            [
                'href' => '/scheduling/schedules',
                'label' => 'Schedules',
                'trend' => $todayBookings.' today',
                'value' => (string) SessionBooking::query()->count(),
            ],
        ];
    }

    private function adminTodaySessions(): array
    {
        return SessionBooking::query()
            ->with(['subject:id,name', 'user:id,name'])
            ->whereDate('scheduled_at', today())
            ->orderBy('scheduled_at')
            ->limit(5)
            ->get()
            ->map(function (SessionBooking $booking): array {
                $endAt = $booking->scheduled_at->copy()->addMinutes($booking->duration);

                return [
                    'id' => (string) $booking->id,
                    'student' => $booking->user?->name ?? '-',
                    'time' => "{$booking->scheduled_at->format('H:i')} - {$endAt->format('H:i')}",
                    'title' => $booking->subject?->name ?? 'Session',
                    'type' => Str::headline($booking->status),
                ];
            })
            ->all();
    }

    private function adminProgramProgress(): array
    {
        $enrollments = ProgramEnrollment::query()
            ->with('program:id,name')
            ->get()
            ->groupBy('program_id');

        return $enrollments
            ->map(function (Collection $programEnrollments): array {
                $firstEnrollment = $programEnrollments->first();
                $activeCount = $programEnrollments->where('status', 'active')->count();
                $totalCount = max(1, $programEnrollments->count());

                return [
                    'label' => $firstEnrollment?->program?->name ?? 'Program',
                    'value' => (int) round(($activeCount / $totalCount) * 100),
                ];
            })
            ->sortByDesc('value')
            ->take(5)
            ->values()
            ->all();
    }

    private function adminUserComposition(): array
    {
        $totalUsers = User::query()->whereIn('role', [UserRole::Student, UserRole::Mentor])->count();
        $verifiedUsers = User::query()
            ->whereIn('role', [UserRole::Student, UserRole::Mentor])
            ->whereNotNull('email_verified_at')
            ->count();

        return [
            'activeAccounts' => User::query()->whereIn('role', [UserRole::Student, UserRole::Mentor])->where('status', 'active')->count(),
            'verifiedProfiles' => $totalUsers > 0 ? (int) round(($verifiedUsers / $totalUsers) * 100) : 0,
        ];
    }

    private function adminActivities(): array
    {
        $bookings = SessionBooking::query()
            ->with(['subject:id,name', 'user:id,name'])
            ->latest()
            ->limit(5)
            ->get()
            ->map(fn (SessionBooking $booking): string => "{$booking->user?->name} booked {$booking->subject?->name} for {$booking->scheduled_at->format('M j, H:i')}.");

        if ($bookings->isNotEmpty()) {
            return $bookings->all();
        }

        return User::query()
            ->whereIn('role', [UserRole::Student, UserRole::Mentor])
            ->latest()
            ->limit(5)
            ->get(['name', 'role'])
            ->map(fn (User $user): string => "{$user->name} joined as {$user->role->value}.")
            ->all();
    }

    private function mentorStats(Request $request): array
    {
        $mentorId = $request->user()->id;
        $todaySessions = SessionBooking::query()
            ->where('mentor_id', $mentorId)
            ->whereDate('scheduled_at', today())
            ->count();
        $completedToday = SessionBooking::query()
            ->where('mentor_id', $mentorId)
            ->whereDate('scheduled_at', today())
            ->where('status', 'completed')
            ->count();
        $assignedStudents = SessionBooking::query()
            ->where('mentor_id', $mentorId)
            ->distinct('user_id')
            ->count('user_id');

        return [
            [
                'helper' => "{$completedToday} completed",
                'label' => 'Sessions today',
                'value' => (string) $todaySessions,
            ],
            [
                'helper' => 'Assigned from bookings',
                'label' => 'Assigned students',
                'value' => (string) $assignedStudents,
            ],
            [
                'helper' => 'Completed sessions',
                'label' => 'Teaching journal',
                'value' => (string) $request->user()
                    ->mentorJournals()
                    ->count(),
            ],
        ];
    }

    private function mentorTodaySessions(Request $request): array
    {
        return SessionBooking::query()
            ->with(['subject:id,name', 'user:id,name', 'enrollment.program:id,name', 'zoomAccount:id,name'])
            ->where('mentor_id', $request->user()->id)
            ->whereDate('scheduled_at', today())
            ->orderBy('scheduled_at')
            ->get()
            ->map(fn (SessionBooking $booking): array => $this->mentorSessionData($booking))
            ->all();
    }

    private function mentorNextSession(Request $request): ?array
    {
        $booking = SessionBooking::query()
            ->with(['subject:id,name', 'user:id,name', 'enrollment.program:id,name', 'zoomAccount:id,name'])
            ->where('mentor_id', $request->user()->id)
            ->where('scheduled_at', '>=', now())
            ->whereIn('status', ['assigned', 'rescheduled'])
            ->orderBy('scheduled_at')
            ->first();

        return $booking ? $this->mentorSessionData($booking) : null;
    }

    private function mentorCompletionSession(Request $request): ?array
    {
        $booking = SessionBooking::query()
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

        $session = $this->mentorSessionData($booking);
        $session['needsCompletion'] = true;

        return $session;
    }

    private function mentorFocusItems(Request $request): array
    {
        $upcomingCount = SessionBooking::query()
            ->where('mentor_id', $request->user()->id)
            ->where('scheduled_at', '>=', now())
            ->whereIn('status', ['assigned', 'rescheduled'])
            ->count();
        $completedThisWeek = SessionBooking::query()
            ->where('mentor_id', $request->user()->id)
            ->where('scheduled_at', '>=', now()->startOfWeek())
            ->where('status', 'completed')
            ->count();

        return [
            "Prepare notes for {$upcomingCount} upcoming sessions.",
            "Review {$completedThisWeek} completed sessions from this week.",
            'Keep Zoom room links ready before session time.',
        ];
    }

    private function studentSessions(Request $request, int $limit): array
    {
        return SessionBooking::query()
            ->with(['mentor:id,name', 'subject:id,name', 'zoomAccount:id,name', 'enrollment.program:id,name'])
            ->where('user_id', $request->user()->id)
            ->where('scheduled_at', '>=', now()->startOfDay())
            ->orderBy('scheduled_at')
            ->limit($limit)
            ->get()
            ->map(fn (SessionBooking $booking): array => $this->sessionData($booking))
            ->all();
    }

    private function studentStats(Request $request): array
    {
        $enrollments = $request->user()
            ->programEnrollments()
            ->with('variant:id,session')
            ->get();
        $totalSessions = $enrollments->sum(fn (ProgramEnrollment $enrollment): int => $enrollment->variant?->session ?? 0);
        $usedSessions = $enrollments->sum('sessions_used');
        $progress = $totalSessions > 0 ? (int) round(($usedSessions / $totalSessions) * 100) : 0;

        return [
            'activePrograms' => $enrollments->where('status', 'active')->count(),
            'completedLessons' => SessionBooking::query()
                ->where('user_id', $request->user()->id)
                ->where('status', 'completed')
                ->count(),
            'progress' => min(100, $progress),
            'upcomingSessions' => SessionBooking::query()
                ->where('user_id', $request->user()->id)
                ->where('scheduled_at', '>=', now())
                ->whereIn('status', ['pending', 'assigned', 'rescheduled'])
                ->count(),
        ];
    }

    private function studentSubjectOptions(Request $request): array
    {
        $enrollments = $request->user()
            ->programEnrollments()
            ->with(['program:id,name', 'program.subjects:id,name', 'variant:id,duration,session'])
            ->latest()
            ->get();

        $subjects = $enrollments
            ->flatMap(fn (ProgramEnrollment $enrollment) => $enrollment->program?->subjects->map(fn ($subject): array => [
                'duration' => $enrollment->variant?->duration ?? 60,
                'enrollmentId' => (string) $enrollment->id,
                'label' => $subject->name,
                'program' => $enrollment->program?->name,
                'sessionsRemaining' => $enrollment->sessionsRemaining(),
                'subjectId' => (string) $subject->id,
                'value' => "{$enrollment->id}:{$subject->id}",
            ]) ?? [])
            ->values()
            ->all();

        if ($subjects !== []) {
            return $subjects;
        }

        return [
            [
                'duration' => 60,
                'enrollmentId' => null,
                'label' => 'Frontend Basics',
                'program' => 'Demo Program',
                'sessionsRemaining' => null,
                'subjectId' => 'frontend-basics',
                'value' => 'frontend-basics',
            ],
            [
                'duration' => 90,
                'enrollmentId' => null,
                'label' => 'UI Design',
                'program' => 'Demo Program',
                'sessionsRemaining' => null,
                'subjectId' => 'ui-design',
                'value' => 'ui-design',
            ],
            [
                'duration' => 60,
                'enrollmentId' => null,
                'label' => 'React Advanced',
                'program' => 'Demo Program',
                'sessionsRemaining' => null,
                'subjectId' => 'react-advanced',
                'value' => 'react-advanced',
            ],
        ];
    }

    private function sessionData(SessionBooking $booking): array
    {
        $startAt = $booking->scheduled_at;
        $endAt = $booking->scheduled_at->copy()->addMinutes($booking->duration);

        return [
            'id' => (string) $booking->id,
            'endAt' => $endAt->toJSON(),
            'mentor' => $booking->mentor?->name ?? 'Unassigned mentor',
            'program' => $booking->enrollment?->program?->name ?? '-',
            'startAt' => $startAt->toJSON(),
            'status' => Str::headline($booking->status),
            'time' => "{$startAt->format('D, M j, H:i')} - {$endAt->format('H:i')}",
            'title' => $booking->subject?->name ?? 'Session',
            'zoomAccount' => $booking->zoomAccount?->name,
            'zoomLink' => $booking->zoom_link,
            'zoomMeetingId' => $booking->zoom_meeting_id,
            'zoomPasscode' => $booking->zoom_passcode,
        ];
    }

    private function mentorSessionData(SessionBooking $booking): array
    {
        $startAt = $booking->scheduled_at;
        $endAt = $booking->scheduled_at->copy()->addMinutes($booking->duration);
        $previousSession = SessionBooking::query()
            ->with('mentorJournal:id,session_booking_id,next_improvement_plan')
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
