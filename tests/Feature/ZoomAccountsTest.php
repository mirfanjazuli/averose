<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ZoomAccountsTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_to_the_login_page(): void
    {
        $response = $this->get(route('zoom-accounts'));

        $response->assertRedirect(route('login'));
    }

    public function test_admin_users_can_visit_the_zoom_accounts_page(): void
    {
        $user = User::factory()->admin()->create();

        $this->actingAs($user);

        $response = $this->get(route('zoom-accounts'));

        $response->assertOk();
    }
}
