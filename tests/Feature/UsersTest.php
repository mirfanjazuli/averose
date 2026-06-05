<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UsersTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_to_the_login_page_from_students(): void
    {
        $response = $this->get(route('students'));

        $response->assertRedirect(route('login'));
    }

    public function test_admin_users_can_visit_the_students_page(): void
    {
        $user = User::factory()->admin()->create();

        $this->actingAs($user);

        $response = $this->get(route('students'));

        $response->assertOk();
    }

    public function test_guests_are_redirected_to_the_login_page_from_mentors(): void
    {
        $response = $this->get(route('mentors'));

        $response->assertRedirect(route('login'));
    }

    public function test_admin_users_can_visit_the_mentors_page(): void
    {
        $user = User::factory()->admin()->create();

        $this->actingAs($user);

        $response = $this->get(route('mentors'));

        $response->assertOk();
    }
}
