<?php

namespace Tests\Feature;

use App\Models\User;
use App\UserRole;
use Database\Seeders\UserSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class UserSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_seeder_creates_default_users_for_each_role(): void
    {
        $this->seed(UserSeeder::class);

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
    }

    public function test_user_seeder_can_run_more_than_once_without_duplicate_users(): void
    {
        $this->seed(UserSeeder::class);
        $this->seed(UserSeeder::class);

        $this->assertSame(3, User::query()->count());
    }

    public function test_default_seeded_users_use_the_default_password(): void
    {
        $this->seed(UserSeeder::class);

        $user = User::query()->where('email', 'admin@averose.test')->firstOrFail();

        $this->assertTrue(Hash::check('averose123', $user->password));
    }
}
