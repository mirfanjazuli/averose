<?php

namespace Tests\Feature;

use App\Models\ProgramEnrollment;
use App\Models\SessionBooking;
use App\Models\Subject;
use App\Models\User;
use App\Models\ZoomAccount;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class N8nRecordingIntegrationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config(['services.n8n.webhook_token' => 'n8n-secret']);
    }

    public function test_n8n_can_fetch_zoom_account_config_from_system(): void
    {
        $account = ZoomAccount::factory()->create([
            'account_id' => 'zoom-account-id',
            'name' => 'Main Zoom',
            'token_secret' => 'zoom-event-secret',
        ]);

        $this->withHeader('X-N8N-Token', 'n8n-secret')
            ->getJson(route('n8n.zoom-accounts.show', $account))
            ->assertOk()
            ->assertJson([
                'accountId' => 'zoom-account-id',
                'appKey' => $account->slug,
                'enabled' => true,
                'name' => 'Main Zoom',
                'secretToken' => 'zoom-event-secret',
            ]);
    }

    public function test_n8n_requires_a_valid_token(): void
    {
        $account = ZoomAccount::factory()->create();

        $this->getJson(route('n8n.zoom-accounts.show', $account))
            ->assertUnauthorized();
    }

    public function test_n8n_can_store_youtube_recording_for_matching_zoom_meeting(): void
    {
        [$student, $booking, $account] = $this->bookingFixture();

        $this->withHeader('X-N8N-Token', 'n8n-secret')
            ->postJson(route('n8n.youtube-recordings.store'), [
                'account_id' => $account->account_id,
                'app_key' => $account->slug,
                'duration' => 61,
                'meeting_id' => '987654321',
                'meeting_uuid' => 'zoom-meeting-uuid',
                'recording_file_id' => 'zoom-recording-file-id',
                'recording_type' => 'shared_screen_with_speaker_view',
                'start_time' => '2026-06-18T10:00:00Z',
                'title' => 'IELTS Speaking - 2026-06-18',
                'youtube_url' => 'https://www.youtube.com/watch?v=abc123DEF45',
                'youtube_video_id' => 'abc123DEF45',
            ])
            ->assertOk()
            ->assertJson(['status' => 'created']);

        $this->assertDatabaseHas('session_recordings', [
            'session_booking_id' => $booking->id,
            'user_id' => $student->id,
            'youtube_video_id' => 'abc123DEF45',
            'zoom_account_id' => $account->id,
            'zoom_meeting_id' => '987654321',
        ]);

        $this->actingAs($student)
            ->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn (Assert $page): Assert => $page
                ->component('student/dashboard')
                ->where('recordings.0.title', 'IELTS Speaking - 2026-06-18')
                ->where('recordings.0.youtubeUrl', 'https://www.youtube.com/watch?v=abc123DEF45')
                ->where('recordings.0.youtubeEmbedUrl', 'https://www.youtube-nocookie.com/embed/abc123DEF45')
            );
    }

    public function test_n8n_rejects_recording_when_zoom_meeting_does_not_match_a_booking(): void
    {
        $account = ZoomAccount::factory()->create();

        $this->withHeader('X-N8N-Token', 'n8n-secret')
            ->postJson(route('n8n.youtube-recordings.store'), [
                'account_id' => $account->account_id,
                'app_key' => $account->slug,
                'meeting_id' => 'missing-meeting',
                'youtube_video_id' => 'abc123DEF45',
            ])
            ->assertUnprocessable();
    }

    private function bookingFixture(): array
    {
        $student = User::factory()->student()->create();
        $account = ZoomAccount::factory()->create([
            'account_id' => 'zoom-account-id',
        ]);
        $subject = Subject::factory()->create([
            'name' => 'IELTS Speaking',
        ]);
        $enrollment = ProgramEnrollment::factory()->create([
            'user_id' => $student->id,
        ]);
        $booking = SessionBooking::factory()->create([
            'program_enrollment_id' => $enrollment->id,
            'scheduled_at' => '2026-06-18 17:00:00',
            'status' => 'completed',
            'subject_id' => $subject->id,
            'user_id' => $student->id,
            'zoom_account_id' => $account->id,
            'zoom_link' => 'https://zoom.test/j/987654321',
            'zoom_meeting_id' => '987654321',
        ]);

        return [$student, $booking, $account];
    }
}
