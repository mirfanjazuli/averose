<?php

namespace Tests\Feature;

use App\Models\AcademicField;
use App\Models\Program;
use App\Models\ProgramVariant;
use App\Models\SessionBooking;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class StudentEnrollmentsTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_from_enrollments_page(): void
    {
        $this->get(route('enrollments'))
            ->assertRedirect(route('login'));
    }

    public function test_student_can_visit_enrollments_page(): void
    {
        $student = User::factory()->student()->create();
        $field = AcademicField::factory()->create([
            'name' => 'Design',
        ]);
        $program = Program::factory()->create([
            'name' => 'UI Design',
            'max_reschedule' => 3,
        ]);
        $variant = ProgramVariant::factory()->create([
            'field_id' => $field->id,
            'name' => '6 x 90 Minutes',
            'duration' => 90,
            'session' => 6,
        ]);

        $student->programEnrollments()->create([
            'program_id' => $program->id,
            'field_id' => $field->id,
            'program_variant_id' => $variant->id,
            'start_date' => '2026-07-01',
            'status' => 'active',
        ]);

        $this->actingAs($student)
            ->get(route('enrollments'))
            ->assertOk()
            ->assertInertia(fn (Assert $page): Assert => $page
                ->component('student/enrollments')
                ->where('enrollments.0.program', 'UI Design')
                ->where('enrollments.0.field', 'Design')
                ->where('enrollments.0.variant', '6 x 90 Minutes')
                ->where('enrollments.0.maxReschedule', 3)
            );
    }

    public function test_student_schedules_receive_enrolled_subject_options(): void
    {
        $student = User::factory()->student()->create();
        $field = AcademicField::factory()->create();
        $subject = Subject::factory()->create([
            'name' => 'IELTS Speaking',
        ]);
        $program = Program::factory()->create();
        $variant = ProgramVariant::factory()->create([
            'field_id' => $field->id,
            'duration' => 90,
        ]);

        $program->subjects()->attach($subject);
        $enrollment = $student->programEnrollments()->create([
            'program_id' => $program->id,
            'field_id' => $field->id,
            'program_variant_id' => $variant->id,
            'start_date' => '2026-07-01',
            'sessions_used' => 2,
            'status' => 'active',
        ]);

        $this->actingAs($student)
            ->get(route('schedules'))
            ->assertOk()
            ->assertInertia(fn (Assert $page): Assert => $page
                ->component('student/schedules')
                ->where('subjects.0.label', 'IELTS Speaking')
                ->where('subjects.0.duration', 90)
                ->where('subjects.0.enrollmentId', (string) $enrollment->id)
                ->where('subjects.0.subjectId', (string) $subject->id)
                ->where('subjects.0.sessionsRemaining', $variant->session - 2)
            );
    }

    public function test_student_schedules_receive_database_sessions(): void
    {
        $student = User::factory()->student()->create();
        $field = AcademicField::factory()->create();
        $subject = Subject::factory()->create([
            'name' => 'Reading Drill',
        ]);
        $program = Program::factory()->create([
            'name' => 'TOEFL Prep',
        ]);
        $variant = ProgramVariant::factory()->create([
            'field_id' => $field->id,
        ]);
        $program->subjects()->attach($subject);
        $enrollment = $student->programEnrollments()->create([
            'program_id' => $program->id,
            'field_id' => $field->id,
            'program_variant_id' => $variant->id,
            'start_date' => '2026-07-01',
            'status' => 'active',
        ]);

        SessionBooking::factory()->create([
            'user_id' => $student->id,
            'program_enrollment_id' => $enrollment->id,
            'subject_id' => $subject->id,
            'scheduled_at' => '2026-07-10 13:15:00',
            'duration' => 90,
            'status' => 'assigned',
        ]);

        $this->actingAs($student)
            ->get(route('schedules'))
            ->assertOk()
            ->assertInertia(fn (Assert $page): Assert => $page
                ->component('student/schedules')
                ->where('sessions.0.title', 'Reading Drill')
                ->where('sessions.0.program', 'TOEFL Prep')
                ->where('sessions.0.status', 'Assigned')
            );
    }
}
