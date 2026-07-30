<?php

namespace Database\Factories;

use App\Models\MentorLevel;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<MentorLevel>
 */
class MentorLevelFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'hourly_rate' => fake()->numberBetween(50000, 250000),
            'is_default' => false,
            'name' => fake()->unique()->randomElement(['Junior', 'Middle', 'Senior', 'Expert']).' '.fake()->unique()->numberBetween(1, 999),
            'status' => 'active',
        ];
    }

    public function default(): static
    {
        return $this->state(fn (): array => [
            'is_default' => true,
            'status' => 'active',
        ]);
    }

    public function inactive(): static
    {
        return $this->state(fn (): array => [
            'status' => 'inactive',
        ]);
    }
}
