<?php

namespace App\Http\Controllers;

use App\Models\ProgramEnrollment;
use App\Models\SessionBooking;
use App\Models\User;
use App\UserRole;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class SchedulesController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request): Response
    {
        return match ($request->user()->role) {
            UserRole::Mentor => Inertia::render('mentor/schedules', [
                'sessions' => $this->mentorSessions($request),
            ]),
            UserRole::Admin => Inertia::render('admin/schedules/index', [
                'mentors' => $this->mentorOptions(),
                'sessions' => $this->adminSessions(),
            ]),
            UserRole::Student => Inertia::render('student/schedules', [
                'sessions' => $this->studentSessions($request),
                'subjects' => $this->studentSubjectOptions($request),
            ]),
        };
    }

    private function adminSessions(): array
    {
        return SessionBooking::query()
            ->with(['mentor:id,name', 'subject:id,name', 'user:id,name', 'zoomAccount:id,name,slug', 'enrollment.program:id,name'])
            ->orderBy('scheduled_at')
            ->get()
            ->map(fn (SessionBooking $booking): array => $this->sessionData($booking, includeStudent: true))
            ->all();
    }

    private function mentorOptions(): array
    {
        return User::query()
            ->where('role', UserRole::Mentor)
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn (User $mentor): array => [
                'id' => (string) $mentor->id,
                'name' => $mentor->name,
            ])
            ->all();
    }

    private function mentorSessions(Request $request): array
    {
        return SessionBooking::query()
            ->with(['subject:id,name', 'user:id,name', 'zoomAccount:id,name,slug', 'enrollment.program:id,name'])
            ->where('mentor_id', $request->user()->id)
            ->orderBy('scheduled_at')
            ->get()
            ->map(fn (SessionBooking $booking): array => $this->sessionData($booking, includeStudent: true))
            ->all();
    }

    private function studentSessions(Request $request): array
    {
        return SessionBooking::query()
            ->with(['mentor:id,name', 'subject:id,name', 'zoomAccount:id,name', 'enrollment.program:id,name'])
            ->where('user_id', $request->user()->id)
            ->orderBy('scheduled_at')
            ->get()
            ->map(fn (SessionBooking $booking): array => $this->sessionData($booking))
            ->all();
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

    private function sessionData(SessionBooking $booking, bool $includeStudent = false): array
    {
        $startAt = $booking->scheduled_at;
        $endAt = $booking->scheduled_at->copy()->addMinutes($booking->duration);

        $data = [
            'id' => (string) $booking->id,
            'endAt' => $endAt->toJSON(),
            'mentor' => $booking->mentor?->name ?? 'Unassigned mentor',
            'program' => $booking->enrollment?->program?->name ?? '-',
            'startAt' => $startAt->toJSON(),
            'status' => Str::headline($booking->status),
            'time' => "{$startAt->format('D, M j, H:i')} - {$endAt->format('H:i')}",
            'title' => $booking->subject?->name ?? 'Session',
            'zoomAccount' => $booking->zoomAccount?->name,
            'zoomAccountSlug' => $booking->zoomAccount?->slug,
            'zoomLink' => $booking->zoom_link,
            'zoomMeetingId' => $booking->zoom_meeting_id,
            'zoomPasscode' => $booking->zoom_passcode,
        ];

        if ($includeStudent) {
            $data['zoomStartUrl'] = $booking->zoom_start_url;
            $data['student'] = $booking->user?->name ?? '-';
        }

        return $data;
    }
}
