<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AcademicsTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_from_academic_pages(): void
    {
        $this->get(route('fields'))
            ->assertRedirect(route('login'));

        $this->get(route('programs'))
            ->assertRedirect(route('login'));

        $this->get(route('subjects'))
            ->assertRedirect(route('login'));
    }

    public function test_admin_users_can_visit_the_fields_page(): void
    {
        $user = User::factory()->admin()->create();

        $this->actingAs($user);

        $response = $this->get(route('fields'));

        $response->assertOk();
    }

    public function test_admin_users_can_visit_the_programs_page(): void
    {
        $user = User::factory()->admin()->create();

        $this->actingAs($user);

        $response = $this->get(route('programs'));

        $response->assertOk();
    }

    public function test_admin_users_can_visit_the_subjects_page(): void
    {
        $user = User::factory()->admin()->create();

        $this->actingAs($user);

        $response = $this->get(route('subjects'));

        $response->assertOk();
    }
}
