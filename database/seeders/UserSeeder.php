<?php

namespace Database\Seeders;

use App\Models\User;
use App\UserRole;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $users = [
            [
                'name' => 'AveRose Admin',
                'email' => 'admin@averose.test',
                'role' => UserRole::Admin,
            ],
            [
                'name' => 'AveRose Student',
                'email' => 'student@averose.test',
                'role' => UserRole::Student,
            ],
            [
                'name' => 'AveRose Mentor',
                'email' => 'mentor@averose.test',
                'role' => UserRole::Mentor,
            ],
        ];

        foreach ($users as $user) {
            User::query()->updateOrCreate(
                ['email' => $user['email']],
                [
                    'name' => $user['name'],
                    'email_verified_at' => now(),
                    'password' => Hash::make('averose123'),
                    'role' => $user['role'],
                ],
            );
        }
    }
}
