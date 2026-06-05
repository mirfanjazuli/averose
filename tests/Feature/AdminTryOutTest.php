<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AdminTryOutTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_to_the_login_page(): void
    {
        $response = $this->get(route('admin.try-outs'));

        $response->assertRedirect(route('login'));
    }

    public function test_admin_users_can_visit_the_try_out_page(): void
    {
        $user = User::factory()->admin()->create();

        $response = $this->actingAs($user)->get(route('admin.try-outs'));

        $response
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('admin/try-outs'));
    }

    public function test_mentors_cannot_visit_the_admin_try_out_page(): void
    {
        $user = User::factory()->mentor()->create();

        $this->actingAs($user)
            ->get(route('admin.try-outs'))
            ->assertForbidden();
    }

    public function test_students_cannot_visit_the_admin_try_out_page(): void
    {
        $user = User::factory()->student()->create();

        $this->actingAs($user)
            ->get(route('admin.try-outs'))
            ->assertForbidden();
    }
}
