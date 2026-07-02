<?php

namespace Database\Factories;

use App\Models\TryOut;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<TryOut>
 */
class TryOutFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $title = fake()->sentence(3);

        return [
            'description' => fake()->sentence(),
            'duration_minutes' => fake()->numberBetween(60, 180),
            'slug' => Str::slug($title),
            'source_file_name' => null,
            'status' => 'draft',
            'title' => $title,
        ];
    }
}
