<?php

namespace App\Http\Controllers;

use App\Models\ProgramEnrollment;
use App\Models\SessionBooking;
use App\Models\User;
use App\UserRole;
use Carbon\CarbonImmutable;
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
            ->with(['mentor:id,name', 'pendingRescheduleRequest', 'subject:id,name', 'user:id,name', 'zoomAccount:id,name,slug', 'enrollment.program:id,name'])
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
            ->with(['pendingRescheduleRequest', 'subject:id,name', 'user:id,name', 'zoomAccount:id,name,slug', 'enrollment.program:id,name'])
            ->where('mentor_id', $request->user()->id)
            ->orderBy('scheduled_at')
            ->get()
            ->map(fn (SessionBooking $booking): array => $this->sessionData($booking, includeStudent: true))
            ->all();
    }

    private function studentSessions(Request $request): array
    {
        return SessionBooking::query()
            ->with(['mentor:id,name', 'pendingRescheduleRequest', 'subject:id,name', 'zoomAccount:id,name', 'enrollment.program:id,name'])
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

        if ($booking->pendingRescheduleRequest) {
            $requestedAt = $booking->pendingRescheduleRequest->requested_scheduled_at;
            $requestedEndAt = $requestedAt->copy()->addMinutes($booking->pendingRescheduleRequest->duration);

            $data['rescheduleRequest'] = [
                'id' => (string) $booking->pendingRescheduleRequest->id,
                'reason' => $booking->pendingRescheduleRequest->reason,
                'requested' => "{$requestedAt->format('D, M j, H:i')} - {$requestedEndAt->format('H:i')}",
                'status' => Str::headline($booking->pendingRescheduleRequest->status),
            ];
        } else {
            $data['rescheduleRequest'] = null;
        }

        if ($includeStudent) {
            $data['zoomStartUrl'] = $booking->zoom_start_url;
            $data['student'] = $booking->user?->name ?? '-';
        } else {
            $data['canRequestReschedule'] = $booking->mentor_id !== null && $booking->scheduled_at->isFuture() && ! $booking->pendingRescheduleRequest;
            $data['rescheduleSlots'] = $this->rescheduleSlots($booking);
        }

        return $data;
    }

    private function rescheduleSlots(SessionBooking $booking): array
    {
        if (! $booking->mentor_id || $booking->scheduled_at->isPast() || $booking->pendingRescheduleRequest) {
            return [];
        }

        $slots = [];
        $cursor = $this->nextHalfHour(CarbonImmutable::now()->addHour());
        $lastDay = CarbonImmutable::now()->addDays(14)->endOfDay();

        while ($cursor->lessThanOrEqualTo($lastDay) && count($slots) < 18) {
            if ($cursor->hour >= 8 && $cursor->hour < 20 && $this->mentorAvailableAt($booking, $cursor)) {
                $endAt = $cursor->addMinutes($booking->duration);

                $slots[] = [
                    'label' => "{$cursor->format('D, M j, H:i')} - {$endAt->format('H:i')}",
                    'value' => $cursor->format('Y-m-d H:i:s'),
                ];
            }

            $cursor = $cursor->addMinutes(30);
        }

        return $slots;
    }

    private function mentorAvailableAt(SessionBooking $booking, CarbonImmutable $startAt): bool
    {
        $endAt = $startAt->addMinutes($booking->duration);

        if ($startAt->equalTo(CarbonImmutable::instance($booking->scheduled_at))) {
            return false;
        }

        return ! SessionBooking::query()
            ->where('mentor_id', $booking->mentor_id)
            ->whereKeyNot($booking->id)
            ->where('scheduled_at', '<', $endAt)
            ->get(['id', 'scheduled_at', 'duration'])
            ->contains(fn (SessionBooking $mentorBooking): bool => $mentorBooking->scheduled_at->copy()->addMinutes($mentorBooking->duration)->greaterThan($startAt));
    }

    private function nextHalfHour(CarbonImmutable $date): CarbonImmutable
    {
        $minute = $date->minute;
        $roundedMinute = (int) (ceil($minute / 30) * 30);

        if ($roundedMinute >= 60) {
            $nextHour = $date->addHour();

            return $nextHour->setTime($nextHour->hour, 0, 0);
        }

        return $date->setTime($date->hour, $roundedMinute, 0);
    }
}
