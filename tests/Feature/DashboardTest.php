<?php

namespace Tests\Feature;

use App\Models\AcademicField;
use App\Models\Program;
use App\Models\ProgramVariant;
use App\Models\Schedule;
use App\Models\ScheduleFeedback;
use App\Models\Subject;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_to_the_login_page(): void
    {
        $response = $this->get(route('dashboard'));
        $response->assertRedirect(route('login'));
    }

    public function test_admin_users_can_visit_the_dashboard(): void
    {
        $user = User::factory()->admin()->create();
        $mentor = User::factory()->mentor()->create([
            'status' => 'active',
        ]);
        $student = User::factory()->student()->create();
        $program = Program::factory()->create([
            'name' => 'IELTS Intensive',
        ]);
        $field = AcademicField::factory()->create();
        $variant = ProgramVariant::factory()->create([
            'field_id' => $field->id,
        ]);
        $subject = Subject::factory()->create([
            'name' => 'Academic Writing',
        ]);
        $enrollment = $student->programEnrollments()->create([
            'program_id' => $program->id,
            'field_id' => $field->id,
            'program_variant_id' => $variant->id,
            'start_date' => now()->toDateString(),
            'status' => 'active',
        ]);

        Schedule::factory()->create([
            'user_id' => $student->id,
            'mentor_id' => $mentor->id,
            'program_enrollment_id' => $enrollment->id,
            'subject_id' => $subject->id,
            'scheduled_at' => now(),
            'status' => 'assigned',
        ]);

        $this->actingAs($user);

        $response = $this->get(route('dashboard'));
        $response
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/dashboard/index')
                ->where('stats.0.label', 'Total Program')
                ->where('stats.0.value', '1')
                ->where('stats.1.label', 'Total Sesi')
                ->where('stats.1.value', '1')
                ->where('stats.2.label', 'Rata-rata sesi/hari')
                ->where('stats.3.label', 'Mentor aktif')
                ->where('stats.3.value', '1')
                ->where('filters.from', now()->startOfMonth()->toDateString())
                ->where('filters.to', now()->endOfMonth()->toDateString())
                ->where('charts.sessionTotals.title', 'Total Sesi')
                ->where('charts.programRegistrants.title', 'Total Pendaftar')
                ->where('charts.popularPrograms.items.0.label', 'IELTS Intensive')
                ->where('charts.popularPrograms.items.0.value', 1)
                ->where('charts.popularSubjects.items.0.label', 'Academic Writing')
                ->where('charts.popularSubjects.items.0.value', 1)
            );
    }

    public function test_admin_dashboard_filters_session_data_by_date_range(): void
    {
        $admin = User::factory()->admin()->create();
        $student = User::factory()->student()->create();
        $program = Program::factory()->create();
        $field = AcademicField::factory()->create();
        $variant = ProgramVariant::factory()->create([
            'field_id' => $field->id,
        ]);
        $subject = Subject::factory()->create();
        $enrollment = $student->programEnrollments()->create([
            'program_id' => $program->id,
            'field_id' => $field->id,
            'program_variant_id' => $variant->id,
            'start_date' => '2026-07-01',
            'status' => 'active',
        ]);
        $enrollment->forceFill([
            'created_at' => '2026-07-10 09:00:00',
            'updated_at' => '2026-07-10 09:00:00',
        ])->save();

        Schedule::factory()->create([
            'user_id' => $student->id,
            'program_enrollment_id' => $enrollment->id,
            'subject_id' => $subject->id,
            'scheduled_at' => '2026-06-10 09:00:00',
        ]);
        Schedule::factory()->create([
            'user_id' => $student->id,
            'program_enrollment_id' => $enrollment->id,
            'subject_id' => $subject->id,
            'scheduled_at' => '2026-06-20 09:00:00',
        ]);
        Schedule::factory()->create([
            'user_id' => $student->id,
            'program_enrollment_id' => $enrollment->id,
            'subject_id' => $subject->id,
            'scheduled_at' => '2026-07-10 09:00:00',
        ]);
        Schedule::factory()->create([
            'user_id' => $student->id,
            'program_enrollment_id' => $enrollment->id,
            'subject_id' => $subject->id,
            'scheduled_at' => '2026-08-10 09:00:00',
        ]);

        $this->actingAs($admin)
            ->get(route('dashboard', [
                'from' => '2026-07-01',
                'to' => '2026-07-31',
            ]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/dashboard/index')
                ->where('filters.from', '2026-07-01')
                ->where('filters.to', '2026-07-31')
                ->where('stats.1.value', '1')
                ->where('stats.1.trend.direction', 'down')
                ->where('stats.1.trend.label', '1')
                ->where('charts.popularSubjects.items.0.value', 1)
                ->where('charts.popularPrograms.items.0.value', 1)
            );
    }

    public function test_admin_dashboard_date_filter_uses_the_users_utc_boundaries(): void
    {
        $admin = User::factory()->admin()->create(['timezone' => 'Asia/Jakarta']);

        Schedule::factory()->create(['scheduled_at' => '2026-07-30 16:59:59']);
        Schedule::factory()->create(['scheduled_at' => '2026-07-30 17:00:00']);
        Schedule::factory()->create(['scheduled_at' => '2026-07-31 16:59:59']);
        Schedule::factory()->create(['scheduled_at' => '2026-07-31 17:00:00']);

        $this->actingAs($admin)
            ->get(route('dashboard', [
                'from' => '2026-07-31',
                'to' => '2026-07-31',
            ]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('stats.1.value', '2')
                ->where('charts.sessionTotals.items.0.label', '31 Jul')
                ->where('charts.sessionTotals.items.0.value', 2)
            );
    }

    public function test_admin_dashboard_yearly_filter_groups_line_charts_by_month(): void
    {
        $admin = User::factory()->admin()->create();
        $student = User::factory()->student()->create();
        $program = Program::factory()->create();
        $field = AcademicField::factory()->create();
        $variant = ProgramVariant::factory()->create([
            'field_id' => $field->id,
        ]);
        $subject = Subject::factory()->create();
        $enrollment = $student->programEnrollments()->create([
            'program_id' => $program->id,
            'field_id' => $field->id,
            'program_variant_id' => $variant->id,
            'start_date' => '2026-01-01',
            'status' => 'active',
        ]);
        $enrollment->forceFill([
            'created_at' => '2026-01-03 09:00:00',
            'updated_at' => '2026-01-03 09:00:00',
        ])->save();
        $marchEnrollment = $student->programEnrollments()->create([
            'program_id' => $program->id,
            'field_id' => $field->id,
            'program_variant_id' => $variant->id,
            'start_date' => '2026-03-01',
            'status' => 'active',
        ]);
        $marchEnrollment->forceFill([
            'created_at' => '2026-03-03 09:00:00',
            'updated_at' => '2026-03-03 09:00:00',
        ])->save();

        Schedule::factory()->create([
            'user_id' => $student->id,
            'program_enrollment_id' => $enrollment->id,
            'subject_id' => $subject->id,
            'scheduled_at' => '2026-01-10 09:00:00',
        ]);
        Schedule::factory()->create([
            'user_id' => $student->id,
            'program_enrollment_id' => $enrollment->id,
            'subject_id' => $subject->id,
            'scheduled_at' => '2026-01-20 09:00:00',
        ]);
        Schedule::factory()->create([
            'user_id' => $student->id,
            'program_enrollment_id' => $enrollment->id,
            'subject_id' => $subject->id,
            'scheduled_at' => '2026-02-10 09:00:00',
        ]);

        $this->actingAs($admin)
            ->get(route('dashboard', [
                'from' => '2026-01-01',
                'to' => '2026-12-31',
            ]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/dashboard/index')
                ->has('charts.sessionTotals.items', 12)
                ->where('charts.sessionTotals.items.0.label', 'Jan')
                ->where('charts.sessionTotals.items.0.value', 2)
                ->where('charts.sessionTotals.items.1.label', 'Feb')
                ->where('charts.sessionTotals.items.1.value', 1)
                ->where('charts.sessionTotals.items.2.label', 'Mar')
                ->where('charts.sessionTotals.items.2.value', 0)
                ->has('charts.programRegistrants.items', 12)
                ->where('charts.programRegistrants.items.0.label', 'Jan')
                ->where('charts.programRegistrants.items.0.value', 1)
                ->where('charts.programRegistrants.items.2.label', 'Mar')
                ->where('charts.programRegistrants.items.2.value', 1)
            );
    }

    public function test_admin_users_can_download_dashboard_pdf_for_selected_date_range(): void
    {
        $admin = User::factory()->admin()->create();

        $this->assertFileExists(public_path('reports/averose-report-header.png'));
        $this->assertFileExists(public_path('reports/averose-report-footer.png'));
        $this->assertFileExists(public_path('reports/averose-report-watermark.png'));

        $response = $this->actingAs($admin)
            ->get(route('dashboard.download-pdf', [
                'from' => '2026-07-01',
                'to' => '2026-07-31',
            ]))
            ->assertOk()
            ->assertHeader('content-type', 'application/pdf')
            ->assertHeader('content-disposition', 'attachment; filename="admin-dashboard-2026-07-01-2026-07-31.pdf"');

        $this->assertStringStartsWith('%PDF', $response->getContent());
    }

    public function test_dashboard_pdf_metadata_identifies_the_user_timezone(): void
    {
        $charts = [
            'sessionTotals' => ['items' => []],
            'programRegistrants' => ['items' => []],
            'popularPrograms' => ['title' => 'Program Terpopuler', 'items' => []],
            'popularSubjects' => ['title' => 'Mata Pelajaran Terpopuler', 'items' => []],
        ];

        $html = view('reports.admin-dashboard', [
            'activityPeriodLabel' => 'Tanggal',
            'activityTableTitle' => 'Data Harian',
            'charts' => $charts,
            'generatedAt' => CarbonImmutable::parse('2026-07-31 16:40:00', 'Asia/Makassar'),
            'period' => '01 Jul 2026 - 31 Jul 2026',
            'stats' => [],
            'timezone' => 'Asia/Makassar',
        ])->render();

        $this->assertStringContainsString(
            '31 Jul 2026 16:40 WITA (Asia/Makassar)',
            $html,
        );
    }

    public function test_mentor_users_can_visit_the_dashboard(): void
    {
        $user = User::factory()->mentor()->create();
        $this->actingAs($user);

        $response = $this->get(route('dashboard'));

        $response
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('mentor/dashboard/index'));
    }

    public function test_mentor_dashboard_shows_two_nearest_next_sessions(): void
    {
        $this->travelTo('2026-07-06 08:00:00');

        $mentor = User::factory()->mentor()->create();
        $student = User::factory()->student()->create();
        $enrollment = $student->programEnrollments()->create([
            'program_id' => Program::factory()->create()->id,
            'field_id' => AcademicField::factory()->create()->id,
            'program_variant_id' => ProgramVariant::factory()->create()->id,
            'start_date' => now()->toDateString(),
            'status' => 'active',
        ]);
        $subject = Subject::factory()->create();

        $nearestSession = Schedule::factory()->create([
            'user_id' => $student->id,
            'mentor_id' => $mentor->id,
            'program_enrollment_id' => $enrollment->id,
            'subject_id' => $subject->id,
            'scheduled_at' => now()->addHour(),
            'status' => 'assigned',
        ]);
        $secondNearestSession = Schedule::factory()->create([
            'user_id' => $student->id,
            'mentor_id' => $mentor->id,
            'program_enrollment_id' => $enrollment->id,
            'subject_id' => $subject->id,
            'scheduled_at' => now()->addDay(),
            'status' => 'rescheduled',
        ]);
        Schedule::factory()->create([
            'user_id' => $student->id,
            'mentor_id' => $mentor->id,
            'program_enrollment_id' => $enrollment->id,
            'subject_id' => $subject->id,
            'scheduled_at' => now()->addDays(2),
            'status' => 'assigned',
        ]);

        $this->actingAs($mentor)
            ->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('mentor/dashboard/index')
                ->has('nextSessions', 2)
                ->where('nextSessions.0.id', (string) $nearestSession->id)
                ->where('nextSessions.1.id', (string) $secondNearestSession->id)
            );
    }

    public function test_student_users_can_visit_the_dashboard(): void
    {
        $user = User::factory()->student()->create();
        $this->actingAs($user);

        $response = $this->get(route('dashboard'));

        $response
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('student/dashboard/index'));
    }

    public function test_student_dashboard_receives_booking_subject_options(): void
    {
        $student = User::factory()->student()->create();
        $field = AcademicField::factory()->create();
        $subject = Subject::factory()->create([
            'name' => 'Academic Writing',
        ]);
        $program = Program::factory()->create([
            'name' => 'IELTS Intensive',
        ]);
        $variant = ProgramVariant::factory()->create([
            'field_id' => $field->id,
            'duration' => 120,
            'session' => 8,
        ]);

        $program->subjects()->attach($subject);
        $enrollment = $student->programEnrollments()->create([
            'program_id' => $program->id,
            'field_id' => $field->id,
            'program_variant_id' => $variant->id,
            'start_date' => '2026-07-01',
            'sessions_used' => 3,
            'status' => 'active',
        ]);

        $this->actingAs($student)
            ->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn (Assert $page): Assert => $page
                ->component('student/dashboard/index')
                ->where('subjects.0.label', 'Academic Writing')
                ->where('subjects.0.program', 'IELTS Intensive')
                ->where('subjects.0.duration', 120)
                ->where('subjects.0.enrollmentId', (string) $enrollment->id)
                ->where('subjects.0.sessionsRemaining', 5)
            );
    }

    public function test_student_dashboard_receives_database_sessions_and_stats(): void
    {
        $student = User::factory()->student()->create();
        $field = AcademicField::factory()->create();
        $subject = Subject::factory()->create([
            'name' => 'Speaking Review',
        ]);
        $program = Program::factory()->create([
            'name' => 'IELTS Intensive',
        ]);
        $variant = ProgramVariant::factory()->create([
            'field_id' => $field->id,
            'session' => 4,
            'duration' => 60,
        ]);
        $program->subjects()->attach($subject);
        $enrollment = $student->programEnrollments()->create([
            'program_id' => $program->id,
            'field_id' => $field->id,
            'program_variant_id' => $variant->id,
            'sessions_used' => 1,
            'start_date' => '2026-07-01',
            'status' => 'active',
        ]);

        Schedule::factory()->create([
            'user_id' => $student->id,
            'program_enrollment_id' => $enrollment->id,
            'subject_id' => $subject->id,
            'scheduled_at' => now()->addDay()->setTime(9, 30),
            'duration' => 60,
            'status' => 'pending',
        ]);

        $this->actingAs($student)
            ->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn (Assert $page): Assert => $page
                ->component('student/dashboard/index')
                ->where('sessions.0.title', 'Speaking Review')
                ->where('sessions.0.program', 'IELTS Intensive')
                ->where('stats.activePrograms', 1)
                ->where('stats.upcomingSessions', 1)
                ->where('stats.progress', 25)
            );
    }

    public function test_student_dashboard_receives_pending_feedback_sessions(): void
    {
        $student = User::factory()->student()->create();
        $mentor = User::factory()->mentor()->create(['name' => 'Mira Mentor']);
        $subject = Subject::factory()->create(['name' => 'Biologi']);

        $firstPending = Schedule::factory()->create([
            'mentor_id' => $mentor->id,
            'scheduled_at' => now()->subDays(3),
            'status' => 'completed',
            'subject_id' => $subject->id,
            'user_id' => $student->id,
        ]);
        Schedule::factory()->create([
            'mentor_id' => $mentor->id,
            'scheduled_at' => now()->subDays(2),
            'status' => 'completed',
            'subject_id' => $subject->id,
            'user_id' => $student->id,
        ]);
        Schedule::factory()->create([
            'mentor_id' => $mentor->id,
            'scheduled_at' => now()->subDay(),
            'status' => 'completed',
            'subject_id' => $subject->id,
            'user_id' => $student->id,
        ]);
        ScheduleFeedback::query()->create([
            'audio_quality_rating' => 4,
            'interactivity_rating' => 5,
            'material_clarity_rating' => 5,
            'mentor_id' => $mentor->id,
            'schedule_id' => Schedule::factory()->create([
                'mentor_id' => $mentor->id,
                'scheduled_at' => now()->subDays(4),
                'status' => 'completed',
                'subject_id' => $subject->id,
                'user_id' => $student->id,
            ])->id,
            'user_id' => $student->id,
            'visual_quality_rating' => 4,
        ]);

        $this->actingAs($student)
            ->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn (Assert $page): Assert => $page
                ->component('student/dashboard/index')
                ->has('pendingFeedbackSessions', 2)
                ->where('pendingFeedbackSessions.0.id', (string) $firstPending->id)
                ->where('pendingFeedbackSessions.0.title', 'Biologi')
                ->where('pendingFeedbackSessions.0.mentor', 'Mira Mentor')
                ->where('pendingFeedbackSessions.0.mentorRating', 4.5)
            );
    }

    public function test_student_dashboard_hides_pending_feedback_when_sessions_are_rated(): void
    {
        $student = User::factory()->student()->create();
        $mentor = User::factory()->mentor()->create();
        $schedule = Schedule::factory()->create([
            'mentor_id' => $mentor->id,
            'scheduled_at' => now()->subDay(),
            'status' => 'completed',
            'user_id' => $student->id,
        ]);

        ScheduleFeedback::query()->create([
            'audio_quality_rating' => 4,
            'interactivity_rating' => 4,
            'material_clarity_rating' => 4,
            'mentor_id' => $mentor->id,
            'schedule_id' => $schedule->id,
            'user_id' => $student->id,
            'visual_quality_rating' => 4,
        ]);

        $this->actingAs($student)
            ->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn (Assert $page): Assert => $page
                ->component('student/dashboard/index')
                ->has('pendingFeedbackSessions', 0)
            );
    }
}
