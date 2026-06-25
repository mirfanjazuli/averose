<?php

namespace Tests\Feature;

use App\Models\MentorJournal;
use App\Models\SessionBooking;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class MentorJournalsTest extends TestCase
{
    use RefreshDatabase;

    public function test_mentor_can_complete_session_and_create_journal(): void
    {
        $mentor = User::factory()->mentor()->create();
        $student = User::factory()->student()->create([
            'name' => 'Alya Safira',
        ]);
        $subject = Subject::factory()->create([
            'name' => 'IELTS Writing',
        ]);
        $session = SessionBooking::factory()->create([
            'mentor_id' => $mentor->id,
            'scheduled_at' => now()->subHour(),
            'status' => 'assigned',
            'subject_id' => $subject->id,
            'user_id' => $student->id,
        ]);

        $this->actingAs($mentor)
            ->post(route('mentor.sessions.complete', $session), [
                'achievement' => 'Student wrote a clear thesis statement.',
                'improvement_area' => 'Develop stronger supporting examples.',
                'next_improvement_plan' => 'Draft one essay outline before the next session.',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('mentor_journals', [
            'achievement' => 'Student wrote a clear thesis statement.',
            'improvement_area' => 'Develop stronger supporting examples.',
            'mentor_id' => $mentor->id,
            'next_improvement_plan' => 'Draft one essay outline before the next session.',
            'note' => 'completed',
            'session_booking_id' => $session->id,
            'student_id' => $student->id,
            'subject_id' => $subject->id,
        ]);
        $this->assertDatabaseHas('session_bookings', [
            'id' => $session->id,
            'status' => 'completed',
        ]);
    }

    public function test_admin_can_view_journal_list_and_detail_from_database(): void
    {
        $admin = User::factory()->admin()->create();
        $mentor = User::factory()->mentor()->create([
            'name' => 'Nadia Putri',
        ]);
        $student = User::factory()->student()->create([
            'name' => 'Alya Safira',
        ]);
        $subject = Subject::factory()->create([
            'name' => 'IELTS Writing',
        ]);
        $session = SessionBooking::factory()->create([
            'duration' => 90,
            'mentor_id' => $mentor->id,
            'scheduled_at' => '2026-06-09 10:00:00',
            'status' => 'completed',
            'subject_id' => $subject->id,
            'user_id' => $student->id,
        ]);
        $journal = MentorJournal::factory()->create([
            'achievement' => 'Clearer paragraph flow.',
            'improvement_area' => 'Needs stronger examples.',
            'mentor_id' => $mentor->id,
            'next_improvement_plan' => 'Practice evidence mapping.',
            'session_booking_id' => $session->id,
            'slug' => 'ielts-writing-alya-safira',
            'student_id' => $student->id,
            'subject_id' => $subject->id,
        ]);

        $this->actingAs($admin)
            ->get(route('monitoring.mentor-journals'))
            ->assertOk()
            ->assertInertia(fn (Assert $page): Assert => $page
                ->component('admin/monitoring/mentor-journals')
                ->where('journals.0.mentor', 'Nadia Putri')
                ->where('journals.0.student', 'Alya Safira')
                ->where('journals.0.sessionName', 'IELTS Writing')
                ->where('journals.0.duration', '90 min')
            );

        $this->actingAs($admin)
            ->get(route('monitoring.mentor-journals.show', $journal))
            ->assertOk()
            ->assertInertia(fn (Assert $page): Assert => $page
                ->component('admin/monitoring/mentor-journal-detail')
                ->where('journal.achievement', 'Clearer paragraph flow.')
                ->where('journal.nextImprovementPlan', 'Practice evidence mapping.')
            );
    }

    public function test_dashboard_shows_next_session_after_pending_session_is_completed(): void
    {
        $mentor = User::factory()->mentor()->create();
        $student = User::factory()->student()->create();
        $subject = Subject::factory()->create([
            'name' => 'Speaking',
        ]);
        $pendingSession = SessionBooking::factory()->create([
            'mentor_id' => $mentor->id,
            'scheduled_at' => now()->subMinutes(30),
            'status' => 'assigned',
            'subject_id' => $subject->id,
            'user_id' => $student->id,
        ]);
        SessionBooking::factory()->create([
            'mentor_id' => $mentor->id,
            'scheduled_at' => now()->addHour(),
            'status' => 'assigned',
            'subject_id' => $subject->id,
            'user_id' => $student->id,
        ]);

        $this->actingAs($mentor)
            ->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn (Assert $page): Assert => $page
                ->component('mentor/dashboard')
                ->where('completionSession.id', (string) $pendingSession->id)
                ->where('nextSession.title', 'Speaking')
            );

        $this->actingAs($mentor)
            ->post(route('mentor.sessions.complete', $pendingSession), [
                'achievement' => 'Student completed speaking drill.',
                'improvement_area' => 'Needs clearer pacing.',
                'next_improvement_plan' => 'Practice two timed prompts.',
            ])
            ->assertRedirect();

        $this->actingAs($mentor)
            ->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn (Assert $page): Assert => $page
                ->component('mentor/dashboard')
                ->where('completionSession', null)
                ->where('nextSession.title', 'Speaking')
                ->where('nextSession.improvementPlan', 'Practice two timed prompts.')
            );
    }
}
