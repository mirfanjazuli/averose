<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class StudentTryOutTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_to_the_login_page(): void
    {
        $response = $this->get(route('try-outs'));

        $response->assertRedirect(route('login'));
    }

    public function test_students_can_visit_the_try_out_page(): void
    {
        $user = User::factory()->student()->create();

        $response = $this->actingAs($user)->get(route('try-outs'));

        $response
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('student/try-outs'));
    }

    public function test_admins_cannot_visit_the_student_try_out_page(): void
    {
        $user = User::factory()->admin()->create();

        $this->actingAs($user)
            ->get(route('try-outs'))
            ->assertForbidden();
    }

    public function test_mentors_cannot_visit_the_try_out_page(): void
    {
        $user = User::factory()->mentor()->create();

        $this->actingAs($user)
            ->get(route('try-outs'))
            ->assertForbidden();
    }
}
