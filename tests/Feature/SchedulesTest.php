<?php

namespace Tests\Feature;

use App\Models\AcademicField;
use App\Models\Program;
use App\Models\ProgramEnrollment;
use App\Models\ProgramVariant;
use App\Models\SessionBooking;
use App\Models\Subject;
use App\Models\User;
use App\Models\ZoomAccount;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class SchedulesTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_to_the_login_page(): void
    {
        $response = $this->get(route('schedules'));

        $response->assertRedirect(route('login'));
    }

    public function test_admin_users_can_visit_the_schedules_page(): void
    {
        $user = User::factory()->admin()->create();

        $this->actingAs($user);

        $response = $this->get(route('schedules'));

        $response
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('admin/schedules/index'));
    }

    public function test_mentor_users_can_visit_the_schedules_page(): void
    {
        $user = User::factory()->mentor()->create();

        $this->actingAs($user);

        $response = $this->get(route('schedules'));

        $response
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('mentor/schedules'));
    }

    public function test_mentor_schedules_receive_database_sessions(): void
    {
        $mentor = User::factory()->mentor()->create();
        $student = User::factory()->student()->create([
            'name' => 'Sinta Student',
        ]);
        $field = AcademicField::factory()->create();
        $subject = Subject::factory()->create([
            'name' => 'Writing Review',
        ]);
        $program = Program::factory()->create([
            'name' => 'IELTS Intensive',
        ]);
        $variant = ProgramVariant::factory()->create([
            'field_id' => $field->id,
        ]);
        $zoomAccount = ZoomAccount::factory()->create([
            'name' => 'Mentor Zoom',
        ]);
        $enrollment = ProgramEnrollment::factory()->for($student)->create([
            'field_id' => $field->id,
            'program_id' => $program->id,
            'program_variant_id' => $variant->id,
        ]);

        SessionBooking::factory()->create([
            'mentor_id' => $mentor->id,
            'program_enrollment_id' => $enrollment->id,
            'scheduled_at' => '2026-07-10 13:00:00',
            'status' => 'assigned',
            'subject_id' => $subject->id,
            'user_id' => $student->id,
            'zoom_account_id' => $zoomAccount->id,
            'zoom_link' => 'https://zoom.test/j/mentor',
        ]);

        $this->actingAs($mentor)
            ->get(route('schedules'))
            ->assertOk()
            ->assertInertia(fn (Assert $page): Assert => $page
                ->component('mentor/schedules')
                ->where('sessions.0.title', 'Writing Review')
                ->where('sessions.0.student', 'Sinta Student')
                ->where('sessions.0.program', 'IELTS Intensive')
                ->where('sessions.0.zoomAccount', 'Mentor Zoom')
            );
    }

    public function test_student_users_can_visit_the_schedules_page(): void
    {
        $user = User::factory()->student()->create();

        $this->actingAs($user);

        $response = $this->get(route('schedules'));

        $response
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('student/schedules'));
    }

    public function test_admin_users_can_visit_the_mentor_assignments_page(): void
    {
        $user = User::factory()->admin()->create();

        $this->actingAs($user);

        $response = $this->get(route('schedules.mentor-assignments'));

        $response->assertOk();
    }

    public function test_admin_users_can_visit_the_reschedule_requests_page(): void
    {
        $user = User::factory()->admin()->create();

        $this->actingAs($user);

        $response = $this->get(route('schedules.reschedule-requests'));

        $response->assertOk();
    }

    public function test_admin_users_can_visit_the_working_hours_page(): void
    {
        $user = User::factory()->admin()->create();

        $this->actingAs($user);

        $response = $this->get(route('schedules.working-hours'));

        $response->assertOk();
    }

    public function test_admin_users_can_visit_the_public_holidays_page(): void
    {
        $user = User::factory()->admin()->create();

        $this->actingAs($user);

        $response = $this->get(route('schedules.public-holidays'));

        $response->assertOk();
    }

    public function test_guests_are_redirected_from_schedule_sub_pages(): void
    {
        $this->get(route('schedules.mentor-assignments'))
            ->assertRedirect(route('login'));

        $this->get(route('schedules.reschedule-requests'))
            ->assertRedirect(route('login'));

        $this->get(route('schedules.working-hours'))
            ->assertRedirect(route('login'));

        $this->get(route('schedules.public-holidays'))
            ->assertRedirect(route('login'));
    }
}
