<?php

namespace Database\Factories;

use App\Models\ProgramEnrollment;
use App\Models\SessionBooking;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SessionBooking>
 */
class SessionBookingFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'mentor_id' => null,
            'zoom_account_id' => null,
            'program_enrollment_id' => ProgramEnrollment::factory(),
            'subject_id' => Subject::factory(),
            'scheduled_at' => fake()->dateTimeBetween('+1 week', '+2 months'),
            'duration' => fake()->randomElement([60, 90, 120]),
            'zoom_link' => null,
            'zoom_meeting_id' => null,
            'zoom_start_url' => null,
            'zoom_passcode' => null,
            'assigned_at' => null,
            'status' => 'pending',
        ];
    }
}
