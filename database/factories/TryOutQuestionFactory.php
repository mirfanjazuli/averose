<?php

namespace Database\Factories;

use App\Models\TryOut;
use App\Models\TryOutQuestion;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TryOutQuestion>
 */
class TryOutQuestionFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $options = [
            'A' => fake()->sentence(),
            'B' => fake()->sentence(),
            'C' => fake()->sentence(),
            'D' => fake()->sentence(),
            'E' => fake()->sentence(),
        ];

        return [
            'answer' => fake()->randomElement(['A', 'B', 'C', 'D', 'E']),
            'number' => fake()->unique()->numberBetween(1, 100),
            'options' => $options,
            'options_html' => $options,
            'question_html' => fake()->sentence(),
            'question_text' => fake()->sentence(),
            'subject_name' => fake()->randomElement(['Matematika IPA', 'Fisika', 'Kimia', 'Biologi']),
            'try_out_id' => TryOut::factory(),
        ];
    }
}
