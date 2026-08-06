<?php

namespace Tests\Feature;

use App\Models\User;
use App\UserRole;
use Database\Seeders\DatabaseSeeder;
use Database\Seeders\UserSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class UserSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_seeder_creates_default_users_for_each_role(): void
    {
        $this->seed(DatabaseSeeder::class);

        $this->assertDatabaseHas('users', [
            'name' => 'AveRose Admin',
            'email' => 'admin@averose.test',
            'role' => UserRole::Admin->value,
        ]);

        $this->assertDatabaseHas('users', [
            'name' => 'AveRose Student',
            'email' => 'student@averose.test',
            'role' => UserRole::Student->value,
        ]);

        $this->assertDatabaseHas('users', [
            'name' => 'AveRose Mentor',
            'email' => 'mentor@averose.test',
            'role' => UserRole::Mentor->value,
        ]);

        $admin = User::query()->where('email', 'admin@averose.test')->firstOrFail();
        $student = User::query()->where('email', 'student@averose.test')->firstOrFail();
        $mentor = User::query()->where('email', 'mentor@averose.test')->firstOrFail();

        $this->assertNotEmpty($admin->slug);
        $this->assertNotEmpty($admin->nickname);
        $this->assertNotNull($admin->internalProfile);
        $this->assertNotEmpty($student->slug);
        $this->assertNotEmpty($student->nickname);
        $this->assertNotNull($student->studentProfile);
        $this->assertNotEmpty($mentor->slug);
        $this->assertNotEmpty($mentor->nickname);
        $this->assertNotNull($mentor->mentorProfile);
    }

    public function test_user_seeder_can_run_more_than_once_without_duplicate_users(): void
    {
        $this->seed(UserSeeder::class);
        $this->seed(UserSeeder::class);

        $this->assertSame(3, User::query()->count());
        $this->assertDatabaseCount('student_profiles', 1);
        $this->assertDatabaseCount('mentor_profiles', 1);
        $this->assertDatabaseCount('internal_profiles', 1);
    }

    public function test_default_seeded_users_use_the_default_password(): void
    {
        $this->seed(UserSeeder::class);

        $user = User::query()->where('email', 'admin@averose.test')->firstOrFail();

        $this->assertTrue(Hash::check('averose123', $user->password));
    }

    public function test_admin_can_open_seeded_student_detail_by_slug(): void
    {
        $this->seed(DatabaseSeeder::class);

        $admin = User::query()->where('email', 'admin@averose.test')->firstOrFail();
        $student = User::query()->where('email', 'student@averose.test')->firstOrFail();

        $this->actingAs($admin)
            ->get(route('students.show', $student))
            ->assertOk();
    }
}
