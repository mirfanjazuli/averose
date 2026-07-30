<?php

namespace Tests\Feature;

use App\Models\AcademicField;
use App\Models\MentorJournal;
use App\Models\Program;
use App\Models\ProgramEnrollment;
use App\Models\ProgramVariant;
use App\Models\Schedule;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class MentorDashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_to_the_login_page(): void
    {
        $response = $this->get(route('dashboard'));

        $response->assertRedirect(route('login'));
    }

    public function test_mentors_can_visit_their_dashboard_through_the_shared_dashboard_url(): void
    {
        $user = User::factory()->mentor()->create();

        $this->actingAs($user)
            ->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('mentor/dashboard/index')
                ->where('auth.user.role', 'mentor')
            );
    }

    public function test_mentor_dashboard_receives_database_sessions(): void
    {
        $this->travelTo('2026-07-10 09:00:00');

        $mentor = User::factory()->mentor()->create();
        $student = User::factory()->student()->create([
            'name' => 'Alya Prameswari',
        ]);
        $field = AcademicField::factory()->create();
        $subject = Subject::factory()->create([
            'name' => 'IELTS Speaking',
        ]);
        $program = Program::factory()->create([
            'name' => 'IELTS Intensive',
        ]);
        $variant = ProgramVariant::factory()->create([
            'field_id' => $field->id,
        ]);
        $enrollment = ProgramEnrollment::factory()->for($student)->create([
            'field_id' => $field->id,
            'program_id' => $program->id,
            'program_variant_id' => $variant->id,
        ]);

        Schedule::factory()->create([
            'duration' => 90,
            'mentor_id' => $mentor->id,
            'program_enrollment_id' => $enrollment->id,
            'scheduled_at' => now()->setTime(10, 0),
            'status' => 'assigned',
            'subject_id' => $subject->id,
            'user_id' => $student->id,
            'zoom_link' => 'https://zoom.test/j/mentor',
        ]);

        $this->actingAs($mentor)
            ->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn (Assert $page): Assert => $page
                ->component('mentor/dashboard/index')
                ->has('stats', 3)
                ->where('stats.0.label', 'Today')
                ->where('stats.0.value', '1')
                ->where('stats.1.label', 'Upcoming')
                ->where('stats.1.value', '1')
                ->where('nextSessions.0.title', 'IELTS Speaking')
                ->where('nextSessions.0.program', 'IELTS Intensive')
                ->missing('completionSession')
                ->missing('todaySessions')
            );
    }

    public function test_mentor_dashboard_shows_two_oldest_pending_journals(): void
    {
        $this->travelTo('2026-07-10 12:00:00');

        $mentor = User::factory()->mentor()->create();
        $oldestSession = Schedule::factory()->create([
            'mentor_id' => $mentor->id,
            'scheduled_at' => now()->subDays(3),
            'status' => 'assigned',
        ]);
        $secondOldestSession = Schedule::factory()->create([
            'mentor_id' => $mentor->id,
            'scheduled_at' => now()->subDays(2),
            'status' => 'rescheduled',
        ]);
        Schedule::factory()->create([
            'mentor_id' => $mentor->id,
            'scheduled_at' => now()->subDay(),
            'status' => 'assigned',
        ]);

        $this->actingAs($mentor)
            ->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn (Assert $page): Assert => $page
                ->component('mentor/dashboard/index')
                ->has('pendingJournals', 2)
                ->where('pendingJournals.0.id', (string) $oldestSession->id)
                ->where('pendingJournals.1.id', (string) $secondOldestSession->id)
            );
    }

    public function test_the_old_mentor_dashboard_url_is_not_registered(): void
    {
        $this->get('/mentor/dashboard')->assertNotFound();
    }

    public function test_mentor_dashboard_limits_recent_journals_to_five(): void
    {
        $mentor = User::factory()->mentor()->create();

        MentorJournal::factory()->count(6)->create([
            'mentor_id' => $mentor->id,
        ]);

        $this->actingAs($mentor)
            ->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn (Assert $page): Assert => $page
                ->component('mentor/dashboard/index')
                ->has('recentJournals', 5)
                ->missing('recentJournals.0.improvementPlan')
                ->missing('recentJournals.0.note')
            );
    }
}
