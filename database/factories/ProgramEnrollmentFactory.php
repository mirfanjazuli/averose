<?php

namespace Database\Factories;

use App\Models\AcademicField;
use App\Models\Program;
use App\Models\ProgramEnrollment;
use App\Models\ProgramVariant;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ProgramEnrollment>
 */
class ProgramEnrollmentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $field = AcademicField::factory();
        $program = Program::factory();
        $variant = ProgramVariant::factory([
            'field_id' => $field,
        ]);

        return [
            'user_id' => User::factory(),
            'program_id' => $program,
            'field_id' => $field,
            'program_variant_id' => $variant,
            'start_date' => fake()->date(),
            'max_reschedule' => fake()->numberBetween(0, 5),
            'status' => 'active',
        ];
    }
}
