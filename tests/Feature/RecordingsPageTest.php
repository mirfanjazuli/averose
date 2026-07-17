<?php

namespace Tests\Feature;

use App\Models\ProgramEnrollment;
use App\Models\Recording;
use App\Models\Schedule;
use App\Models\Subject;
use App\Models\User;
use App\Models\ZoomAccount;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class RecordingsPageTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_view_recordings_page(): void
    {
        $admin = User::factory()->admin()->create();
        [$student, $booking, $account] = $this->scheduleFixture();
        Recording::query()->create([
            'recorded_at' => '2026-06-25',
            'schedule_id' => $booking->id,
            'title' => 'IELTS Speaking Recording',
            'user_id' => $student->id,
            'youtube_url' => 'https://www.youtube.com/watch?v=abc123DEF45',
            'youtube_video_id' => 'abc123DEF45',
            'zoom_account_id' => $account->id,
            'zoom_meeting_id' => '987654321',
        ]);

        $this->actingAs($admin)
            ->get(route('monitoring.recordings'))
            ->assertOk()
            ->assertInertia(fn (Assert $page): Assert => $page
                ->component('admin/monitoring/recordings/index')
                ->where('recordings.0.title', 'IELTS Speaking Recording')
                ->where('recordings.0.status', 'Active')
                ->where('recordings.0.student', $student->name)
                ->where('sessionOptions.0.id', (string) $booking->id)
            );
    }

    public function test_student_can_only_view_their_recordings_page(): void
    {
        [$student, $booking, $account] = $this->scheduleFixture();
        [$otherStudent, $otherBooking, $otherAccount] = $this->scheduleFixture();
        Recording::query()->create([
            'recorded_at' => '2026-06-25',
            'schedule_id' => $booking->id,
            'title' => 'Visible Recording',
            'user_id' => $student->id,
            'youtube_url' => 'https://www.youtube.com/watch?v=visible123',
            'youtube_video_id' => 'visible123',
            'zoom_account_id' => $account->id,
            'zoom_meeting_id' => '987654321',
        ]);
        Recording::query()->create([
            'recorded_at' => '2026-06-25',
            'schedule_id' => $booking->id,
            'status' => 'inactive',
            'title' => 'Inactive Recording',
            'user_id' => $student->id,
            'youtube_url' => 'https://www.youtube.com/watch?v=inactive123',
            'youtube_video_id' => 'inactive123',
            'zoom_account_id' => $account->id,
            'zoom_meeting_id' => '987654321',
        ]);
        Recording::query()->create([
            'recorded_at' => '2026-06-25',
            'schedule_id' => $otherBooking->id,
            'title' => 'Hidden Recording',
            'user_id' => $otherStudent->id,
            'youtube_url' => 'https://www.youtube.com/watch?v=hidden123',
            'youtube_video_id' => 'hidden123',
            'zoom_account_id' => $otherAccount->id,
            'zoom_meeting_id' => '987654321',
        ]);

        $this->actingAs($student)
            ->get(route('student.recordings'))
            ->assertOk()
            ->assertInertia(fn (Assert $page): Assert => $page
                ->component('student/recordings/index')
                ->where('recordings.0.title', 'Visible Recording')
                ->missing('recordings.1')
            );
    }

    public function test_admin_can_deactivate_recording(): void
    {
        $admin = User::factory()->admin()->create();
        [$student, $booking, $account] = $this->scheduleFixture();
        $recording = Recording::query()->create([
            'recorded_at' => '2026-06-25',
            'schedule_id' => $booking->id,
            'title' => 'Recording to Deactivate',
            'user_id' => $student->id,
            'youtube_url' => 'https://www.youtube.com/watch?v=deactivate123',
            'youtube_video_id' => 'deactivate123',
            'zoom_account_id' => $account->id,
            'zoom_meeting_id' => '987654321',
        ]);

        $this->actingAs($admin)
            ->delete(route('monitoring.recordings.destroy', $recording))
            ->assertRedirect();

        $this->assertDatabaseHas('recordings', [
            'id' => $recording->id,
            'status' => 'inactive',
        ]);
    }

    public function test_admin_can_add_manual_youtube_recording(): void
    {
        $admin = User::factory()->admin()->create();
        [$student, $booking, $account] = $this->scheduleFixture();

        $this->actingAs($admin)
            ->post(route('monitoring.recordings.store'), [
                'recorded_at' => '2026-06-25',
                'schedule_id' => $booking->id,
                'title' => 'Manual IELTS Recording',
                'youtube_url' => 'https://www.youtube.com/watch?v=manual12345',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('recordings', [
            'schedule_id' => $booking->id,
            'title' => 'Manual IELTS Recording',
            'user_id' => $student->id,
            'youtube_url' => 'https://www.youtube.com/watch?v=manual12345',
            'youtube_video_id' => 'manual12345',
            'zoom_account_id' => $account->id,
            'zoom_meeting_id' => '987654321',
            'status' => 'active',
        ]);
    }

    public function test_student_cannot_add_manual_recording(): void
    {
        [$student, $booking] = $this->scheduleFixture();

        $this->actingAs($student)
            ->post(route('monitoring.recordings.store'), [
                'schedule_id' => $booking->id,
                'youtube_url' => 'https://www.youtube.com/watch?v=manual12345',
            ])
            ->assertForbidden();
    }

    private function scheduleFixture(): array
    {
        $student = User::factory()->student()->create();
        $mentor = User::factory()->mentor()->create();
        $account = ZoomAccount::factory()->create();
        $subject = Subject::factory()->create([
            'name' => 'IELTS Speaking',
        ]);
        $enrollment = ProgramEnrollment::factory()->create([
            'user_id' => $student->id,
        ]);
        $booking = Schedule::factory()->create([
            'mentor_id' => $mentor->id,
            'program_enrollment_id' => $enrollment->id,
            'scheduled_at' => '2026-06-25 13:00:00',
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
