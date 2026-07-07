<?php

namespace App\Http\Controllers;

use App\Models\MentorJournal;
use App\Models\Program;
use App\Models\ProgramEnrollment;
use App\Models\SessionBooking;
use App\Models\SessionRecording;
use App\Models\Subject;
use App\Models\User;
use App\UserRole;
use Carbon\CarbonPeriod;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Browsershot\Browsershot;

class DashboardController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request): Response
    {
        $adminDateRange = $this->adminDateRange($request);

        return match ($request->user()->role) {
            UserRole::Admin => Inertia::render('admin/dashboard', [
                'charts' => $this->adminCharts($adminDateRange),
                'filters' => [
                    'from' => $adminDateRange['from']->toDateString(),
                    'to' => $adminDateRange['to']->toDateString(),
                ],
                'stats' => $this->adminStats($adminDateRange),
            ]),
            UserRole::Mentor => Inertia::render('mentor/dashboard', [
                'completionSession' => $this->mentorCompletionSession($request),
                'nextSessions' => $this->mentorNextSessions($request),
                'pendingJournals' => $this->mentorPendingJournals($request),
                'recentJournals' => $this->mentorRecentJournals($request),
                'stats' => $this->mentorStats($request),
                'todaySessions' => $this->mentorTodaySessions($request),
            ]),
            UserRole::Student => Inertia::render('student/dashboard', [
                'recordings' => $this->studentRecordings($request),
                'sessions' => $this->studentSessions($request, 5),
                'stats' => $this->studentStats($request),
                'subjects' => $this->studentSubjectOptions($request),
            ]),
        };
    }

    public function downloadAdminPdf(Request $request): HttpResponse
    {
        $dateRange = $this->adminDateRange($request);
        $stats = $this->adminStats($dateRange);
        $charts = $this->adminCharts($dateRange);
        $html = view('reports.admin-dashboard', [
            'activityPeriodLabel' => $this->isFullYearRange($dateRange) ? 'Bulan' : 'Tanggal',
            'activityTableTitle' => $this->isFullYearRange($dateRange) ? 'Data Bulanan' : 'Data Harian',
            'charts' => $charts,
            'generatedAt' => now(),
            'period' => $dateRange['from']->format('d M Y').' - '.$dateRange['to']->format('d M Y'),
            'stats' => $stats,
            'watermarkImage' => $this->reportImageDataUri('averose-report-watermark.png'),
        ])->render();
        $pdf = Browsershot::html($html)
            ->format('A4')
            ->margins(58, 18, 40, 20)
            ->showBrowserHeaderAndFooter()
            ->headerHtml($this->reportImageHtml('averose-report-header.png'))
            ->footerHtml($this->reportImageHtml('averose-report-footer.png'))
            ->showBackground()
            ->pdf();

        return response($pdf, 200, [
            'Content-Disposition' => 'attachment; filename="admin-dashboard-'.$dateRange['from']->toDateString().'-'.$dateRange['to']->toDateString().'.pdf"',
            'Content-Type' => 'application/pdf',
        ]);
    }

    /**
     * @return array{from: Carbon, to: Carbon}
     */
    private function adminDateRange(Request $request): array
    {
        $from = $this->parseDateQuery($request->query('from'))?->startOfDay() ?? now()->startOfMonth();
        $to = $this->parseDateQuery($request->query('to'))?->endOfDay() ?? now()->endOfMonth();

        if ($to->lt($from)) {
            [$from, $to] = [$to->copy()->startOfDay(), $from->copy()->endOfDay()];
        }

        return [
            'from' => $from,
            'to' => $to,
        ];
    }

    private function parseDateQuery(mixed $value): ?Carbon
    {
        if (! is_string($value) || blank($value)) {
            return null;
        }

        try {
            return Carbon::parse($value);
        } catch (\Throwable) {
            return null;
        }
    }

    /**
     * @param  array{from: Carbon, to: Carbon}  $dateRange
     */
    private function adminStats(array $dateRange): array
    {
        $previousDateRange = $this->previousDateRange($dateRange);
        $sessionsInRange = SessionBooking::query()
            ->whereBetween('scheduled_at', [$dateRange['from'], $dateRange['to']])
            ->count();
        $previousSessionsInRange = SessionBooking::query()
            ->whereBetween('scheduled_at', [$previousDateRange['from'], $previousDateRange['to']])
            ->count();
        $totalDays = max(1, (int) $dateRange['from']->diffInDays($dateRange['to']) + 1);
        $previousTotalDays = max(1, (int) $previousDateRange['from']->diffInDays($previousDateRange['to']) + 1);
        $averageSessionsPerDay = $sessionsInRange / $totalDays;
        $previousAverageSessionsPerDay = $previousSessionsInRange / $previousTotalDays;
        $programsInRange = Program::query()
            ->where('created_at', '<=', $dateRange['to'])
            ->count();
        $previousProgramsInRange = Program::query()
            ->where('created_at', '<=', $previousDateRange['to'])
            ->count();
        $activeMentorsInRange = User::query()
            ->where('role', UserRole::Mentor)
            ->where('status', 'active')
            ->where('created_at', '<=', $dateRange['to'])
            ->count();
        $previousActiveMentorsInRange = User::query()
            ->where('role', UserRole::Mentor)
            ->where('status', 'active')
            ->where('created_at', '<=', $previousDateRange['to'])
            ->count();

        return [
            [
                'href' => '/academics/programs',
                'label' => 'Total Program',
                'trend' => $this->comparisonTrend($programsInRange, $previousProgramsInRange),
                'value' => (string) $programsInRange,
            ],
            [
                'href' => '/scheduling/schedules',
                'label' => 'Total Sesi',
                'trend' => $this->comparisonTrend($sessionsInRange, $previousSessionsInRange),
                'value' => (string) $sessionsInRange,
            ],
            [
                'href' => '/scheduling/schedules',
                'label' => 'Rata-rata sesi/hari',
                'trend' => $this->comparisonTrend($averageSessionsPerDay, $previousAverageSessionsPerDay),
                'value' => number_format($averageSessionsPerDay, 1),
            ],
            [
                'href' => '/users/mentors',
                'label' => 'Mentor aktif',
                'trend' => $this->comparisonTrend($activeMentorsInRange, $previousActiveMentorsInRange),
                'value' => (string) $activeMentorsInRange,
            ],
        ];
    }

    /**
     * @param  array{from: Carbon, to: Carbon}  $dateRange
     * @return array{from: Carbon, to: Carbon}
     */
    private function previousDateRange(array $dateRange): array
    {
        if ($this->isFullYearRange($dateRange)) {
            return [
                'from' => $dateRange['from']->copy()->subYear()->startOfYear(),
                'to' => $dateRange['from']->copy()->subYear()->endOfYear(),
            ];
        }

        if ($this->isFullMonthRange($dateRange)) {
            return [
                'from' => $dateRange['from']->copy()->subMonthNoOverflow()->startOfMonth(),
                'to' => $dateRange['from']->copy()->subMonthNoOverflow()->endOfMonth(),
            ];
        }

        if ($this->isFullWeekRange($dateRange)) {
            return [
                'from' => $dateRange['from']->copy()->subWeek()->startOfWeek(Carbon::MONDAY),
                'to' => $dateRange['from']->copy()->subWeek()->endOfWeek(Carbon::SUNDAY),
            ];
        }

        $totalDays = max(1, (int) $dateRange['from']->diffInDays($dateRange['to']) + 1);

        return [
            'from' => $dateRange['from']->copy()->subDays($totalDays),
            'to' => $dateRange['to']->copy()->subDays($totalDays),
        ];
    }

    /**
     * @return array{direction: 'down'|'neutral'|'up', label: string}
     */
    private function comparisonTrend(float|int $current, float|int $previous): array
    {
        $difference = $current - $previous;

        if (abs($difference) < 0.01) {
            return [
                'direction' => 'neutral',
                'label' => '',
            ];
        }

        $direction = $difference > 0 ? 'up' : 'down';

        return [
            'direction' => $direction,
            'label' => $this->formatTrendNumber(abs($difference)),
        ];
    }

    private function formatTrendNumber(float|int $value): string
    {
        if (is_float($value) && floor($value) !== $value) {
            return number_format($value, 1);
        }

        return number_format($value);
    }

    /**
     * @param  array{from: Carbon, to: Carbon}  $dateRange
     */
    private function adminCharts(array $dateRange): array
    {
        return [
            'sessionTotals' => [
                'description' => 'Jumlah sesi terjadwal pada periode terpilih.',
                'items' => $this->dailySessionTotals($dateRange),
                'title' => 'Total Sesi',
            ],
            'programRegistrants' => [
                'description' => 'Jumlah pendaftar program pada periode terpilih.',
                'items' => $this->dailyProgramRegistrants($dateRange),
                'title' => 'Total Pendaftar',
            ],
            'popularPrograms' => [
                'description' => 'Program dengan enrollment terbanyak pada periode terpilih.',
                'items' => $this->popularPrograms($dateRange),
                'title' => 'Program Terpopuler',
            ],
            'popularSubjects' => [
                'description' => 'Mata pelajaran dengan sesi terbanyak pada periode terpilih.',
                'items' => $this->popularSubjects($dateRange),
                'title' => 'Mata Pelajaran Terpopuler',
            ],
        ];
    }

    /**
     * @param  array{from: Carbon, to: Carbon}  $dateRange
     */
    private function dailySessionTotals(array $dateRange): array
    {
        if ($this->isFullYearRange($dateRange)) {
            $totals = SessionBooking::query()
                ->selectRaw($this->monthBucketExpression('scheduled_at').' as month, count(*) as total')
                ->whereBetween('scheduled_at', [$dateRange['from'], $dateRange['to']])
                ->groupBy('month')
                ->pluck('total', 'month');

            return $this->monthlyChartItems($dateRange, $totals);
        }

        $startDate = $dateRange['from']->toDateString();
        $endDate = $dateRange['to']->toDateString();
        $totals = SessionBooking::query()
            ->selectRaw('date(scheduled_at) as date, count(*) as total')
            ->whereBetween('scheduled_at', [$dateRange['from'], $dateRange['to']])
            ->groupBy('date')
            ->pluck('total', 'date');

        return collect(CarbonPeriod::create($startDate, $endDate))
            ->map(fn ($date): array => [
                'label' => $date->format('d M'),
                'value' => (int) ($totals[$date->toDateString()] ?? 0),
            ])
            ->all();
    }

    /**
     * @param  array{from: Carbon, to: Carbon}  $dateRange
     */
    private function dailyProgramRegistrants(array $dateRange): array
    {
        if ($this->isFullYearRange($dateRange)) {
            $totals = ProgramEnrollment::query()
                ->selectRaw($this->monthBucketExpression('created_at').' as month, count(*) as total')
                ->whereBetween('created_at', [$dateRange['from'], $dateRange['to']])
                ->groupBy('month')
                ->pluck('total', 'month');

            return $this->monthlyChartItems($dateRange, $totals);
        }

        $startDate = $dateRange['from']->toDateString();
        $endDate = $dateRange['to']->toDateString();
        $totals = ProgramEnrollment::query()
            ->selectRaw('date(created_at) as date, count(*) as total')
            ->whereBetween('created_at', [$dateRange['from'], $dateRange['to']])
            ->groupBy('date')
            ->pluck('total', 'date');

        return collect(CarbonPeriod::create($startDate, $endDate))
            ->map(fn ($date): array => [
                'label' => $date->format('d M'),
                'value' => (int) ($totals[$date->toDateString()] ?? 0),
            ])
            ->all();
    }

    /**
     * @param  array{from: Carbon, to: Carbon}  $dateRange
     */
    private function isFullYearRange(array $dateRange): bool
    {
        return $dateRange['from']->isSameDay($dateRange['from']->copy()->startOfYear())
            && $dateRange['to']->isSameDay($dateRange['from']->copy()->endOfYear());
    }

    /**
     * @param  array{from: Carbon, to: Carbon}  $dateRange
     */
    private function isFullMonthRange(array $dateRange): bool
    {
        return $dateRange['from']->isSameDay($dateRange['from']->copy()->startOfMonth())
            && $dateRange['to']->isSameDay($dateRange['from']->copy()->endOfMonth());
    }

    /**
     * @param  array{from: Carbon, to: Carbon}  $dateRange
     */
    private function isFullWeekRange(array $dateRange): bool
    {
        return $dateRange['from']->isSameDay($dateRange['from']->copy()->startOfWeek(Carbon::MONDAY))
            && $dateRange['to']->isSameDay($dateRange['from']->copy()->endOfWeek(Carbon::SUNDAY));
    }

    private function monthBucketExpression(string $column): string
    {
        $driver = SessionBooking::query()->getConnection()->getDriverName();

        return match ($driver) {
            'mysql', 'mariadb' => "date_format({$column}, '%Y-%m')",
            'pgsql' => "to_char({$column}, 'YYYY-MM')",
            default => "strftime('%Y-%m', {$column})",
        };
    }

    /**
     * @param  array{from: Carbon, to: Carbon}  $dateRange
     * @param  Collection<string, int>  $totals
     */
    private function monthlyChartItems(array $dateRange, Collection $totals): array
    {
        return collect(CarbonPeriod::create(
            $dateRange['from']->copy()->startOfMonth(),
            '1 month',
            $dateRange['to']->copy()->startOfMonth(),
        ))
            ->map(fn (Carbon $date): array => [
                'label' => $date->format('M'),
                'value' => (int) ($totals[$date->format('Y-m')] ?? 0),
            ])
            ->all();
    }

    /**
     * @param  array{from: Carbon, to: Carbon}  $dateRange
     */
    private function popularPrograms(array $dateRange): array
    {
        return Program::query()
            ->withCount(['enrollments' => fn ($query) => $query->whereBetween('created_at', [$dateRange['from'], $dateRange['to']])])
            ->orderByDesc('enrollments_count')
            ->orderBy('name')
            ->limit(5)
            ->get()
            ->map(fn (Program $program): array => [
                'label' => $program->name,
                'value' => $program->enrollments_count,
            ])
            ->all();
    }

    /**
     * @param  array{from: Carbon, to: Carbon}  $dateRange
     */
    private function popularSubjects(array $dateRange): array
    {
        return Subject::query()
            ->withCount(['bookings' => fn ($query) => $query->whereBetween('scheduled_at', [$dateRange['from'], $dateRange['to']])])
            ->orderByDesc('bookings_count')
            ->orderBy('name')
            ->limit(5)
            ->get()
            ->map(fn (Subject $subject): array => [
                'label' => $subject->name,
                'value' => $subject->bookings_count,
            ])
            ->all();
    }

    private function reportImageHtml(string $filename): string
    {
        $image = $this->reportImageDataUri($filename);

        if ($image === null) {
            return '<div></div>';
        }

        return '<style>*{box-sizing:border-box}body{margin:0}</style><img src="'.$image.'" style="display:block;width:100%;height:auto;margin:0" />';
    }

    private function reportImageDataUri(string $filename): ?string
    {
        $path = public_path('reports/'.$filename);

        if (! is_file($path)) {
            return null;
        }

        $contents = file_get_contents($path);

        if ($contents === false) {
            return null;
        }

        return 'data:image/png;base64,'.base64_encode($contents);
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
        $upcomingSessions = SessionBooking::query()
            ->where('mentor_id', $mentorId)
            ->where('scheduled_at', '>=', now())
            ->whereIn('status', ['assigned', 'rescheduled'])
            ->count();
        $pendingJournals = SessionBooking::query()
            ->where('mentor_id', $mentorId)
            ->where('scheduled_at', '<=', now())
            ->whereIn('status', ['assigned', 'rescheduled'])
            ->whereDoesntHave('mentorJournal')
            ->count();
        $monthlySessions = SessionBooking::query()
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

    private function mentorNextSessions(Request $request): array
    {
        return SessionBooking::query()
            ->with(['subject:id,name', 'user:id,name', 'enrollment.program:id,name', 'zoomAccount:id,name'])
            ->where('mentor_id', $request->user()->id)
            ->where('scheduled_at', '>=', now())
            ->whereIn('status', ['assigned', 'rescheduled'])
            ->orderBy('scheduled_at')
            ->limit(2)
            ->get()
            ->map(fn (SessionBooking $booking): array => $this->mentorSessionData($booking))
            ->all();
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

    private function mentorPendingJournals(Request $request): array
    {
        return SessionBooking::query()
            ->with(['subject:id,name', 'user:id,name', 'enrollment.program:id,name', 'zoomAccount:id,name'])
            ->where('mentor_id', $request->user()->id)
            ->where('scheduled_at', '<=', now())
            ->whereIn('status', ['assigned', 'rescheduled'])
            ->whereDoesntHave('mentorJournal')
            ->orderBy('scheduled_at')
            ->limit(2)
            ->get()
            ->map(function (SessionBooking $booking): array {
                $session = $this->mentorSessionData($booking);
                $session['needsCompletion'] = true;

                return $session;
            })
            ->all();
    }

    private function mentorRecentJournals(Request $request): array
    {
        return MentorJournal::query()
            ->with(['sessionBooking:id,scheduled_at,duration,program_enrollment_id', 'sessionBooking.enrollment.program:id,name', 'student:id,name', 'subject:id,name'])
            ->where('mentor_id', $request->user()->id)
            ->latest()
            ->limit(5)
            ->get()
            ->map(fn (MentorJournal $journal): array => [
                'date' => $journal->sessionBooking?->scheduled_at?->format('D, M j') ?? $journal->created_at->format('D, M j'),
                'id' => (string) $journal->id,
                'improvementPlan' => $journal->next_improvement_plan,
                'note' => Str::headline($journal->note),
                'program' => $journal->sessionBooking?->enrollment?->program?->name ?? '-',
                'slug' => $journal->slug,
                'student' => $journal->student?->name ?? '-',
                'title' => $journal->subject?->name ?? 'Session',
            ])
            ->all();
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

    private function studentRecordings(Request $request): array
    {
        return SessionRecording::query()
            ->with(['sessionBooking.subject:id,name', 'sessionBooking.mentor:id,name'])
            ->where('user_id', $request->user()->id)
            ->latest('recorded_at')
            ->latest()
            ->limit(6)
            ->get()
            ->map(function (SessionRecording $recording): array {
                return [
                    'id' => (string) $recording->id,
                    'mentor' => $recording->sessionBooking?->mentor?->name ?? '-',
                    'recordedAt' => $recording->recorded_at?->toJSON(),
                    'subject' => $recording->sessionBooking?->subject?->name ?? 'Session',
                    'title' => $recording->title,
                    'youtubeEmbedUrl' => "https://www.youtube-nocookie.com/embed/{$recording->youtube_video_id}",
                    'youtubeUrl' => $recording->youtube_url,
                ];
            })
            ->all();
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
