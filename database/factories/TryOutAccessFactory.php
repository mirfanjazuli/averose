<?php

namespace Database\Factories;

use App\Models\TryOut;
use App\Models\TryOutAccess;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TryOutAccess>
 */
class TryOutAccessFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'attempt_quota' => 1,
            'attempts_used' => 0,
            'available_from' => now()->subDay()->toDateString(),
            'available_until' => now()->addMonth()->toDateString(),
            'status' => 'active',
            'try_out_id' => TryOut::factory()->state(['status' => 'private']),
            'user_id' => User::factory()->student(),
        ];
    }
}
