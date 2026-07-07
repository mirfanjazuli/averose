<?php

namespace Database\Factories;

use App\Models\SessionBooking;
use App\Models\SessionRescheduleRequest;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SessionRescheduleRequest>
 */
class SessionRescheduleRequestFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $currentScheduledAt = fake()->dateTimeBetween('+1 day', '+2 weeks');
        $requestedScheduledAt = fake()->dateTimeBetween('+2 days', '+3 weeks');

        return [
            'admin_note' => null,
            'current_scheduled_at' => $currentScheduledAt,
            'duration' => fake()->randomElement([60, 90, 120]),
            'mentor_id' => User::factory()->mentor(),
            'notes' => fake()->optional()->sentence(),
            'reason' => 'Class schedule overlap',
            'requested_scheduled_at' => $requestedScheduledAt,
            'reviewed_at' => null,
            'reviewed_by' => null,
            'session_booking_id' => SessionBooking::factory(),
            'status' => 'pending',
            'user_id' => User::factory()->student(),
        ];
    }

    public function approved(): static
    {
        return $this->state(fn (array $attributes): array => [
            'reviewed_at' => now(),
            'reviewed_by' => User::factory()->admin(),
            'status' => 'approved',
        ]);
    }

    public function rejected(): static
    {
        return $this->state(fn (array $attributes): array => [
            'admin_note' => fake()->sentence(),
            'reviewed_at' => now(),
            'reviewed_by' => User::factory()->admin(),
            'status' => 'rejected',
        ]);
    }
}
