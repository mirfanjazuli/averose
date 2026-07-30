<?php

namespace Database\Factories;

use App\Models\InternalProfile;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<InternalProfile>
 */
class InternalProfileFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'department' => fake()->randomElement(['Product', 'Marketing', 'Accounting', 'IT Support']),
            'employee_code' => fake()->unique()->bothify('AVG-###'),
            'position' => fake()->jobTitle(),
            'user_id' => fn (): int => User::factory()->admin()->createQuietly()->id,
        ];
    }
}
