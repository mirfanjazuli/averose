<?php

namespace Database\Factories;

use App\Models\Schedule;
use App\Models\ScheduleFeedback;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ScheduleFeedback>
 */
class ScheduleFeedbackFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $schedule = Schedule::factory()->create([
            'scheduled_at' => now()->subHours(2),
            'status' => 'completed',
        ]);

        return [
            'audio_quality_rating' => fake()->numberBetween(3, 5),
            'comment' => fake()->optional()->sentence(),
            'interactivity_rating' => fake()->numberBetween(3, 5),
            'material_clarity_rating' => fake()->numberBetween(3, 5),
            'mentor_id' => $schedule->mentor_id,
            'schedule_id' => $schedule->id,
            'user_id' => $schedule->user_id,
            'visual_quality_rating' => fake()->numberBetween(3, 5),
        ];
    }
}
