<?php

namespace Database\Seeders;

use App\Models\TryOut;
use Illuminate\Database\Seeder;

class TryOutSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        TryOut::factory()
            ->hasQuestions(10)
            ->create([
                'duration_minutes' => 120,
                'status' => 'published',
                'title' => 'Sample Try Out',
            ]);
    }
}
