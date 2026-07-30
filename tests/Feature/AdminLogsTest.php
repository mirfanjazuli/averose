<?php

namespace Tests\Feature;

use App\Models\ActivityLog;
use App\Models\Role;
use App\Models\User;
use App\Models\ZoomAccount;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AdminLogsTest extends TestCase
{
    use RefreshDatabase;

    public function test_super_admin_can_view_activity_logs(): void
    {
        $admin = User::factory()->admin()->create();
        ActivityLog::query()->create([
            'action' => 'Update',
            'description' => "{$admin->name} memperbarui field Saintek.",
            'method' => 'PUT',
            'path' => 'academics/fields/saintek',
            'route_name' => 'fields.update',
            'status_code' => 302,
            'user_email' => $admin->email,
            'user_id' => $admin->id,
            'user_name' => $admin->name,
            'user_role' => 'admin',
        ]);

        $this->actingAs($admin)
            ->get(route('logs'))
            ->assertOk()
            ->assertInertia(fn (Assert $page): Assert => $page
                ->component('admin/logs/index')
                ->where('logs.0.action', 'Update')
                ->where('logs.0.description', "{$admin->name} memperbarui field Saintek.")
                ->where('logs.0.routeName', 'fields.update')
                ->where('summary.updated', 1)
            );
    }

    public function test_internal_admin_without_logs_permission_is_forbidden(): void
    {
        $role = Role::factory()->create();
        $admin = User::factory()->admin()->create([
            'role_id' => $role->id,
        ]);

        $this->actingAs($admin)
            ->get(route('logs'))
            ->assertForbidden();
    }

    public function test_successful_mutation_request_records_activity_with_sensitive_fields_filtered(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)
            ->post(route('zoom-accounts.store'), [
                'account_id' => 'account-1',
                'client_id' => 'client-1',
                'client_secret' => 'very-secret',
                'name' => 'Main Zoom',
                'token_secret' => 'token-secret',
            ])
            ->assertRedirect();

        $log = ActivityLog::query()->firstOrFail();

        $this->assertSame($admin->id, $log->user_id);
        $this->assertSame('Create', $log->action);
        $this->assertStringContainsString('menambahkan Zoom account Main Zoom', $log->description);
        $this->assertSame('zoom-accounts.store', $log->route_name);
        $this->assertSame('[filtered]', $log->properties['input']['client_secret']);
        $this->assertSame('[filtered]', $log->properties['input']['token_secret']);
    }

    public function test_login_and_logout_are_recorded_as_activity(): void
    {
        $user = User::factory()->student()->create([
            'email' => 'student@example.com',
        ]);

        $this->post(route('login.store'), [
            'email' => 'student@example.com',
            'password' => 'password',
        ])->assertRedirect();

        $this->post(route('logout'))->assertRedirect();

        $this->assertDatabaseHas('activity_logs', [
            'action' => 'Login',
            'user_id' => $user->id,
        ]);

        $this->assertDatabaseHas('activity_logs', [
            'action' => 'Logout',
            'user_id' => $user->id,
        ]);

        $this->assertStringContainsString(
            'berhasil login.',
            ActivityLog::query()->where('action', 'Login')->firstOrFail()->description,
        );
    }

    public function test_activate_requests_are_recorded_as_activate_activity(): void
    {
        $admin = User::factory()->admin()->create();
        $account = ZoomAccount::factory()->inactive()->create([
            'name' => 'Backup Zoom',
        ]);

        $this->actingAs($admin)
            ->put(route('zoom-accounts.activate', $account))
            ->assertRedirect();

        $log = ActivityLog::query()->where('action', 'Activate')->firstOrFail();

        $this->assertSame('zoom-accounts.activate', $log->route_name);
        $this->assertStringContainsString('mengaktifkan Zoom account Backup Zoom', $log->description);
    }
}
