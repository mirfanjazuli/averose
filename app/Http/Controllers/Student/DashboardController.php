<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\ProgramEnrollment;
use App\Models\Recording;
use App\Models\Schedule;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        return Inertia::render('student/dashboard/index', [
            'pendingFeedbackSessions' => $this->pendingFeedbackSessions($request),
            'recordings' => $this->recordings($request),
            'sessions' => $this->sessions($request, 5),
            'stats' => $this->stats($request),
            'subjects' => $this->subjectOptions($request),
        ]);
    }

    private function sessions(Request $request, int $limit): array
    {
        return Schedule::query()
            ->with(['mentor:id,name', 'subject:id,name,icon', 'zoomAccount:id,name', 'enrollment.program:id,name'])
            ->where('user_id', $request->user()->id)
            ->where('scheduled_at', '>=', now()->startOfDay())
            ->orderBy('scheduled_at')
            ->limit($limit)
            ->get()
            ->map(fn (Schedule $booking): array => $this->sessionData($booking))
            ->all();
    }

    private function pendingFeedbackSessions(Request $request): array
    {
        $schedules = Schedule::query()
            ->with(['feedback', 'mentor:id,name', 'subject:id,name,icon', 'zoomAccount:id,name', 'enrollment.program:id,name'])
            ->where('user_id', $request->user()->id)
            ->whereDoesntHave('feedback')
            ->where('scheduled_at', '<=', now())
            ->oldest('scheduled_at')
            ->get()
            ->filter(function (Schedule $schedule): bool {
                $endAt = $schedule->scheduled_at->copy()->addMinutes($schedule->duration);

                return $schedule->status === 'completed' || $endAt->isPast();
            })
            ->take(2);

        $mentorRatings = $this->mentorRatings($schedules->pluck('mentor_id')->filter()->unique()->all());

        return $schedules
            ->map(function (Schedule $schedule) use ($mentorRatings): array {
                $data = $this->sessionData($schedule);
                $rating = $schedule->mentor_id ? $mentorRatings->get($schedule->mentor_id) : null;

                $data['mentorRating'] = $rating === null ? null : round((float) $rating, 1);

                return $data;
            })
            ->values()
            ->all();
    }

    private function mentorRatings(array $mentorIds): Collection
    {
        if ($mentorIds === []) {
            return collect();
        }

        return DB::table('schedule_feedback')
            ->selectRaw('mentor_id, AVG((interactivity_rating + material_clarity_rating + audio_quality_rating + visual_quality_rating) / 4.0) as rating')
            ->whereIn('mentor_id', $mentorIds)
            ->groupBy('mentor_id')
            ->pluck('rating', 'mentor_id');
    }

    private function stats(Request $request): array
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
            'completedLessons' => Schedule::query()
                ->where('user_id', $request->user()->id)
                ->where('status', 'completed')
                ->count(),
            'progress' => min(100, $progress),
            'upcomingSessions' => Schedule::query()
                ->where('user_id', $request->user()->id)
                ->where('scheduled_at', '>=', now())
                ->whereIn('status', ['pending', 'assigned', 'rescheduled'])
                ->count(),
        ];
    }

    private function subjectOptions(Request $request): array
    {
        $enrollments = $request->user()
            ->programEnrollments()
            ->with(['program:id,name', 'program.subjects:id,name,icon', 'variant:id,duration,session'])
            ->latest()
            ->get();

        return $enrollments
            ->flatMap(fn (ProgramEnrollment $enrollment) => $enrollment->program?->subjects->map(fn ($subject): array => [
                'duration' => $enrollment->variant?->duration ?? 60,
                'enrollmentId' => (string) $enrollment->id,
                'icon' => $subject->icon,
                'label' => $subject->name,
                'program' => $enrollment->program?->name,
                'sessionsRemaining' => $enrollment->sessionsRemaining(),
                'subjectId' => (string) $subject->id,
                'value' => "{$enrollment->id}:{$subject->id}",
            ]) ?? [])
            ->values()
            ->all();
    }

    private function recordings(Request $request): array
    {
        return Recording::query()
            ->with(['schedule.subject:id,name', 'schedule.mentor:id,name'])
            ->where('user_id', $request->user()->id)
            ->where('status', 'active')
            ->latest('recorded_at')
            ->latest()
            ->limit(6)
            ->get()
            ->map(function (Recording $recording): array {
                return [
                    'id' => (string) $recording->id,
                    'mentor' => $recording->schedule?->mentor?->name ?? '-',
                    'recordedAt' => $recording->recorded_at?->toJSON(),
                    'subject' => $recording->schedule?->subject?->name ?? 'Session',
                    'title' => $recording->title,
                    'youtubeEmbedUrl' => "https://www.youtube-nocookie.com/embed/{$recording->youtube_video_id}",
                    'youtubeUrl' => $recording->youtube_url,
                ];
            })
            ->all();
    }

    private function sessionData(Schedule $booking): array
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
            'subjectIcon' => $booking->subject?->icon,
            'time' => "{$startAt->format('D, M j, H:i')} - {$endAt->format('H:i')}",
            'title' => $booking->subject?->name ?? 'Session',
            'zoomAccount' => $booking->zoomAccount?->name,
            'zoomLink' => $booking->zoom_link,
            'zoomMeetingId' => $booking->zoom_meeting_id,
            'zoomPasscode' => $booking->zoom_passcode,
        ];
    }
}
