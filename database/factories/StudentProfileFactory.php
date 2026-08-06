<?php

namespace Database\Factories;

use App\Models\StudentProfile;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<StudentProfile>
 */
class StudentProfileFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'education_level' => fake()->randomElement(['SMA', 'SMP', 'Mahasiswa']),
            'grade' => fake()->randomElement(['10', '11', '12']),
            'parent_phone' => fake()->phoneNumber(),
            'school' => fake()->company().' School',
            'user_id' => fn (): int => User::factory()->student()->createQuietly()->id,
        ];
    }
}
