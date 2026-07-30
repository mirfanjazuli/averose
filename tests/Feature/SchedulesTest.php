<?php

namespace Tests\Feature;

use App\Models\AcademicField;
use App\Models\MentorJournal;
use App\Models\Program;
use App\Models\ProgramEnrollment;
use App\Models\ProgramVariant;
use App\Models\PublicHoliday;
use App\Models\RescheduleRequest;
use App\Models\Schedule;
use App\Models\ScheduleFeedback;
use App\Models\Subject;
use App\Models\User;
use App\Models\WorkingHour;
use App\Models\ZoomAccount;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class SchedulesTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_to_the_login_page(): void
    {
        $response = $this->get(route('schedules'));

        $response->assertRedirect(route('login'));
    }

    public function test_admin_users_can_visit_the_schedules_page(): void
    {
        $user = User::factory()->admin()->create();

        $this->actingAs($user);

        $response = $this->get(route('schedules'));

        $response
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('admin/scheduling/schedules/index'));
    }

    public function test_mentor_users_can_visit_the_schedules_page(): void
    {
        $user = User::factory()->mentor()->create();

        $this->actingAs($user);

        $response = $this->get(route('mentor.schedules'));

        $response
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('mentor/schedules/index'));
    }

    public function test_mentor_schedules_receive_database_sessions(): void
    {
        $mentor = User::factory()->mentor()->create();
        $student = User::factory()->student()->create([
            'name' => 'Sinta Student',
        ]);
        $field = AcademicField::factory()->create();
        $subject = Subject::factory()->create([
            'name' => 'Writing Review',
        ]);
        $program = Program::factory()->create([
            'name' => 'IELTS Intensive',
        ]);
        $variant = ProgramVariant::factory()->create([
            'field_id' => $field->id,
        ]);
        $zoomAccount = ZoomAccount::factory()->create([
            'name' => 'Mentor Zoom',
        ]);
        $enrollment = ProgramEnrollment::factory()->for($student)->create([
            'field_id' => $field->id,
            'program_id' => $program->id,
            'program_variant_id' => $variant->id,
        ]);

        Schedule::factory()->create([
            'mentor_id' => $mentor->id,
            'program_enrollment_id' => $enrollment->id,
            'scheduled_at' => '2026-07-10 13:00:00',
            'status' => 'assigned',
            'subject_id' => $subject->id,
            'user_id' => $student->id,
            'zoom_account_id' => $zoomAccount->id,
            'zoom_link' => 'https://zoom.test/j/mentor',
        ]);

        $this->actingAs($mentor)
            ->get(route('mentor.schedules'))
            ->assertOk()
            ->assertInertia(fn (Assert $page): Assert => $page
                ->component('mentor/schedules/index')
                ->has('serverNow')
                ->where('sessions.0.title', 'Writing Review')
                ->where('sessions.0.student', 'Sinta Student')
                ->where('sessions.0.program', 'IELTS Intensive')
                ->where('sessions.0.hasJournal', false)
                ->where('sessions.0.zoomAccount', 'Mentor Zoom')
            );
    }

    public function test_mentor_can_view_own_schedule_detail(): void
    {
        $mentor = User::factory()->mentor()->create();
        $student = User::factory()->student()->create([
            'name' => 'Sinta Student',
        ]);
        $subject = Subject::factory()->create([
            'name' => 'Writing Review',
        ]);
        $schedule = Schedule::factory()->create([
            'duration' => 90,
            'mentor_id' => $mentor->id,
            'scheduled_at' => '2026-07-10 13:00:00',
            'status' => 'completed',
            'subject_id' => $subject->id,
            'user_id' => $student->id,
        ]);
        $schedule->recordHistory(
            'created',
            'Booking schedule dibuat oleh Sinta Student.',
            $student,
        );
        $journal = MentorJournal::factory()->create([
            'mentor_id' => $mentor->id,
            'schedule_id' => $schedule->id,
            'slug' => $schedule->code,
            'student_id' => $student->id,
            'subject_id' => $subject->id,
        ]);

        $this->actingAs($mentor)
            ->get(route('mentor.schedules.show', $schedule))
            ->assertOk()
            ->assertInertia(fn (Assert $page): Assert => $page
                ->component('mentor/schedules/show')
                ->where('breadcrumbs.1.title', $schedule->code)
                ->where('schedule.code', $schedule->code)
                ->where('schedule.createdVia', 'Student booking')
                ->where('schedule.student', 'Sinta Student')
                ->where('schedule.subject', 'Writing Review')
                ->where('schedule.duration', 90)
                ->where('schedule.journal.completedAt', $journal->created_at->toJSON())
                ->where('schedule.journal.slug', $schedule->code)
                ->missing('schedule.journal.achievement')
                ->missing('schedule.journal.improvementArea')
                ->missing('schedule.journal.nextFocus')
                ->has('schedule.histories', 1)
            );
    }

    public function test_mentor_cannot_view_another_mentor_schedule_detail(): void
    {
        $mentor = User::factory()->mentor()->create();
        $otherMentor = User::factory()->mentor()->create();
        $schedule = Schedule::factory()->create([
            'mentor_id' => $otherMentor->id,
        ]);

        $this->actingAs($mentor)
            ->get(route('mentor.schedules.show', $schedule))
            ->assertNotFound();
    }

    public function test_student_users_can_visit_the_schedules_page(): void
    {
        $user = User::factory()->student()->create();

        $this->actingAs($user);

        $response = $this->get('/schedules');

        $response
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('student/schedules/index'));
    }

    public function test_student_schedule_page_marks_completed_sessions_as_feedbackable(): void
    {
        $student = User::factory()->student()->create();
        $mentor = User::factory()->mentor()->create();
        $subject = Subject::factory()->create(['name' => 'Biology']);
        $previousSchedule = Schedule::factory()->create([
            'mentor_id' => $mentor->id,
            'scheduled_at' => now()->subDays(2),
            'status' => 'completed',
        ]);
        ScheduleFeedback::query()->create([
            'audio_quality_rating' => 4,
            'interactivity_rating' => 5,
            'material_clarity_rating' => 5,
            'mentor_id' => $mentor->id,
            'schedule_id' => $previousSchedule->id,
            'user_id' => $previousSchedule->user_id,
            'visual_quality_rating' => 4,
        ]);

        Schedule::factory()->create([
            'mentor_id' => $mentor->id,
            'scheduled_at' => now()->subHours(2),
            'status' => 'completed',
            'subject_id' => $subject->id,
            'user_id' => $student->id,
        ]);

        $this
            ->actingAs($student)
            ->get('/schedules')
            ->assertOk()
            ->assertInertia(fn (Assert $page): Assert => $page
                ->component('student/schedules/index')
                ->where('sessions.0.canGiveFeedback', true)
                ->where('sessions.0.feedback', null)
                ->where('sessions.0.mentorRating', 4.5)
            );
    }

    public function test_student_can_submit_schedule_feedback_after_session_ends(): void
    {
        $student = User::factory()->student()->create();
        $mentor = User::factory()->mentor()->create();
        $schedule = Schedule::factory()->create([
            'mentor_id' => $mentor->id,
            'scheduled_at' => now()->subHours(2),
            'status' => 'completed',
            'user_id' => $student->id,
        ]);

        $this
            ->actingAs($student)
            ->post(route('schedules.feedback.store', $schedule), [
                'audio_quality_rating' => 4,
                'comment' => 'Kelasnya jelas dan interaktif.',
                'interactivity_rating' => 5,
                'material_clarity_rating' => 5,
                'visual_quality_rating' => 4,
            ])
            ->assertRedirect()
            ->assertSessionHasNoErrors();

        $this->assertDatabaseHas('schedule_feedback', [
            'audio_quality_rating' => 4,
            'comment' => 'Kelasnya jelas dan interaktif.',
            'interactivity_rating' => 5,
            'material_clarity_rating' => 5,
            'mentor_id' => $mentor->id,
            'schedule_id' => $schedule->id,
            'user_id' => $student->id,
            'visual_quality_rating' => 4,
        ]);
    }

    public function test_student_cannot_submit_feedback_before_session_ends(): void
    {
        $student = User::factory()->student()->create();
        $schedule = Schedule::factory()->create([
            'scheduled_at' => now()->addHour(),
            'status' => 'assigned',
            'user_id' => $student->id,
        ]);

        $this
            ->actingAs($student)
            ->post(route('schedules.feedback.store', $schedule), [
                'audio_quality_rating' => 4,
                'interactivity_rating' => 5,
                'material_clarity_rating' => 5,
                'visual_quality_rating' => 4,
            ])
            ->assertSessionHasErrors('feedback');

        $this->assertDatabaseCount('schedule_feedback', 0);
    }

    public function test_student_cannot_submit_schedule_feedback_twice(): void
    {
        $student = User::factory()->student()->create();
        $schedule = Schedule::factory()->create([
            'scheduled_at' => now()->subHours(2),
            'status' => 'completed',
            'user_id' => $student->id,
        ]);

        $payload = [
            'audio_quality_rating' => 4,
            'interactivity_rating' => 5,
            'material_clarity_rating' => 5,
            'visual_quality_rating' => 4,
        ];

        $this
            ->actingAs($student)
            ->post(route('schedules.feedback.store', $schedule), $payload)
            ->assertSessionHasNoErrors();

        $this
            ->actingAs($student)
            ->post(route('schedules.feedback.store', $schedule), $payload)
            ->assertSessionHasErrors('feedback');

        $this->assertDatabaseCount('schedule_feedback', 1);
    }

    public function test_admin_users_can_visit_the_reschedule_requests_page(): void
    {
        $user = User::factory()->admin()->create();

        $this->actingAs($user);

        $response = $this->get(route('schedules.reschedule-requests'));

        $response->assertOk();
    }

    public function test_admin_reschedule_requests_page_receives_database_requests(): void
    {
        $admin = User::factory()->admin()->create();
        $student = User::factory()->student()->create(['name' => 'Alya Student']);
        $mentor = User::factory()->mentor()->create(['name' => 'Mira Mentor']);
        $subject = Subject::factory()->create(['name' => 'Math Review']);
        $booking = Schedule::factory()->create([
            'mentor_id' => $mentor->id,
            'scheduled_at' => '2026-07-10 09:00:00',
            'status' => 'assigned',
            'subject_id' => $subject->id,
            'user_id' => $student->id,
        ]);

        RescheduleRequest::factory()->create([
            'current_scheduled_at' => '2026-07-10 09:00:00',
            'duration' => 60,
            'mentor_id' => $mentor->id,
            'reason' => 'Bentrok sekolah/kampus',
            'requested_scheduled_at' => '2026-07-11 10:00:00',
            'schedule_id' => $booking->id,
            'user_id' => $student->id,
        ]);

        $this->actingAs($admin)
            ->get(route('schedules.reschedule-requests'))
            ->assertOk()
            ->assertInertia(fn (Assert $page): Assert => $page
                ->component('admin/scheduling/reschedule-requests/index')
                ->where('requests.0.student', 'Alya Student')
                ->where('requests.0.mentor', 'Mira Mentor')
                ->where('requests.0.session', 'Math Review')
                ->where('requests.0.status', 'Pending')
                ->where('navigation.pendingRescheduleRequests', 1)
                ->where('summary.pending', 1)
            );
    }

    public function test_admin_reschedule_request_detail_uses_schedule_code(): void
    {
        $admin = User::factory()->admin()->create();
        $booking = Schedule::factory()->create();
        $request = RescheduleRequest::factory()->create([
            'schedule_id' => $booking->id,
            'user_id' => $booking->user_id,
        ]);

        $this->actingAs($admin)
            ->get(route('schedules.reschedule-requests.show', $request))
            ->assertOk()
            ->assertInertia(fn (Assert $page): Assert => $page
                ->component('admin/scheduling/reschedule-requests/show')
                ->where('breadcrumbs.2.title', $booking->code)
                ->where('request.scheduleCode', $booking->code)
            );
    }

    public function test_student_can_request_reschedule_and_admin_can_approve_it(): void
    {
        CarbonImmutable::setTestNow('2026-07-01 09:00:00');
        config(['services.zoom.create_real_meetings' => false]);

        $admin = User::factory()->admin()->create();
        $student = User::factory()->student()->create();
        $mentor = User::factory()->mentor()->create();
        $booking = Schedule::factory()->create([
            'mentor_id' => $mentor->id,
            'scheduled_at' => '2026-07-10 09:00:00',
            'status' => 'assigned',
            'user_id' => $student->id,
            'zoom_account_id' => ZoomAccount::factory()->create()->id,
        ]);

        $this->actingAs($student)
            ->post(route('reschedule-requests.store', $booking), [
                'notes' => 'Ada jadwal ujian sekolah di waktu sebelumnya.',
                'reason' => 'Bentrok sekolah/kampus',
                'requested_scheduled_at' => '2026-07-11 10:00:00',
            ])
            ->assertRedirect();

        $request = RescheduleRequest::query()->firstOrFail();

        $this->assertSame('pending', $request->status);
        $this->assertSame($booking->id, $request->schedule_id);

        $this->actingAs($admin)
            ->put(route('schedules.reschedule-requests.approve', $request))
            ->assertRedirect();

        $booking->refresh();
        $request->refresh();

        $this->assertSame('rescheduled', $booking->status);
        $this->assertSame('2026-07-11 10:00:00', $booking->scheduled_at->format('Y-m-d H:i:s'));
        $this->assertSame('approved', $request->status);
        $this->assertSame($admin->id, $request->reviewed_by);
        $this->assertDatabaseHas('schedule_histories', [
            'action' => 'reschedule_requested',
            'description' => "Reschedule diajukan oleh {$student->name} dari 10 Jul 2026, 09:00 WIB menjadi 11 Jul 2026, 10:00 WIB.",
            'schedule_id' => $booking->id,
            'user_id' => $student->id,
        ]);
        $this->assertDatabaseHas('schedule_histories', [
            'action' => 'rescheduled',
            'description' => "Waktu schedule diubah oleh {$admin->name} dari 10 Jul 2026, 09:00 WIB menjadi 11 Jul 2026, 10:00 WIB.",
            'schedule_id' => $booking->id,
            'user_id' => $admin->id,
        ]);

        CarbonImmutable::setTestNow();
    }

    public function test_admin_cannot_approve_reschedule_when_mentor_slot_has_become_unavailable(): void
    {
        $admin = User::factory()->admin()->create();
        $student = User::factory()->student()->create();
        $mentor = User::factory()->mentor()->create();
        $booking = Schedule::factory()->create([
            'duration' => 60,
            'mentor_id' => $mentor->id,
            'scheduled_at' => '2026-07-10 09:00:00',
            'status' => 'assigned',
            'user_id' => $student->id,
        ]);
        $rescheduleRequest = RescheduleRequest::factory()->create([
            'current_scheduled_at' => $booking->scheduled_at,
            'duration' => 60,
            'mentor_id' => $mentor->id,
            'requested_scheduled_at' => '2026-07-11 10:00:00',
            'schedule_id' => $booking->id,
            'status' => 'pending',
            'user_id' => $student->id,
        ]);
        Schedule::factory()->create([
            'duration' => 60,
            'mentor_id' => $mentor->id,
            'scheduled_at' => '2026-07-11 10:30:00',
            'status' => 'assigned',
        ]);

        $this->actingAs($admin)
            ->put(route('schedules.reschedule-requests.approve', $rescheduleRequest))
            ->assertSessionHasErrors('requested_scheduled_at');

        $this->assertSame('pending', $rescheduleRequest->refresh()->status);
        $this->assertSame(
            '2026-07-10 09:00:00',
            $booking->refresh()->scheduled_at->format('Y-m-d H:i:s'),
        );
    }

    public function test_student_reschedule_request_requires_notes(): void
    {
        CarbonImmutable::setTestNow('2026-07-01 09:00:00');

        $student = User::factory()->student()->create();
        $mentor = User::factory()->mentor()->create();
        $booking = Schedule::factory()->create([
            'mentor_id' => $mentor->id,
            'scheduled_at' => '2026-07-10 09:00:00',
            'status' => 'assigned',
            'user_id' => $student->id,
        ]);

        $this->actingAs($student)
            ->post(route('reschedule-requests.store', $booking), [
                'reason' => 'Bentrok sekolah/kampus',
                'requested_scheduled_at' => '2026-07-11 10:00:00',
            ])
            ->assertSessionHasErrors('notes');

        $this->assertDatabaseCount('reschedule_requests', 0);

        CarbonImmutable::setTestNow();
    }

    public function test_admin_users_can_visit_the_working_hours_page(): void
    {
        $user = User::factory()->admin()->create();

        $this->actingAs($user);

        $response = $this->get(route('schedules.working-hours'));

        $response
            ->assertOk()
            ->assertInertia(fn (Assert $page): Assert => $page
                ->component('admin/scheduling/working-hours/index')
                ->where('workingHours.0.dayOfWeek', 1)
                ->where('workingHours.0.isActive', true)
                ->where('workingHours.0.startTime', '09:00')
                ->where('workingHours.0.endTime', '20:00')
                ->where('workingHours.4.dayOfWeek', 5)
                ->where('workingHours.4.isActive', true)
                ->where('workingHours.5.dayOfWeek', 6)
                ->where('workingHours.5.isActive', false)
            );
    }

    public function test_admin_users_can_update_working_hours(): void
    {
        $user = User::factory()->admin()->create();
        WorkingHour::factory()->create(['day_of_week' => 1]);
        WorkingHour::factory()->create(['day_of_week' => 2]);
        WorkingHour::factory()->create(['day_of_week' => 6]);

        $this->actingAs($user)
            ->put(route('schedules.working-hours.update'), [
                'days' => [1, 2, 6],
                'end_time' => '15:00',
                'start_time' => '10:00',
            ])
            ->assertRedirect()
            ->assertSessionDoesntHaveErrors();

        foreach ([1, 2, 6] as $activeDay) {
            $this->assertDatabaseHas('working_hours', [
                'day_of_week' => $activeDay,
                'end_time' => '15:00',
                'is_active' => true,
                'start_time' => '10:00',
            ]);
        }

        foreach ([3, 4, 5, 7] as $inactiveDay) {
            $this->assertDatabaseHas('working_hours', [
                'day_of_week' => $inactiveDay,
                'end_time' => null,
                'is_active' => false,
                'start_time' => null,
            ]);
        }
    }

    public function test_working_hours_require_active_days_and_a_valid_time_range(): void
    {
        $user = User::factory()->admin()->create();
        $workingHour = WorkingHour::factory()->create([
            'day_of_week' => 1,
            'end_time' => '20:00',
            'is_active' => true,
            'start_time' => '09:00',
        ]);

        $this->actingAs($user)
            ->put(route('schedules.working-hours.update'), [
                'days' => [],
                'end_time' => '08:00',
                'start_time' => '09:00',
            ])
            ->assertSessionHasErrors(['days', 'end_time']);

        $workingHour->refresh();

        $this->assertTrue($workingHour->is_active);
        $this->assertSame('09:00', $workingHour->start_time);
        $this->assertSame('20:00', $workingHour->end_time);
    }

    public function test_admin_users_can_visit_the_public_holidays_page(): void
    {
        $user = User::factory()->admin()->create();
        PublicHoliday::factory()->create([
            'date' => '2026-08-17',
            'name' => 'Hari Kemerdekaan Republik Indonesia',
            'source' => 'manual',
            'status' => 'active',
            'type' => 'national',
        ]);

        $this->actingAs($user);

        $response = $this->get(route('schedules.public-holidays'));

        $response
            ->assertOk()
            ->assertInertia(fn (Assert $page): Assert => $page
                ->component('admin/scheduling/public-holidays/index')
                ->where('holidays.0.name', 'Hari Kemerdekaan Republik Indonesia')
                ->where('holidays.0.date', '2026-08-17')
                ->where('holidays.0.type', 'national')
            );
    }

    public function test_admin_users_can_manage_public_holidays(): void
    {
        $user = User::factory()->admin()->create();

        $this->actingAs($user);

        $this->post(route('schedules.public-holidays.store'), [
            'date' => '2026-12-25',
            'name' => 'Hari Raya Natal',
            'status' => 'active',
            'type' => 'national',
        ])->assertRedirect();

        $holiday = PublicHoliday::query()->firstOrFail();

        $this->assertSame('manual', $holiday->source);

        $this->put(route('schedules.public-holidays.update', $holiday), [
            'date' => '2026-12-26',
            'name' => 'Cuti Bersama Natal',
            'status' => 'inactive',
            'type' => 'collective_leave',
        ])->assertRedirect();

        $holiday->refresh();

        $this->assertSame('Cuti Bersama Natal', $holiday->name);
        $this->assertSame('2026-12-26', $holiday->date);
        $this->assertSame('inactive', $holiday->status);
        $this->assertSame('collective_leave', $holiday->type);

        $this->delete(route('schedules.public-holidays.destroy', $holiday))
            ->assertRedirect();

        $this->assertDatabaseHas('public_holidays', [
            'id' => $holiday->id,
            'status' => 'inactive',
        ]);
    }

    public function test_admin_users_can_import_public_holidays_idempotently(): void
    {
        $user = User::factory()->admin()->create();

        $payload = [
            'holidays' => [
                [
                    'date' => '2026-01-01',
                    'name' => 'Hari tahun baru',
                    'type' => 'national',
                ],
                [
                    'date' => '2026-01-01',
                    'name' => 'Hari tahun baru',
                    'type' => 'national',
                ],
                [
                    'date' => '2026-08-17',
                    'name' => 'Hari Kemerdekaan Republik Indonesia',
                    'type' => 'national',
                ],
            ],
            'year' => 2026,
        ];

        $this->actingAs($user)
            ->post(route('schedules.public-holidays.import'), $payload)
            ->assertRedirect();

        $this->actingAs($user)
            ->post(route('schedules.public-holidays.import'), $payload)
            ->assertRedirect();

        $this->assertDatabaseCount('public_holidays', 2);
        $this->assertDatabaseHas('public_holidays', [
            'date' => '2026-01-01',
            'name' => 'Hari tahun baru',
            'source' => 'library',
            'status' => 'active',
            'type' => 'national',
        ]);
    }

    public function test_guests_are_redirected_from_schedule_sub_pages(): void
    {
        $this->get(route('schedules.reschedule-requests'))
            ->assertRedirect(route('login'));

        $this->get(route('schedules.working-hours'))
            ->assertRedirect(route('login'));

        $this->get(route('schedules.public-holidays'))
            ->assertRedirect(route('login'));
    }
}
