<?php

namespace Database\Factories;

use App\Models\TryOut;
use App\Models\TryOutGroup;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<TryOutGroup>
 */
class TryOutGroupFactory extends Factory
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
            'available_from' => now()->subDay()->toDateString(),
            'available_until' => now()->addMonth()->toDateString(),
            'max_participants' => null,
            'name' => fake()->words(3, true),
            'status' => 'active',
            'token' => Str::upper(Str::random(10)),
            'try_out_id' => TryOut::factory()->state(['status' => 'private']),
        ];
    }
}
