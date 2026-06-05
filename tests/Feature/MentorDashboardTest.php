<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class MentorDashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_to_the_login_page(): void
    {
        $response = $this->get(route('dashboard'));

        $response->assertRedirect(route('login'));
    }

    public function test_mentors_can_visit_their_dashboard_through_the_shared_dashboard_url(): void
    {
        $user = User::factory()->mentor()->create();

        $this->actingAs($user)
            ->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('mentor/dashboard'));
    }

    public function test_the_old_mentor_dashboard_url_is_not_registered(): void
    {
        $this->get('/mentor/dashboard')->assertNotFound();
    }
}
