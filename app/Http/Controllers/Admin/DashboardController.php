<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Program;
use App\Models\ProgramEnrollment;
use App\Models\Schedule;
use App\Models\Subject;
use App\Models\User;
use App\UserRole;
use Carbon\CarbonPeriod;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;
use Mpdf\Mpdf;
use Mpdf\Output\Destination;

class DashboardController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request): Response
    {
        abort_unless($request->user()?->hasPermission('dashboard.view'), 403);

        $adminDateRange = $this->adminDateRange($request);

        return Inertia::render('admin/dashboard/index', [
            'charts' => $this->adminCharts($adminDateRange),
            'filters' => [
                'from' => $adminDateRange['from']->toDateString(),
                'to' => $adminDateRange['to']->toDateString(),
            ],
            'stats' => $this->adminStats($adminDateRange),
        ]);
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
        ])->render();

        $tempDir = storage_path('app/mpdf');

        if (! is_dir($tempDir)) {
            mkdir($tempDir, 0755, true);
        }

        $mpdf = new Mpdf([
            'format' => 'A4',
            'margin_bottom' => 32,
            'margin_footer' => 0,
            'margin_header' => 0,
            'margin_left' => 20,
            'margin_right' => 18,
            'margin_top' => 46,
            'tempDir' => $tempDir,
            'watermarkImgBehind' => true,
        ]);
        $this->applyReportWatermark($mpdf, 'averose-report-watermark.png');
        $mpdf->SetHTMLHeader($this->reportImageHtml('averose-report-header.png', 20, 210));
        $mpdf->SetHTMLFooter($this->reportImageHtml('averose-report-footer.png', 4, 194));
        $mpdf->WriteHTML($html);
        $pdf = $mpdf->Output('', Destination::STRING_RETURN);

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
        $sessionsInRange = Schedule::query()
            ->whereBetween('scheduled_at', [$dateRange['from'], $dateRange['to']])
            ->count();
        $previousSessionsInRange = Schedule::query()
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
            $totals = Schedule::query()
                ->selectRaw($this->monthBucketExpression('scheduled_at').' as month, count(*) as total')
                ->whereBetween('scheduled_at', [$dateRange['from'], $dateRange['to']])
                ->groupBy('month')
                ->pluck('total', 'month');

            return $this->monthlyChartItems($dateRange, $totals);
        }

        $startDate = $dateRange['from']->toDateString();
        $endDate = $dateRange['to']->toDateString();
        $totals = Schedule::query()
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
        $driver = Schedule::query()->getConnection()->getDriverName();

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
            ->withCount(['schedules' => fn ($query) => $query->whereBetween('scheduled_at', [$dateRange['from'], $dateRange['to']])])
            ->orderByDesc('schedules_count')
            ->orderBy('name')
            ->limit(5)
            ->get()
            ->map(fn (Subject $subject): array => [
                'label' => $subject->name,
                'value' => $subject->schedules_count,
            ])
            ->all();
    }

    private function reportImageHtml(string $filename, int $offsetLeft = 0, int $width = 170): string
    {
        $image = $this->reportImageDataUri($filename);

        return '<div style="margin-left: -'.$offsetLeft.'mm;"><img src="'.$image.'" width="'.$width.'mm" /></div>';
    }

    private function reportImageDataUri(string $filename): string
    {
        $path = $this->reportImagePath($filename);

        $contents = file_get_contents($path);

        if ($contents === false) {
            throw new \RuntimeException("Unable to read report asset [{$filename}].");
        }

        return 'data:image/png;base64,'.base64_encode($contents);
    }

    private function applyReportWatermark(Mpdf $mpdf, string $filename): void
    {
        $path = $this->reportImagePath($filename);

        $mpdf->SetWatermarkImage($path, 0.18, [112, 112], 'F');
        $mpdf->showWatermarkImage = true;
    }

    private function reportImagePath(string $filename): string
    {
        $path = public_path('reports/'.$filename);

        if (! is_file($path)) {
            throw new \RuntimeException("Report asset [{$filename}] was not found.");
        }

        return $path;
    }
}
