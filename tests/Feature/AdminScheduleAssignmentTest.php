<?php

namespace Tests\Feature;

use App\Models\AcademicField;
use App\Models\Program;
use App\Models\ProgramEnrollment;
use App\Models\ProgramVariant;
use App\Models\Schedule;
use App\Models\Subject;
use App\Models\User;
use App\Models\ZoomAccount;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AdminScheduleAssignmentTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config(['services.zoom.create_real_meetings' => false]);
    }

    public function test_admin_schedules_receive_database_sessions(): void
    {
        $admin = User::factory()->admin()->create();
        $zoomAccount = ZoomAccount::factory()->create([
            'name' => 'Main Zoom',
        ]);
        [$booking] = $this->scheduleFixture([
            'scheduled_at' => '2026-07-10 09:00:00',
            'status' => 'pending',
            'zoom_account_id' => $zoomAccount->id,
            'zoom_link' => 'https://zoom.test/j/main',
        ]);

        $this->actingAs($admin)
            ->get(route('schedules'))
            ->assertOk()
            ->assertInertia(fn (Assert $page): Assert => $page
                ->component('admin/scheduling/schedules/index')
                ->where('sessions.0.code', $booking->code)
                ->where('sessions.0.id', (string) $booking->id)
                ->where('sessions.0.status', 'Pending')
                ->where('sessions.0.zoomAccount', 'Main Zoom')
                ->where('sessions.0.zoomAccountSlug', $zoomAccount->slug)
                ->where('enrollments.0.id', (string) $booking->program_enrollment_id)
            );
    }

    public function test_mentor_options_keep_conflicting_mentors_visible_but_unavailable(): void
    {
        $admin = User::factory()->admin()->create();
        $busyMentor = User::factory()->mentor()->create(['name' => 'Busy Mentor']);
        $completedMentor = User::factory()->mentor()->create(['name' => 'Completed Mentor']);
        $freeMentor = User::factory()->mentor()->create(['name' => 'Free Mentor']);
        [$booking] = $this->scheduleFixture([
            'duration' => 60,
            'scheduled_at' => '2026-07-10 09:00:00',
        ]);
        $this->scheduleFixture([
            'duration' => 60,
            'mentor_id' => $busyMentor->id,
            'scheduled_at' => '2026-07-10 09:30:00',
            'status' => 'assigned',
        ]);
        $this->scheduleFixture([
            'duration' => 60,
            'mentor_id' => $completedMentor->id,
            'scheduled_at' => '2026-07-10 09:30:00',
            'status' => 'completed',
        ]);

        $this->actingAs($admin)
            ->get(route('schedules.assignment.options', $booking))
            ->assertOk()
            ->assertJsonCount(3, 'mentors')
            ->assertJsonPath('mentors.0.id', (string) $busyMentor->id)
            ->assertJsonPath('mentors.0.available', false)
            ->assertJsonPath('mentors.0.conflict.time', '09:30–10:30 WIB')
            ->assertJsonPath('mentors.1.id', (string) $completedMentor->id)
            ->assertJsonPath('mentors.1.available', true)
            ->assertJsonPath('mentors.1.conflict', null)
            ->assertJsonPath('mentors.2.id', (string) $freeMentor->id)
            ->assertJsonPath('mentors.2.available', true);
    }

    public function test_create_schedule_mentor_options_use_the_requested_time_and_duration(): void
    {
        $admin = User::factory()->admin()->create();
        $busyMentor = User::factory()->mentor()->create(['name' => 'Busy Mentor']);
        $freeMentor = User::factory()->mentor()->create(['name' => 'Free Mentor']);
        $this->scheduleFixture([
            'duration' => 60,
            'mentor_id' => $busyMentor->id,
            'scheduled_at' => '2026-07-10 09:30:00',
            'status' => 'assigned',
        ]);

        $this->actingAs($admin)
            ->get(route('schedules.create.mentor-options', [
                'date' => '2026-07-10',
                'duration' => 60,
                'time' => '09:00',
            ]))
            ->assertOk()
            ->assertJsonCount(2, 'mentors')
            ->assertJsonPath('mentors.0.id', (string) $busyMentor->id)
            ->assertJsonPath('mentors.0.available', false)
            ->assertJsonPath('mentors.1.id', (string) $freeMentor->id)
            ->assertJsonPath('mentors.1.available', true);
    }

    public function test_admin_can_create_and_assign_a_manual_online_schedule(): void
    {
        CarbonImmutable::setTestNow('2026-07-01 09:00:00');

        $admin = User::factory()->admin()->create();
        $mentor = User::factory()->mentor()->create();
        ZoomAccount::factory()->create();
        [$enrollment, $subject, $student] = $this->enrollmentFixture();

        $this->actingAs($admin)
            ->post(route('scheduling.schedules.store'), [
                'date' => '2026-07-10',
                'delivery_mode' => 'online',
                'mentor_id' => $mentor->id,
                'program_enrollment_id' => $enrollment->id,
                'subject_id' => $subject->id,
                'time' => '13:30',
                'user_id' => $student->id,
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('schedules', [
            'code' => 'SCH-2026-000001',
            'delivery_mode' => 'online',
            'duration' => $enrollment->variant->duration,
            'mentor_id' => $mentor->id,
            'program_enrollment_id' => $enrollment->id,
            'scheduled_at' => '2026-07-10 13:30:00',
            'status' => 'assigned',
            'subject_id' => $subject->id,
            'user_id' => $student->id,
        ]);
        $this->assertSame(1, $enrollment->refresh()->sessions_used);
        $this->assertDatabaseHas('schedule_histories', [
            'action' => 'created',
            'description' => "Schedule dibuat manual oleh {$admin->name} dengan mentor {$mentor->name}.",
            'user_id' => $admin->id,
        ]);
        $this->assertNotNull(Schedule::query()->firstOrFail()->zoom_link);

        CarbonImmutable::setTestNow();
    }

    public function test_admin_can_create_an_offline_schedule_without_a_zoom_account(): void
    {
        CarbonImmutable::setTestNow('2026-07-01 09:00:00');

        $admin = User::factory()->admin()->create();
        $mentor = User::factory()->mentor()->create();
        [$enrollment, $subject, $student] = $this->enrollmentFixture();

        $this->actingAs($admin)
            ->post(route('scheduling.schedules.store'), [
                'date' => '2026-07-10',
                'delivery_mode' => 'offline',
                'mentor_id' => $mentor->id,
                'program_enrollment_id' => $enrollment->id,
                'subject_id' => $subject->id,
                'time' => '13:30',
                'user_id' => $student->id,
            ])
            ->assertRedirect()
            ->assertSessionDoesntHaveErrors();

        $this->assertDatabaseHas('schedules', [
            'delivery_mode' => 'offline',
            'mentor_id' => $mentor->id,
            'status' => 'assigned',
            'zoom_account_id' => null,
            'zoom_link' => null,
        ]);

        CarbonImmutable::setTestNow();
    }

    public function test_admin_cannot_create_a_schedule_with_a_conflicting_mentor(): void
    {
        CarbonImmutable::setTestNow('2026-07-01 09:00:00');

        $admin = User::factory()->admin()->create();
        $mentor = User::factory()->mentor()->create();
        [$enrollment, $subject, $student] = $this->enrollmentFixture();
        $this->scheduleFixture([
            'duration' => 60,
            'mentor_id' => $mentor->id,
            'scheduled_at' => '2026-07-10 14:00:00',
            'status' => 'assigned',
        ]);

        $this->actingAs($admin)
            ->post(route('scheduling.schedules.store'), [
                'date' => '2026-07-10',
                'delivery_mode' => 'offline',
                'mentor_id' => $mentor->id,
                'program_enrollment_id' => $enrollment->id,
                'subject_id' => $subject->id,
                'time' => '13:30',
                'user_id' => $student->id,
            ])
            ->assertSessionHasErrors('mentor_id');

        $this->assertSame(0, $enrollment->refresh()->sessions_used);
        $this->assertDatabaseMissing('schedules', [
            'program_enrollment_id' => $enrollment->id,
            'scheduled_at' => '2026-07-10 13:30:00',
        ]);

        CarbonImmutable::setTestNow();
    }

    public function test_admin_cannot_create_manual_schedule_when_no_sessions_remain(): void
    {
        CarbonImmutable::setTestNow('2026-07-01 09:00:00');

        $admin = User::factory()->admin()->create();
        $mentor = User::factory()->mentor()->create();
        [$enrollment, $subject, $student] = $this->enrollmentFixture([
            'session' => 1,
            'sessions_used' => 1,
        ]);

        $this->actingAs($admin)
            ->post(route('scheduling.schedules.store'), [
                'date' => '2026-07-10',
                'delivery_mode' => 'offline',
                'mentor_id' => $mentor->id,
                'program_enrollment_id' => $enrollment->id,
                'subject_id' => $subject->id,
                'time' => '13:30',
                'user_id' => $student->id,
            ])
            ->assertSessionHasErrors('program_enrollment_id');

        $this->assertDatabaseCount('schedules', 0);

        CarbonImmutable::setTestNow();
    }

    public function test_admin_can_assign_mentor_and_available_zoom_account(): void
    {
        $admin = User::factory()->admin()->create();
        $mentor = User::factory()->mentor()->create();
        $busyAccount = ZoomAccount::factory()->create([
            'name' => 'Busy Zoom',
        ]);
        $availableAccount = ZoomAccount::factory()->create([
            'name' => 'Open Zoom',
        ]);
        [$booking] = $this->scheduleFixture([
            'scheduled_at' => '2026-07-10 09:00:00',
            'duration' => 60,
        ]);

        $this->scheduleFixture([
            'scheduled_at' => '2026-07-10 09:15:00',
            'duration' => 60,
            'zoom_account_id' => $busyAccount->id,
            'zoom_link' => 'https://zoom.us/j/busy-1',
            'status' => 'assigned',
        ]);
        $this->scheduleFixture([
            'scheduled_at' => '2026-07-10 09:30:00',
            'duration' => 60,
            'zoom_account_id' => $busyAccount->id,
            'zoom_link' => 'https://zoom.us/j/busy-2',
            'status' => 'assigned',
        ]);

        $this->actingAs($admin)
            ->put(route('schedules.assignment.update', $booking), [
                'mentor_id' => $mentor->id,
            ])
            ->assertRedirect();

        $booking->refresh();

        $this->assertSame($mentor->id, $booking->mentor_id);
        $this->assertSame($availableAccount->id, $booking->zoom_account_id);
        $this->assertSame('assigned', $booking->status);
        $this->assertNotNull($booking->zoom_link);
        $this->assertNotNull($booking->zoom_meeting_id);
        $this->assertNotNull($booking->zoom_start_url);
        $this->assertNotNull($booking->assigned_at);
        $this->assertDatabaseHas('schedule_histories', [
            'action' => 'assigned',
            'description' => "Mentor dan Zoom ditetapkan oleh {$admin->name}.",
            'schedule_id' => $booking->id,
            'user_id' => $admin->id,
        ]);
    }

    public function test_admin_can_assign_an_offline_schedule_without_a_zoom_account(): void
    {
        $admin = User::factory()->admin()->create();
        $mentor = User::factory()->mentor()->create();
        [$booking] = $this->scheduleFixture([
            'delivery_mode' => 'offline',
            'status' => 'pending',
        ]);

        $this->actingAs($admin)
            ->put(route('schedules.assignment.update', $booking), [
                'mentor_id' => $mentor->id,
            ])
            ->assertRedirect()
            ->assertSessionDoesntHaveErrors();

        $booking->refresh();

        $this->assertSame($mentor->id, $booking->mentor_id);
        $this->assertSame('assigned', $booking->status);
        $this->assertNull($booking->zoom_account_id);
        $this->assertNull($booking->zoom_link);
    }

    public function test_admin_cannot_assign_a_mentor_with_an_overlapping_schedule(): void
    {
        $admin = User::factory()->admin()->create();
        $mentor = User::factory()->mentor()->create();
        ZoomAccount::factory()->create();
        [$booking] = $this->scheduleFixture([
            'duration' => 60,
            'scheduled_at' => '2026-07-10 09:00:00',
        ]);
        $this->scheduleFixture([
            'duration' => 60,
            'mentor_id' => $mentor->id,
            'scheduled_at' => '2026-07-10 09:30:00',
            'status' => 'assigned',
        ]);

        $this->actingAs($admin)
            ->put(route('schedules.assignment.update', $booking), [
                'mentor_id' => $mentor->id,
            ])
            ->assertSessionHasErrors([
                'mentor_id' => 'Mentor sudah memiliki jadwal pada 09:30–10:30 WIB.',
            ]);

        $booking->refresh();

        $this->assertNull($booking->mentor_id);
        $this->assertNull($booking->zoom_account_id);
        $this->assertNull($booking->zoom_link);
        $this->assertDatabaseMissing('schedule_histories', [
            'action' => 'assigned',
            'schedule_id' => $booking->id,
        ]);
    }

    public function test_admin_cannot_assign_an_inactive_mentor(): void
    {
        $admin = User::factory()->admin()->create();
        $mentor = User::factory()->mentor()->create(['status' => 'inactive']);
        ZoomAccount::factory()->create();
        [$booking] = $this->scheduleFixture();

        $this->actingAs($admin)
            ->put(route('schedules.assignment.update', $booking), [
                'mentor_id' => $mentor->id,
            ])
            ->assertSessionHasErrors('mentor_id');

        $this->assertNull($booking->refresh()->mentor_id);
    }

    public function test_admin_can_assign_a_mentor_immediately_after_another_schedule_ends(): void
    {
        $admin = User::factory()->admin()->create();
        $mentor = User::factory()->mentor()->create();
        ZoomAccount::factory()->create();
        [$booking] = $this->scheduleFixture([
            'duration' => 60,
            'scheduled_at' => '2026-07-10 09:00:00',
        ]);
        $this->scheduleFixture([
            'duration' => 60,
            'mentor_id' => $mentor->id,
            'scheduled_at' => '2026-07-10 08:00:00',
            'status' => 'assigned',
        ]);

        $this->actingAs($admin)
            ->put(route('schedules.assignment.update', $booking), [
                'mentor_id' => $mentor->id,
            ])
            ->assertSessionDoesntHaveErrors();

        $this->assertSame($mentor->id, $booking->refresh()->mentor_id);
    }

    public function test_completed_schedules_do_not_block_mentor_assignment(): void
    {
        $admin = User::factory()->admin()->create();
        $mentor = User::factory()->mentor()->create();
        ZoomAccount::factory()->create();
        [$booking] = $this->scheduleFixture([
            'duration' => 60,
            'scheduled_at' => '2026-07-10 09:00:00',
        ]);
        $this->scheduleFixture([
            'duration' => 60,
            'mentor_id' => $mentor->id,
            'scheduled_at' => '2026-07-10 09:30:00',
            'status' => 'completed',
        ]);

        $this->actingAs($admin)
            ->put(route('schedules.assignment.update', $booking), [
                'mentor_id' => $mentor->id,
            ])
            ->assertSessionDoesntHaveErrors();

        $this->assertSame($mentor->id, $booking->refresh()->mentor_id);
    }

    public function test_admin_can_view_schedule_history(): void
    {
        $admin = User::factory()->admin()->create();
        [$booking] = $this->scheduleFixture([
            'scheduled_at' => '2026-07-10 09:00:00',
            'status' => 'pending',
        ]);
        $booking->recordHistory('created', 'Schedule dibuat dari booking siswa.', $admin, [
            'status' => 'pending',
        ], '127.0.0.1');

        $this->actingAs($admin)
            ->get(route('schedules.show', $booking))
            ->assertOk()
            ->assertInertia(fn (Assert $page): Assert => $page
                ->component('admin/scheduling/schedules/show')
                ->where('breadcrumbs.2.title', $booking->code)
                ->where('schedule.code', $booking->code)
                ->where('schedule.id', (string) $booking->id)
                ->where('schedule.histories.0.action', 'created')
                ->where('schedule.histories.0.description', 'Schedule dibuat dari booking siswa.')
            );
    }

    public function test_admin_can_edit_a_schedule_time(): void
    {
        CarbonImmutable::setTestNow('2026-07-01 09:00:00');

        $admin = User::factory()->admin()->create();
        $mentor = User::factory()->mentor()->create();
        [$booking] = $this->scheduleFixture([
            'delivery_mode' => 'offline',
            'mentor_id' => $mentor->id,
            'scheduled_at' => '2026-07-10 09:00:00',
            'status' => 'assigned',
        ]);

        $this->actingAs($admin)
            ->put(route('scheduling.schedules.update', $booking), [
                'date' => '2026-07-11',
                'time' => '13:30',
            ])
            ->assertRedirect()
            ->assertSessionDoesntHaveErrors();

        $this->assertSame(
            '2026-07-11 13:30:00',
            $booking->refresh()->scheduled_at->format('Y-m-d H:i:s'),
        );
        $this->assertDatabaseHas('schedule_histories', [
            'action' => 'updated',
            'description' => "Waktu schedule diubah oleh {$admin->name} dari 10 Jul 2026, 09:00 WIB menjadi 11 Jul 2026, 13:30 WIB.",
            'schedule_id' => $booking->id,
            'user_id' => $admin->id,
        ]);

        CarbonImmutable::setTestNow();
    }

    public function test_admin_cannot_edit_a_completed_schedule(): void
    {
        CarbonImmutable::setTestNow('2026-07-01 09:00:00');

        $admin = User::factory()->admin()->create();
        [$booking] = $this->scheduleFixture([
            'scheduled_at' => '2026-07-10 09:00:00',
            'status' => 'completed',
        ]);

        $this->actingAs($admin)
            ->put(route('scheduling.schedules.update', $booking), [
                'date' => '2026-07-11',
                'time' => '13:30',
            ])
            ->assertSessionHasErrors('date');

        $this->assertSame(
            '2026-07-10 09:00:00',
            $booking->refresh()->scheduled_at->format('Y-m-d H:i:s'),
        );

        CarbonImmutable::setTestNow();
    }

    public function test_admin_cannot_edit_a_schedule_into_a_mentor_conflict(): void
    {
        CarbonImmutable::setTestNow('2026-07-01 09:00:00');

        $admin = User::factory()->admin()->create();
        $mentor = User::factory()->mentor()->create();
        [$booking] = $this->scheduleFixture([
            'delivery_mode' => 'offline',
            'mentor_id' => $mentor->id,
            'scheduled_at' => '2026-07-10 09:00:00',
            'status' => 'assigned',
        ]);
        $this->scheduleFixture([
            'delivery_mode' => 'offline',
            'mentor_id' => $mentor->id,
            'scheduled_at' => '2026-07-11 13:00:00',
            'status' => 'assigned',
        ]);

        $this->actingAs($admin)
            ->put(route('scheduling.schedules.update', $booking), [
                'date' => '2026-07-11',
                'time' => '13:30',
            ])
            ->assertSessionHasErrors('date');

        $this->assertSame(
            '2026-07-10 09:00:00',
            $booking->refresh()->scheduled_at->format('Y-m-d H:i:s'),
        );

        CarbonImmutable::setTestNow();
    }

    public function test_admin_cannot_reassign_a_completed_schedule(): void
    {
        $admin = User::factory()->admin()->create();
        $mentor = User::factory()->mentor()->create();
        [$booking] = $this->scheduleFixture([
            'status' => 'completed',
        ]);

        $this->actingAs($admin)
            ->put(route('schedules.assignment.update', $booking), [
                'mentor_id' => $mentor->id,
            ])
            ->assertSessionHasErrors('mentor_id');

        $this->assertNull($booking->refresh()->mentor_id);
    }

    public function test_assignment_can_create_a_real_zoom_meeting_via_api_configuration(): void
    {
        config([
            'services.zoom.api_url' => 'https://api.zoom.test/v2',
            'services.zoom.auth_url' => 'https://zoom.test/oauth/token',
            'services.zoom.create_real_meetings' => true,
            'app.timezone' => 'Asia/Jakarta',
        ]);

        Http::fake([
            'zoom.test/oauth/token' => Http::response([
                'access_token' => 'zoom-access-token',
                'token_type' => 'bearer',
            ]),
            'api.zoom.test/v2/users/me/meetings' => Http::response([
                'id' => 987654321,
                'join_url' => 'https://zoom.test/j/987654321',
                'password' => 'abc123',
                'start_url' => 'https://zoom.test/s/987654321',
            ], 201),
        ]);

        $admin = User::factory()->admin()->create();
        $mentor = User::factory()->mentor()->create();
        ZoomAccount::factory()->create([
            'account_id' => 'zoom-account-id',
            'client_id' => 'zoom-client-id',
            'client_secret' => 'zoom-client-secret',
        ]);
        [$booking] = $this->scheduleFixture([
            'scheduled_at' => '2026-07-10 09:00:00',
            'duration' => 60,
        ]);

        $this->actingAs($admin)
            ->put(route('schedules.assignment.update', $booking), [
                'mentor_id' => $mentor->id,
            ])
            ->assertRedirect();

        $booking->refresh();

        $this->assertSame('https://zoom.test/j/987654321', $booking->zoom_link);
        $this->assertSame('987654321', $booking->zoom_meeting_id);
        $this->assertSame('abc123', $booking->zoom_passcode);
        $this->assertSame('https://zoom.test/s/987654321', $booking->zoom_start_url);
        Http::assertSentCount(2);
        Http::assertSent(function (Request $request): bool {
            if ($request->url() !== 'https://api.zoom.test/v2/users/me/meetings') {
                return false;
            }

            return $request->data()['settings']['auto_recording'] === 'cloud'
                && $request->data()['settings']['join_before_host'] === true
                && $request->data()['start_time'] === '2026-07-10T09:00:00'
                && $request->data()['timezone'] === 'Asia/Jakarta';
        });
    }

    public function test_admin_cannot_assign_when_all_zoom_accounts_are_full(): void
    {
        $admin = User::factory()->admin()->create();
        $mentor = User::factory()->mentor()->create();
        $zoomAccount = ZoomAccount::factory()->create();
        [$booking] = $this->scheduleFixture([
            'scheduled_at' => '2026-07-10 09:00:00',
            'duration' => 60,
        ]);

        $this->scheduleFixture([
            'scheduled_at' => '2026-07-10 09:15:00',
            'duration' => 60,
            'zoom_account_id' => $zoomAccount->id,
            'zoom_link' => 'https://zoom.us/j/full-1',
            'status' => 'assigned',
        ]);
        $this->scheduleFixture([
            'scheduled_at' => '2026-07-10 09:30:00',
            'duration' => 60,
            'zoom_account_id' => $zoomAccount->id,
            'zoom_link' => 'https://zoom.us/j/full-2',
            'status' => 'assigned',
        ]);

        $this->actingAs($admin)
            ->put(route('schedules.assignment.update', $booking), [
                'mentor_id' => $mentor->id,
            ])
            ->assertSessionHasErrors('mentor_id');

        $booking->refresh();

        $this->assertNull($booking->mentor_id);
        $this->assertNull($booking->zoom_account_id);
        $this->assertNull($booking->zoom_link);
        $this->assertSame('pending', $booking->status);
    }

    /**
     * @param  array<string, mixed>  $attributes
     * @return array{0: Schedule, 1: ProgramEnrollment}
     */
    private function scheduleFixture(array $attributes = []): array
    {
        $student = User::factory()->student()->create();
        $field = AcademicField::factory()->create();
        $subject = Subject::factory()->create();
        $program = Program::factory()->create();
        $variant = ProgramVariant::factory()->create([
            'field_id' => $field->id,
            'duration' => $attributes['duration'] ?? 60,
        ]);
        $program->subjects()->attach($subject);
        $enrollment = ProgramEnrollment::factory()->for($student)->create([
            'field_id' => $field->id,
            'program_id' => $program->id,
            'program_variant_id' => $variant->id,
        ]);

        $booking = Schedule::factory()->create([
            'duration' => 60,
            'program_enrollment_id' => $enrollment->id,
            'scheduled_at' => '2026-07-10 09:00:00',
            'subject_id' => $subject->id,
            'user_id' => $student->id,
            ...$attributes,
        ]);

        return [$booking, $enrollment];
    }

    /**
     * @param  array{session?: int, sessions_used?: int}  $attributes
     * @return array{0: ProgramEnrollment, 1: Subject, 2: User}
     */
    private function enrollmentFixture(array $attributes = []): array
    {
        $student = User::factory()->student()->create();
        $field = AcademicField::factory()->create();
        $subject = Subject::factory()->create();
        $program = Program::factory()->create();
        $variant = ProgramVariant::factory()->create([
            'duration' => 90,
            'field_id' => $field->id,
            'session' => $attributes['session'] ?? 4,
        ]);
        $program->subjects()->attach($subject);
        $enrollment = ProgramEnrollment::factory()->for($student)->create([
            'field_id' => $field->id,
            'program_id' => $program->id,
            'program_variant_id' => $variant->id,
            'sessions_used' => $attributes['sessions_used'] ?? 0,
        ]);

        return [$enrollment, $subject, $student];
    }
}
