<?php

namespace Tests\Feature;

use App\Models\User;
use App\UserRole;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserRoleTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_role_defaults_to_student(): void
    {
        $user = User::factory()->create();

        $this->assertSame(UserRole::Student, $user->role);
        $this->assertTrue($user->isStudent());
        $this->assertFalse($user->isAdmin());
        $this->assertFalse($user->isMentor());
    }

    public function test_user_can_have_admin_role(): void
    {
        $user = User::factory()->admin()->create();

        $this->assertSame(UserRole::Admin, $user->role);
        $this->assertTrue($user->isAdmin());
    }

    public function test_user_can_have_mentor_role(): void
    {
        $user = User::factory()->mentor()->create();

        $this->assertSame(UserRole::Mentor, $user->role);
        $this->assertTrue($user->isMentor());
    }
}
