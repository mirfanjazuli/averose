<?php

namespace Database\Factories;

use App\Models\Program;
use App\Models\ProgramMaterial;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<ProgramMaterial>
 */
class ProgramMaterialFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'uuid' => (string) Str::uuid(),
            'program_id' => Program::factory(),
            'uploaded_by' => User::factory()->admin(),
            'title' => fake()->sentence(3),
            'description' => fake()->optional()->sentence(),
            'disk' => 'r2',
            'path' => 'programs/sample-program/materials/'.Str::uuid().'.pdf',
            'original_name' => 'learning-material.pdf',
            'mime_type' => 'application/pdf',
            'size' => fake()->numberBetween(1024, 1048576),
            'status' => 'active',
        ];
    }
}
