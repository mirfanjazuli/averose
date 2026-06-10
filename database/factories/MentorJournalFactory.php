<?php

namespace Database\Factories;

use App\Models\MentorJournal;
use App\Models\SessionBooking;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

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
        $sessionBooking = SessionBooking::factory()->create([
            'mentor_id' => User::factory()->mentor(),
            'status' => 'completed',
        ]);

        return [
            'session_booking_id' => $sessionBooking->id,
            'mentor_id' => $sessionBooking->mentor_id,
            'student_id' => $sessionBooking->user_id,
            'subject_id' => $sessionBooking->subject_id ?? Subject::factory(),
            'slug' => Str::slug(fake()->unique()->sentence(4)),
            'note' => 'completed',
            'achievement' => fake()->paragraph(),
            'improvement_area' => fake()->paragraph(),
            'next_improvement_plan' => fake()->paragraph(),
        ];
    }
}
