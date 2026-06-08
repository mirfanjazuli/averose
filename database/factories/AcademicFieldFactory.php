<?php

namespace Database\Factories;

use App\Models\AcademicField;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<AcademicField>
 */
class AcademicFieldFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = fake()->unique()->words(2, true);

        return [
            'name' => $name,
            'description' => fake()->sentence(),
            'status' => 'active',
        ];
    }
}
