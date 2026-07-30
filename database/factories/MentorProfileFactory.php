<?php

namespace Database\Factories;

use App\Models\MentorLevel;
use App\Models\MentorProfile;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<MentorProfile>
 */
class MentorProfileFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'bank_account_name' => fake()->name(),
            'bank_account_number' => fake()->numerify('##########'),
            'bank_name' => fake()->randomElement(['BCA', 'BNI', 'BRI', 'Mandiri']),
            'bio' => fake()->sentence(),
            'expertise' => [fake()->word(), fake()->word()],
            'mentor_level_id' => MentorLevel::query()->inRandomOrder()->value('id') ?? MentorLevel::factory(),
            'user_id' => fn (): int => User::factory()->mentor()->createQuietly()->id,
        ];
    }
}
