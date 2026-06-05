<?php

namespace Database\Factories;

use App\Models\ZoomAccount;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ZoomAccount>
 */
class ZoomAccountFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->company().' Room',
            'account_id' => fake()->unique()->bothify('zoom-account-########'),
            'client_id' => fake()->unique()->bothify('zoom-client-########'),
            'client_secret' => fake()->password(32, 48),
            'token_secret' => fake()->password(32, 48),
        ];
    }
}
