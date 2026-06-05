<?php

namespace Tests\Feature;

use App\Models\User;
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
