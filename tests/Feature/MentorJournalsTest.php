<?php

namespace Tests\Feature;

use App\Models\MentorJournal;
use App\Models\Schedule;
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
        $session = Schedule::factory()->create([
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
            'schedule_id' => $session->id,
            'student_id' => $student->id,
            'subject_id' => $subject->id,
        ]);
        $this->assertDatabaseHas('schedules', [
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
        $session = Schedule::factory()->create([
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
            'schedule_id' => $session->id,
            'slug' => 'ielts-writing-alya-safira',
            'student_id' => $student->id,
            'subject_id' => $subject->id,
        ]);

        $this->actingAs($admin)
            ->get(route('monitoring.mentor-journals'))
            ->assertOk()
            ->assertInertia(fn (Assert $page): Assert => $page
                ->component('admin/monitoring/mentor-journals/index')
                ->where('journals.0.mentor', 'Nadia Putri')
                ->where('journals.0.student', 'Alya Safira')
                ->where('journals.0.sessionName', 'IELTS Writing')
                ->where('journals.0.duration', '90 min')
            );

        $this->actingAs($admin)
            ->get(route('monitoring.mentor-journals.show', $journal))
            ->assertOk()
            ->assertInertia(fn (Assert $page): Assert => $page
                ->component('admin/monitoring/mentor-journals/show')
                ->where('journal.achievement', 'Clearer paragraph flow.')
                ->where('journal.nextImprovementPlan', 'Practice evidence mapping.')
            );
    }

    public function test_mentor_can_view_own_journal_page(): void
    {
        $mentor = User::factory()->mentor()->create();
        $otherMentor = User::factory()->mentor()->create();
        $student = User::factory()->student()->create([
            'name' => 'Alya Safira',
        ]);
        $subject = Subject::factory()->create([
            'name' => 'IELTS Writing',
        ]);
        $session = Schedule::factory()->create([
            'duration' => 90,
            'mentor_id' => $mentor->id,
            'scheduled_at' => '2026-06-09 10:00:00',
            'status' => 'completed',
            'subject_id' => $subject->id,
            'user_id' => $student->id,
        ]);
        $journal = MentorJournal::factory()->create([
            'mentor_id' => $mentor->id,
            'next_improvement_plan' => 'Practice evidence mapping.',
            'schedule_id' => $session->id,
            'student_id' => $student->id,
            'subject_id' => $subject->id,
        ]);
        MentorJournal::factory()->create([
            'mentor_id' => $otherMentor->id,
        ]);

        $this->actingAs($mentor)
            ->get(route('mentor.journals'))
            ->assertOk()
            ->assertInertia(fn (Assert $page): Assert => $page
                ->component('mentor/journals/index')
                ->has('journals', 1)
                ->where('journals.0.id', (string) $journal->id)
                ->where('journals.0.student', 'Alya Safira')
                ->where('journals.0.sessionName', 'IELTS Writing')
                ->where('journals.0.duration', '90 min')
                ->where('journals.0.nextImprovementPlan', 'Practice evidence mapping.')
            );
    }

    public function test_mentor_can_view_own_journal_detail(): void
    {
        $mentor = User::factory()->mentor()->create();
        $student = User::factory()->student()->create([
            'name' => 'Alya Safira',
        ]);
        $subject = Subject::factory()->create([
            'name' => 'IELTS Writing',
        ]);
        $session = Schedule::factory()->create([
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
            'schedule_id' => $session->id,
            'slug' => 'ielts-writing-alya-safira',
            'student_id' => $student->id,
            'subject_id' => $subject->id,
        ]);

        $this->actingAs($mentor)
            ->get(route('mentor.journals.show', $journal))
            ->assertOk()
            ->assertInertia(fn (Assert $page): Assert => $page
                ->component('mentor/journals/show')
                ->where('journal.student', 'Alya Safira')
                ->where('journal.sessionName', 'IELTS Writing')
                ->where('journal.date', 'Tuesday, 09 June 2026')
                ->where('journal.time', '10:00 - 11:30')
                ->where('journal.achievement', 'Clearer paragraph flow.')
                ->where('journal.nextImprovementPlan', 'Practice evidence mapping.')
            );
    }

    public function test_mentor_cannot_view_another_mentor_journal_detail(): void
    {
        $mentor = User::factory()->mentor()->create();
        $otherMentor = User::factory()->mentor()->create();
        $journal = MentorJournal::factory()->create([
            'mentor_id' => $otherMentor->id,
        ]);

        $this->actingAs($mentor)
            ->get(route('mentor.journals.show', $journal))
            ->assertNotFound();
    }

    public function test_students_cannot_visit_mentor_journal_page(): void
    {
        $student = User::factory()->student()->create();

        $this->actingAs($student)
            ->get(route('mentor.journals'))
            ->assertForbidden();
    }

    public function test_old_mentor_journal_url_redirects_to_short_url(): void
    {
        $mentor = User::factory()->mentor()->create();

        $this->actingAs($mentor)
            ->get('/mentor/journals')
            ->assertRedirect('/journals');
    }

    public function test_dashboard_shows_next_session_after_pending_session_is_completed(): void
    {
        $mentor = User::factory()->mentor()->create();
        $student = User::factory()->student()->create();
        $subject = Subject::factory()->create([
            'name' => 'Speaking',
        ]);
        $pendingSession = Schedule::factory()->create([
            'mentor_id' => $mentor->id,
            'scheduled_at' => now()->subMinutes(30),
            'status' => 'assigned',
            'subject_id' => $subject->id,
            'user_id' => $student->id,
        ]);
        Schedule::factory()->create([
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
                ->component('mentor/dashboard/index')
                ->where('completionSession.id', (string) $pendingSession->id)
                ->where('nextSessions.0.title', 'Speaking')
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
                ->component('mentor/dashboard/index')
                ->where('completionSession', null)
                ->where('nextSessions.0.title', 'Speaking')
                ->where('nextSessions.0.improvementPlan', 'Practice two timed prompts.')
            );
    }
}
