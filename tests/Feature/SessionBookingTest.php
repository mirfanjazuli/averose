<?php

namespace Tests\Feature;

use App\Models\AcademicField;
use App\Models\Program;
use App\Models\ProgramEnrollment;
use App\Models\ProgramVariant;
use App\Models\Subject;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SessionBookingTest extends TestCase
{
    use RefreshDatabase;

    public function test_student_can_book_a_session_and_use_one_session_credit(): void
    {
        CarbonImmutable::setTestNow('2026-06-06 15:00:00');
        [$student, $enrollment, $subject] = $this->bookingFixture(sessionCount: 6, sessionsUsed: 2);

        $this->actingAs($student)
            ->post(route('session-bookings.store'), [
                'program_enrollment_id' => $enrollment->id,
                'subject_id' => $subject->id,
                'date' => '2026-06-06',
                'time' => '20:00',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('session_bookings', [
            'user_id' => $student->id,
            'program_enrollment_id' => $enrollment->id,
            'subject_id' => $subject->id,
            'duration' => 90,
            'status' => 'pending',
        ]);
        $this->assertSame(3, $enrollment->refresh()->sessions_used);

        CarbonImmutable::setTestNow();
    }

    public function test_student_can_book_less_than_five_hours_from_now(): void
    {
        CarbonImmutable::setTestNow('2026-06-06 15:00:00');
        [$student, $enrollment, $subject] = $this->bookingFixture();

        $this->actingAs($student)
            ->post(route('session-bookings.store'), [
                'program_enrollment_id' => $enrollment->id,
                'subject_id' => $subject->id,
                'date' => '2026-06-06',
                'time' => '19:59',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('session_bookings', [
            'user_id' => $student->id,
            'program_enrollment_id' => $enrollment->id,
            'subject_id' => $subject->id,
            'status' => 'pending',
        ]);
        $this->assertSame(1, $enrollment->refresh()->sessions_used);

        CarbonImmutable::setTestNow();
    }

    public function test_student_cannot_book_without_remaining_sessions(): void
    {
        CarbonImmutable::setTestNow('2026-06-06 15:00:00');
        [$student, $enrollment, $subject] = $this->bookingFixture(sessionCount: 2, sessionsUsed: 2);

        $this->actingAs($student)
            ->post(route('session-bookings.store'), [
                'program_enrollment_id' => $enrollment->id,
                'subject_id' => $subject->id,
                'date' => '2026-06-07',
                'time' => '09:30',
            ])
            ->assertSessionHasErrors('subject_id');

        $this->assertDatabaseCount('session_bookings', 0);
        $this->assertSame(2, $enrollment->refresh()->sessions_used);

        CarbonImmutable::setTestNow();
    }

    /**
     * @return array{0: User, 1: ProgramEnrollment, 2: Subject}
     */
    private function bookingFixture(int $sessionCount = 6, int $sessionsUsed = 0): array
    {
        $student = User::factory()->student()->create();
        $field = AcademicField::factory()->create();
        $subject = Subject::factory()->create();
        $program = Program::factory()->create();
        $variant = ProgramVariant::factory()->create([
            'field_id' => $field->id,
            'duration' => 90,
            'session' => $sessionCount,
        ]);

        $program->subjects()->attach($subject);
        $enrollment = ProgramEnrollment::factory()->for($student)->create([
            'program_id' => $program->id,
            'field_id' => $field->id,
            'program_variant_id' => $variant->id,
            'sessions_used' => $sessionsUsed,
        ]);

        return [$student, $enrollment, $subject];
    }
}
