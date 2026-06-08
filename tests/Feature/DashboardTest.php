<?php

namespace Tests\Feature;

use App\Models\AcademicField;
use App\Models\Program;
use App\Models\ProgramVariant;
use App\Models\SessionBooking;
use App\Models\Subject;
use App\Models\User;
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
        User::factory()->student()->create([
            'email_verified_at' => now(),
        ]);
        User::factory()->mentor()->create([
            'email_verified_at' => null,
        ]);

        $this->actingAs($user);

        $response = $this->get(route('dashboard'));
        $response
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/dashboard')
                ->where('stats.0.label', 'Students')
                ->where('stats.0.value', '1')
                ->where('stats.1.label', 'Mentors')
                ->where('stats.1.value', '1')
                ->where('userComposition.activeAccounts', 2)
                ->where('userComposition.verifiedProfiles', 50)
            );
    }

    public function test_mentor_users_can_visit_the_dashboard(): void
    {
        $user = User::factory()->mentor()->create();
        $this->actingAs($user);

        $response = $this->get(route('dashboard'));

        $response
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('mentor/dashboard'));
    }

    public function test_student_users_can_visit_the_dashboard(): void
    {
        $user = User::factory()->student()->create();
        $this->actingAs($user);

        $response = $this->get(route('dashboard'));

        $response
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('student/dashboard'));
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
                ->component('student/dashboard')
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

        SessionBooking::factory()->create([
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
                ->component('student/dashboard')
                ->where('sessions.0.title', 'Speaking Review')
                ->where('sessions.0.program', 'IELTS Intensive')
                ->where('stats.activePrograms', 1)
                ->where('stats.upcomingSessions', 1)
                ->where('stats.progress', 25)
            );
    }
}
