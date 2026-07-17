<?php

namespace Database\Factories;

use App\Models\TryOut;
use App\Models\TryOutAsset;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<TryOutAsset>
 */
class TryOutAssetFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $uuid = (string) Str::uuid();

        return [
            'disk' => 'local',
            'mime_type' => 'image/png',
            'path' => "try-outs/1/{$uuid}.png",
            'size' => 1024,
            'status' => 'permanent',
            'try_out_id' => TryOut::factory(),
            'uploaded_by' => User::factory()->admin(),
            'uuid' => $uuid,
        ];
    }
}
