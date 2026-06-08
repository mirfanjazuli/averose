<?php

namespace Database\Factories;

use App\Models\AcademicField;
use App\Models\ProgramVariant;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ProgramVariant>
 */
class ProgramVariantFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $session = fake()->numberBetween(4, 12);
        $duration = fake()->randomElement([60, 90, 120]);

        return [
            'field_id' => AcademicField::factory(),
            'name' => "{$session} x {$duration} Minutes",
            'session' => $session,
            'duration' => $duration,
            'price' => fake()->numberBetween(500000, 5000000),
            'status' => 'active',
        ];
    }
}
