<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_students_cannot_visit_admin_management_pages(): void
    {
        $user = User::factory()->student()->create();

        $this->actingAs($user)
            ->get(route('students'))
            ->assertForbidden();
    }

    public function test_mentors_cannot_visit_admin_management_pages(): void
    {
        $user = User::factory()->mentor()->create();

        $this->actingAs($user)
            ->get(route('students'))
            ->assertForbidden();
    }
}
