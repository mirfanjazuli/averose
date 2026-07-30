<?php

namespace Database\Factories;

use App\Models\MentorJournal;
use App\Models\Schedule;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<MentorJournal>
 */
class MentorJournalFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $schedule = Schedule::factory()->create([
            'mentor_id' => User::factory()->mentor(),
            'status' => 'completed',
        ]);

        return [
            'schedule_id' => $schedule->id,
            'mentor_id' => $schedule->mentor_id,
            'student_id' => $schedule->user_id,
            'subject_id' => $schedule->subject_id ?? Subject::factory(),
            'slug' => $schedule->code,
            'achievement' => fake()->paragraph(),
            'improvement_area' => fake()->paragraph(),
            'next_improvement_plan' => fake()->paragraph(),
        ];
    }
}
