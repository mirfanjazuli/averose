<?php

namespace Database\Factories;

use App\Models\TryOut;
use App\Models\TryOutAttempt;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TryOutAttempt>
 */
class TryOutAttemptFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'answers' => [
                '1' => 'A',
                '2' => 'B',
            ],
            'correct_count' => 1,
            'partial_count' => 0,
            'wrong_count' => 1,
            'unanswered_count' => 0,
            'question_count' => 2,
            'score' => 50,
            'scoring_mode' => 'raw_score',
            'max_score' => 100,
            'percentage_score' => null,
            'submitted_at' => now(),
            'try_out_id' => TryOut::factory(),
            'user_id' => User::factory()->student(),
        ];
    }
}
