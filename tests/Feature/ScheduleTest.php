<?php

namespace Tests\Feature;

use App\Models\AcademicField;
use App\Models\Program;
use App\Models\ProgramEnrollment;
use App\Models\ProgramVariant;
use App\Models\PublicHoliday;
use App\Models\Schedule;
use App\Models\Subject;
use App\Models\User;
use App\Models\WorkingHour;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ScheduleTest extends TestCase
{
    use RefreshDatabase;

    public function test_student_can_book_a_session_and_use_one_session_credit(): void
    {
        CarbonImmutable::setTestNow('2026-06-06 15:00:00');
        [$student, $enrollment, $subject] = $this->scheduleFixture(sessionCount: 6, sessionsUsed: 2);

        $this->actingAs($student)
            ->post(route('schedules.store'), [
                'program_enrollment_id' => $enrollment->id,
                'subject_id' => $subject->id,
                'date' => '2026-06-06',
                'time' => '20:00',
                'timezone' => 'Asia/Jakarta',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('schedules', [
            'user_id' => $student->id,
            'program_enrollment_id' => $enrollment->id,
            'subject_id' => $subject->id,
            'duration' => 90,
            'status' => 'pending',
            'timezone' => 'Asia/Jakarta',
        ]);
        $this->assertSame(3, $enrollment->refresh()->sessions_used);

        CarbonImmutable::setTestNow();
    }

    public function test_booking_uses_the_explicit_iana_timezone_and_stores_utc(): void
    {
        CarbonImmutable::setTestNow('2026-06-06 00:00:00');
        [$student, $enrollment, $subject] = $this->scheduleFixture();

        $this->actingAs($student)
            ->post(route('schedules.store'), [
                'date' => '2026-06-07',
                'program_enrollment_id' => $enrollment->id,
                'subject_id' => $subject->id,
                'time' => '10:00',
                'timezone' => 'Asia/Makassar',
            ])
            ->assertRedirect()
            ->assertSessionDoesntHaveErrors();

        $this->assertDatabaseHas('schedules', [
            'scheduled_at' => '2026-06-07 02:00:00',
            'timezone' => 'Asia/Makassar',
            'user_id' => $student->id,
        ]);

        CarbonImmutable::setTestNow();
    }

    public function test_student_can_book_less_than_five_hours_from_now(): void
    {
        CarbonImmutable::setTestNow('2026-06-06 15:00:00');
        [$student, $enrollment, $subject] = $this->scheduleFixture();

        $this->actingAs($student)
            ->post(route('schedules.store'), [
                'program_enrollment_id' => $enrollment->id,
                'subject_id' => $subject->id,
                'date' => '2026-06-06',
                'time' => '19:59',
                'timezone' => 'Asia/Jakarta',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('schedules', [
            'user_id' => $student->id,
            'program_enrollment_id' => $enrollment->id,
            'subject_id' => $subject->id,
            'status' => 'pending',
        ]);
        $this->assertSame(1, $enrollment->refresh()->sessions_used);

        CarbonImmutable::setTestNow();
    }

    public function test_student_can_book_multiple_sessions_at_once(): void
    {
        CarbonImmutable::setTestNow('2026-06-06 15:00:00');
        [$student, $enrollment, $subject] = $this->scheduleFixture(sessionCount: 6, sessionsUsed: 2);

        $this->actingAs($student)
            ->post(route('schedules.store'), [
                'program_enrollment_id' => $enrollment->id,
                'subject_id' => $subject->id,
                'dates' => [
                    '2026-06-07',
                    '2026-06-08',
                    '2026-06-09',
                ],
                'time' => '20:00',
                'timezone' => 'Asia/Jakarta',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('schedules', [
            'user_id' => $student->id,
            'program_enrollment_id' => $enrollment->id,
            'subject_id' => $subject->id,
            'scheduled_at' => '2026-06-07 13:00:00',
            'duration' => 90,
            'status' => 'pending',
        ]);
        $this->assertDatabaseHas('schedules', [
            'user_id' => $student->id,
            'program_enrollment_id' => $enrollment->id,
            'subject_id' => $subject->id,
            'scheduled_at' => '2026-06-08 13:00:00',
        ]);
        $this->assertDatabaseHas('schedules', [
            'user_id' => $student->id,
            'program_enrollment_id' => $enrollment->id,
            'subject_id' => $subject->id,
            'scheduled_at' => '2026-06-09 13:00:00',
        ]);
        $this->assertSame(5, $enrollment->refresh()->sessions_used);

        CarbonImmutable::setTestNow();
    }

    public function test_student_can_book_multiple_session_rows_at_once(): void
    {
        CarbonImmutable::setTestNow('2026-06-06 15:00:00');
        [$student, $enrollment, $subject] = $this->scheduleFixture(sessionCount: 6, sessionsUsed: 2);

        $this->actingAs($student)
            ->post(route('schedules.store'), [
                'sessions' => [
                    [
                        'program_enrollment_id' => $enrollment->id,
                        'subject_id' => $subject->id,
                        'date' => '2026-06-07',
                        'time' => '18:00',
                    ],
                    [
                        'program_enrollment_id' => $enrollment->id,
                        'subject_id' => $subject->id,
                        'date' => '2026-06-08',
                        'time' => '20:00',
                    ],
                ],
                'timezone' => 'Asia/Jakarta',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('schedules', [
            'user_id' => $student->id,
            'program_enrollment_id' => $enrollment->id,
            'subject_id' => $subject->id,
            'scheduled_at' => '2026-06-07 11:00:00',
            'duration' => 90,
            'status' => 'pending',
        ]);
        $this->assertDatabaseHas('schedules', [
            'user_id' => $student->id,
            'program_enrollment_id' => $enrollment->id,
            'subject_id' => $subject->id,
            'scheduled_at' => '2026-06-08 13:00:00',
            'duration' => 90,
            'status' => 'pending',
        ]);
        $this->assertSame(4, $enrollment->refresh()->sessions_used);

        CarbonImmutable::setTestNow();
    }

    public function test_student_can_edit_a_pending_session_schedule_without_using_another_credit(): void
    {
        [$student, $enrollment, $subject] = $this->scheduleFixture(sessionCount: 6, sessionsUsed: 1);
        $booking = Schedule::factory()->create([
            'program_enrollment_id' => $enrollment->id,
            'scheduled_at' => '2026-06-07 18:00:00',
            'status' => 'pending',
            'subject_id' => $subject->id,
            'user_id' => $student->id,
        ]);

        $this->actingAs($student)
            ->put(route('schedules.update', $booking), [
                'date' => '2026-06-08',
                'time' => '20:30',
                'timezone' => 'Asia/Jakarta',
            ])
            ->assertRedirect();

        $this->assertSame('2026-06-08 13:30:00', $booking->refresh()->scheduled_at->format('Y-m-d H:i:s'));
        $this->assertSame(1, $enrollment->refresh()->sessions_used);
        $this->assertDatabaseHas('schedule_histories', [
            'action' => 'updated',
            'description' => "Waktu schedule diubah oleh {$student->name} dari 08 Jun 2026, 01:00 WIB menjadi 08 Jun 2026, 20:30 WIB.",
            'schedule_id' => $booking->id,
            'user_id' => $student->id,
        ]);
    }

    public function test_student_cannot_edit_an_assigned_session_schedule(): void
    {
        [$student, $enrollment, $subject] = $this->scheduleFixture(sessionCount: 6, sessionsUsed: 1);
        $booking = Schedule::factory()->create([
            'program_enrollment_id' => $enrollment->id,
            'scheduled_at' => '2026-06-07 18:00:00',
            'status' => 'assigned',
            'subject_id' => $subject->id,
            'user_id' => $student->id,
        ]);

        $this->actingAs($student)
            ->put(route('schedules.update', $booking), [
                'date' => '2026-06-08',
                'time' => '20:30',
                'timezone' => 'Asia/Jakarta',
            ])
            ->assertSessionHasErrors('date');

        $this->assertSame('2026-06-07 18:00:00', $booking->refresh()->scheduled_at->format('Y-m-d H:i:s'));
    }

    public function test_student_cannot_book_without_remaining_sessions(): void
    {
        CarbonImmutable::setTestNow('2026-06-06 15:00:00');
        [$student, $enrollment, $subject] = $this->scheduleFixture(sessionCount: 2, sessionsUsed: 2);

        $this->actingAs($student)
            ->post(route('schedules.store'), [
                'program_enrollment_id' => $enrollment->id,
                'subject_id' => $subject->id,
                'date' => '2026-06-07',
                'time' => '09:30',
                'timezone' => 'Asia/Jakarta',
            ])
            ->assertSessionHasErrors('subject_id');

        $this->assertDatabaseCount('schedules', 0);
        $this->assertSame(2, $enrollment->refresh()->sessions_used);

        CarbonImmutable::setTestNow();
    }

    public function test_booking_returns_an_indexed_error_for_a_session_outside_working_hours(): void
    {
        CarbonImmutable::setTestNow('2026-06-06 00:00:00');
        [$student, $enrollment, $subject] = $this->scheduleFixture();
        WorkingHour::factory()->create([
            'day_of_week' => 1,
            'end_time' => '20:00',
            'is_active' => true,
            'start_time' => '09:00',
        ]);

        $this->actingAs($student)
            ->post(route('schedules.store'), [
                'sessions' => [[
                    'date' => '2026-06-08',
                    'program_enrollment_id' => $enrollment->id,
                    'subject_id' => $subject->id,
                    'time' => '08:00',
                ]],
                'timezone' => 'Asia/Jakarta',
            ])
            ->assertSessionHasErrors([
                'sessions.0.date' => 'Jadwal harus berada dalam jam operasional 09.00–20.00 WIB.',
            ]);

        $this->assertDatabaseCount('schedules', 0);
        CarbonImmutable::setTestNow();
    }

    public function test_booking_returns_an_indexed_error_for_a_public_holiday(): void
    {
        CarbonImmutable::setTestNow('2026-06-06 00:00:00');
        [$student, $enrollment, $subject] = $this->scheduleFixture();
        PublicHoliday::factory()->create([
            'date' => '2026-06-08',
            'status' => 'active',
        ]);

        $this->actingAs($student)
            ->post(route('schedules.store'), [
                'sessions' => [[
                    'date' => '2026-06-08',
                    'program_enrollment_id' => $enrollment->id,
                    'subject_id' => $subject->id,
                    'time' => '10:00',
                ]],
                'timezone' => 'Asia/Jakarta',
            ])
            ->assertSessionHasErrors([
                'sessions.0.date' => 'Tanggal yang dipilih merupakan hari libur.',
            ]);

        $this->assertDatabaseCount('schedules', 0);
        CarbonImmutable::setTestNow();
    }

    public function test_booking_returns_indexed_errors_when_multiple_sessions_exceed_the_remaining_quota(): void
    {
        CarbonImmutable::setTestNow('2026-06-06 00:00:00');
        [$student, $enrollment, $subject] = $this->scheduleFixture(sessionCount: 1);

        $this->actingAs($student)
            ->post(route('schedules.store'), [
                'sessions' => [
                    [
                        'date' => '2026-06-08',
                        'program_enrollment_id' => $enrollment->id,
                        'subject_id' => $subject->id,
                        'time' => '10:00',
                    ],
                    [
                        'date' => '2026-06-09',
                        'program_enrollment_id' => $enrollment->id,
                        'subject_id' => $subject->id,
                        'time' => '10:00',
                    ],
                ],
                'timezone' => 'Asia/Jakarta',
            ])
            ->assertSessionHasErrors([
                'sessions.0.program_enrollment_id' => 'Sisa sesi untuk enrollment ini tidak mencukupi.',
                'sessions.1.program_enrollment_id' => 'Sisa sesi untuk enrollment ini tidak mencukupi.',
            ]);

        $this->assertDatabaseCount('schedules', 0);
        $this->assertSame(0, $enrollment->refresh()->sessions_used);
        CarbonImmutable::setTestNow();
    }

    /**
     * @return array{0: User, 1: ProgramEnrollment, 2: Subject}
     */
    private function scheduleFixture(int $sessionCount = 6, int $sessionsUsed = 0): array
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
