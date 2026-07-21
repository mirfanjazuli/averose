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

        $answer = fake()->randomElement(['A', 'B', 'C', 'D', 'E']);

        return [
            'answer' => $answer,
            'correct_answers' => null,
            'number' => fake()->unique()->numberBetween(1, 100),
            'question_type' => 'single_choice',
            'options' => $options,
            'options_html' => $options,
            'points' => 1,
            'question_html' => fake()->sentence(),
            'question_text' => fake()->sentence(),
            'sub_category_name' => null,
            'subject_name' => fake()->randomElement(['Matematika IPA', 'Fisika', 'Kimia', 'Biologi']),
            'try_out_id' => TryOut::factory(),
        ];
    }
}
