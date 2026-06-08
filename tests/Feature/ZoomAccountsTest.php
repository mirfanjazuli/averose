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
use Illuminate\Support\Facades\Schema;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ZoomAccountsTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_to_the_login_page(): void
    {
        $response = $this->get(route('zoom-accounts'));

        $response->assertRedirect(route('login'));
    }

    public function test_admin_users_can_visit_the_zoom_accounts_page(): void
    {
        $user = User::factory()->admin()->create();

        $this->actingAs($user);

        $response = $this->get(route('zoom-accounts'));

        $response
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/integrations/zoom-accounts')
                ->has('accounts'));
    }

    public function test_zoom_accounts_page_shows_nearest_full_account_release(): void
    {
        $this->travelTo('2026-07-10 09:30:00');

        $user = User::factory()->admin()->create();
        $firstFullAccount = ZoomAccount::factory()->create([
            'name' => 'First Full Zoom',
        ]);
        $secondFullAccount = ZoomAccount::factory()->create([
            'name' => 'Second Full Zoom',
        ]);

        SessionBooking::factory()->create([
            'duration' => 60,
            'scheduled_at' => '2026-07-10 09:00:00',
            'status' => 'assigned',
            'zoom_account_id' => $firstFullAccount->id,
        ]);
        SessionBooking::factory()->create([
            'duration' => 120,
            'scheduled_at' => '2026-07-10 09:15:00',
            'status' => 'assigned',
            'zoom_account_id' => $firstFullAccount->id,
        ]);
        SessionBooking::factory()->create([
            'duration' => 120,
            'scheduled_at' => '2026-07-10 09:00:00',
            'status' => 'assigned',
            'zoom_account_id' => $secondFullAccount->id,
        ]);
        SessionBooking::factory()->create([
            'duration' => 120,
            'scheduled_at' => '2026-07-10 09:10:00',
            'status' => 'assigned',
            'zoom_account_id' => $secondFullAccount->id,
        ]);

        $this->actingAs($user)
            ->get(route('zoom-accounts'))
            ->assertOk()
            ->assertInertia(fn (Assert $page): Assert => $page
                ->component('admin/integrations/zoom-accounts')
                ->where('capacity.fullAccounts', 2)
                ->where('capacity.nearestRelease.name', 'First Full Zoom')
                ->where('capacity.nearestRelease.releaseAt', 'Jul 10, 2026 10:00')
            );
    }

    public function test_admin_users_can_visit_a_zoom_account_detail_page(): void
    {
        $user = User::factory()->admin()->create();
        $account = ZoomAccount::factory()->create([
            'name' => 'AveRose Detail Room',
            'account_id' => 'detail-account',
            'client_id' => 'detail-client',
            'client_secret' => 'detail-client-secret',
            'token_secret' => 'detail-token-secret',
        ]);

        $this->assertSame('averose-detail-room', $account->slug);

        $response = $this->actingAs($user)->get(route('zoom-accounts.show', $account));

        $response
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/integrations/zoom-account-detail')
                ->where('account.name', 'AveRose Detail Room')
                ->where('account.slug', 'averose-detail-room')
                ->where('account.accountId', 'detail-account')
                ->where('account.clientId', 'detail-client')
                ->where('account.clientSecret', 'detail-client-secret')
                ->where('account.tokenSecret', 'detail-token-secret')
                ->where('breadcrumbs.0.title', 'Zoom Accounts')
                ->where('breadcrumbs.1.title', 'AveRose Detail Room')
                ->missing('breadcrumbs.2'));
    }

    public function test_zoom_account_detail_lists_scheduled_meetings(): void
    {
        $user = User::factory()->admin()->create();
        $mentor = User::factory()->mentor()->create([
            'name' => 'Raka Mentor',
        ]);
        $student = User::factory()->student()->create([
            'name' => 'Sinta Student',
        ]);
        $account = ZoomAccount::factory()->create();
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
        $program->subjects()->attach($subject);
        $enrollment = ProgramEnrollment::factory()->for($student)->create([
            'field_id' => $field->id,
            'program_id' => $program->id,
            'program_variant_id' => $variant->id,
        ]);

        SessionBooking::factory()->create([
            'duration' => 90,
            'mentor_id' => $mentor->id,
            'program_enrollment_id' => $enrollment->id,
            'scheduled_at' => '2026-07-10 13:00:00',
            'status' => 'assigned',
            'subject_id' => $subject->id,
            'user_id' => $student->id,
            'zoom_account_id' => $account->id,
            'zoom_link' => 'https://zoom.test/j/123',
            'zoom_meeting_id' => '123',
        ]);
        SessionBooking::factory()->create([
            'duration' => 60,
            'mentor_id' => $mentor->id,
            'program_enrollment_id' => $enrollment->id,
            'scheduled_at' => now()->subDay(),
            'status' => 'assigned',
            'subject_id' => $subject->id,
            'user_id' => $student->id,
            'zoom_account_id' => $account->id,
            'zoom_link' => 'https://zoom.test/j/past',
            'zoom_meeting_id' => 'past',
        ]);

        $this->actingAs($user)
            ->get(route('zoom-accounts.show', $account))
            ->assertOk()
            ->assertInertia(fn (Assert $page): Assert => $page
                ->component('admin/integrations/zoom-account-detail')
                ->where('meetings.0.title', 'IELTS Speaking')
                ->where('meetings.0.student', 'Sinta Student')
                ->where('meetings.0.mentor', 'Raka Mentor')
                ->where('meetings.0.program', 'IELTS Intensive')
                ->where('meetings.0.meetingId', '123')
                ->where('meetings.0.status', 'Assigned')
                ->where('meetings.0.timingGroup', 'upcoming')
                ->missing('meetings.1')
            );
    }

    public function test_zoom_accounts_table_has_required_columns(): void
    {
        $this->assertTrue(Schema::hasTable('zoom_accounts'));
        $this->assertTrue(Schema::hasColumns('zoom_accounts', [
            'id',
            'name',
            'slug',
            'account_id',
            'client_id',
            'client_secret',
            'token_secret',
            'created_at',
            'updated_at',
        ]));
    }

    public function test_admin_users_can_store_zoom_accounts(): void
    {
        $user = User::factory()->admin()->create();

        $response = $this->actingAs($user)->post(route('zoom-accounts.store'), [
            'name' => 'AveRose Main Room',
            'account_id' => 'account-123',
            'client_id' => 'client-123',
            'client_secret' => 'client-secret-value',
            'token_secret' => 'token-secret-value',
        ]);

        $response->assertRedirect();

        $this->assertDatabaseHas('zoom_accounts', [
            'name' => 'AveRose Main Room',
            'slug' => 'averose-main-room',
            'account_id' => 'account-123',
            'client_id' => 'client-123',
        ]);

        $account = ZoomAccount::firstWhere('account_id', 'account-123');

        $this->assertSame('client-secret-value', $account->client_secret);
        $this->assertSame('token-secret-value', $account->token_secret);
    }

    public function test_zoom_account_credentials_are_required(): void
    {
        $user = User::factory()->admin()->create();

        $response = $this->actingAs($user)->post(route('zoom-accounts.store'), [
            'name' => '',
            'account_id' => '',
            'client_id' => '',
            'client_secret' => '',
            'token_secret' => '',
        ]);

        $response->assertSessionHasErrors([
            'name',
            'account_id',
            'client_id',
            'client_secret',
            'token_secret',
        ]);
    }

    public function test_admin_users_can_update_zoom_accounts(): void
    {
        $user = User::factory()->admin()->create();
        $account = ZoomAccount::factory()->create([
            'client_secret' => 'existing-client-secret',
            'token_secret' => 'existing-token-secret',
        ]);

        $response = $this->actingAs($user)->put(route('zoom-accounts.update', $account), [
            'name' => 'AveRose Updated Room',
            'account_id' => 'updated-account',
            'client_id' => 'updated-client',
            'client_secret' => '',
            'token_secret' => 'new-token-secret',
        ]);

        $response->assertRedirect();

        $account->refresh();

        $this->assertSame('AveRose Updated Room', $account->name);
        $this->assertSame('averose-updated-room', $account->slug);
        $this->assertSame('updated-account', $account->account_id);
        $this->assertSame('updated-client', $account->client_id);
        $this->assertSame('existing-client-secret', $account->client_secret);
        $this->assertSame('new-token-secret', $account->token_secret);
    }

    public function test_admin_users_are_redirected_to_the_updated_detail_slug_when_updating_from_detail(): void
    {
        $user = User::factory()->admin()->create();
        $account = ZoomAccount::factory()->create([
            'name' => 'Old Zoom Room',
            'account_id' => 'old-account',
            'client_id' => 'old-client',
            'client_secret' => 'old-client-secret',
            'token_secret' => 'old-token-secret',
        ]);

        $response = $this->actingAs($user)->put(route('zoom-accounts.update', [
            'zoom_account' => $account,
            'redirect' => 'detail',
        ]), [
            'name' => 'New Zoom Room',
            'account_id' => 'new-account',
            'client_id' => 'new-client',
            'client_secret' => 'new-client-secret',
            'token_secret' => 'new-token-secret',
        ]);

        $account->refresh();

        $response->assertRedirect(route('zoom-accounts.show', $account));

        $this->assertSame('new-zoom-room', $account->slug);
    }

    public function test_admin_users_can_delete_zoom_accounts(): void
    {
        $user = User::factory()->admin()->create();
        $account = ZoomAccount::factory()->create();

        $response = $this->actingAs($user)->delete(route('zoom-accounts.destroy', $account));

        $response->assertRedirect();

        $this->assertDatabaseMissing('zoom_accounts', [
            'id' => $account->id,
        ]);
    }
}
