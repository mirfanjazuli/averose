<?php

namespace Tests\Feature;

use App\Models\AcademicField;
use App\Models\Program;
use App\Models\ProgramEnrollment;
use App\Models\ProgramVariant;
use App\Models\SessionBooking;
use App\Models\Subject;
use App\Models\User;
use App\Models\ZoomAccount;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AdminSessionAssignmentTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config(['services.zoom.create_real_meetings' => false]);
    }

    public function test_admin_schedules_receive_database_sessions_and_mentor_options(): void
    {
        $admin = User::factory()->admin()->create();
        $mentor = User::factory()->mentor()->create([
            'name' => 'Raka Mentor',
        ]);
        $zoomAccount = ZoomAccount::factory()->create([
            'name' => 'Main Zoom',
        ]);
        [$booking] = $this->bookingFixture([
            'scheduled_at' => '2026-07-10 09:00:00',
            'status' => 'pending',
            'zoom_account_id' => $zoomAccount->id,
            'zoom_link' => 'https://zoom.test/j/main',
        ]);

        $this->actingAs($admin)
            ->get(route('schedules'))
            ->assertOk()
            ->assertInertia(fn (Assert $page): Assert => $page
                ->component('admin/schedules/index')
                ->where('sessions.0.id', (string) $booking->id)
                ->where('sessions.0.status', 'Pending')
                ->where('sessions.0.zoomAccount', 'Main Zoom')
                ->where('sessions.0.zoomAccountSlug', $zoomAccount->slug)
                ->where('mentors.0.id', (string) $mentor->id)
                ->where('mentors.0.name', 'Raka Mentor')
            );
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
        [$booking] = $this->bookingFixture([
            'scheduled_at' => '2026-07-10 09:00:00',
            'duration' => 60,
        ]);

        $this->bookingFixture([
            'scheduled_at' => '2026-07-10 09:15:00',
            'duration' => 60,
            'zoom_account_id' => $busyAccount->id,
            'zoom_link' => 'https://zoom.us/j/busy-1',
            'status' => 'assigned',
        ]);
        $this->bookingFixture([
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
        [$booking] = $this->bookingFixture([
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
        [$booking] = $this->bookingFixture([
            'scheduled_at' => '2026-07-10 09:00:00',
            'duration' => 60,
        ]);

        $this->bookingFixture([
            'scheduled_at' => '2026-07-10 09:15:00',
            'duration' => 60,
            'zoom_account_id' => $zoomAccount->id,
            'zoom_link' => 'https://zoom.us/j/full-1',
            'status' => 'assigned',
        ]);
        $this->bookingFixture([
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
     * @return array{0: SessionBooking, 1: ProgramEnrollment}
     */
    private function bookingFixture(array $attributes = []): array
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

        $booking = SessionBooking::factory()->create([
            'duration' => 60,
            'program_enrollment_id' => $enrollment->id,
            'scheduled_at' => '2026-07-10 09:00:00',
            'subject_id' => $subject->id,
            'user_id' => $student->id,
            ...$attributes,
        ]);

        return [$booking, $enrollment];
    }
}
