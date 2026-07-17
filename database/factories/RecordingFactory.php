<?php

namespace Database\Factories;

use App\Models\Recording;
use App\Models\Schedule;
use App\Models\ZoomAccount;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Recording>
 */
class RecordingFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $zoomAccount = ZoomAccount::factory()->create();
        $zoomMeetingId = fake()->unique()->numerify('##########');
        $booking = Schedule::factory()->create([
            'zoom_account_id' => $zoomAccount->id,
            'zoom_link' => "https://zoom.us/j/{$zoomMeetingId}",
            'zoom_meeting_id' => $zoomMeetingId,
        ]);
        $youtubeVideoId = fake()->unique()->regexify('[A-Za-z0-9_-]{11}');

        return [
            'schedule_id' => $booking->id,
            'user_id' => $booking->user_id,
            'zoom_account_id' => $zoomAccount->id,
            'zoom_meeting_id' => $zoomMeetingId,
            'zoom_meeting_uuid' => fake()->uuid(),
            'zoom_recording_file_id' => fake()->unique()->uuid(),
            'youtube_video_id' => $youtubeVideoId,
            'youtube_url' => "https://www.youtube.com/watch?v={$youtubeVideoId}",
            'title' => fake()->sentence(4),
            'recorded_at' => fake()->dateTimeBetween('-1 month', 'now'),
            'duration' => fake()->numberBetween(30, 120),
            'metadata' => [],
        ];
    }
}
