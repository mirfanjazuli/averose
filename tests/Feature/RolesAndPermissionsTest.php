<?php

namespace Tests\Feature;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use App\Support\PermissionRegistry;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class RolesAndPermissionsTest extends TestCase
{
    use RefreshDatabase;

    public function test_super_admin_can_access_admin_dashboard_without_dynamic_role(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)
            ->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn (Assert $page): Assert => $page
                ->component('admin/dashboard/index')
                ->where('auth.user.permissions.0', PermissionRegistry::keys()[0])
            );
    }

    public function test_internal_admin_without_permission_is_forbidden(): void
    {
        $role = Role::factory()->create();
        $admin = User::factory()->admin()->create([
            'role_id' => $role->id,
        ]);

        $this->actingAs($admin)
            ->get(route('dashboard'))
            ->assertForbidden();

        $this->actingAs($admin)
            ->get(route('fields'))
            ->assertForbidden();
    }

    public function test_internal_admin_with_view_permission_cannot_run_create_action(): void
    {
        $admin = $this->internalAdminWithPermissions(['fields.view']);

        $this->actingAs($admin)
            ->get(route('fields'))
            ->assertOk();

        $this->actingAs($admin)
            ->post(route('fields.store'), [
                'description' => null,
                'name' => 'Saintek',
                'status' => 'active',
            ])
            ->assertForbidden();
    }

    public function test_internal_admin_with_action_permission_can_run_action(): void
    {
        $admin = $this->internalAdminWithPermissions(['fields.create']);

        $this->actingAs($admin)
            ->post(route('fields.store'), [
                'description' => null,
                'name' => 'Saintek',
                'status' => 'active',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('fields', [
            'name' => 'Saintek',
        ]);
    }

    public function test_roles_can_be_created_and_assigned_to_internal_users(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)
            ->post(route('roles.store'), [
                'description' => 'Can manage academics.',
                'name' => 'Academic Admin',
                'permissions' => ['fields.view', 'fields.create'],
                'status' => 'active',
            ])
            ->assertRedirect();

        $role = Role::query()->where('slug', 'academic-admin')->firstOrFail();

        $this->assertSame(
            ['fields.create', 'fields.view'],
            $role->permissions()->orderBy('key')->pluck('key')->sort()->values()->all(),
        );

        $this->actingAs($admin)
            ->post(route('internal.store'), [
                'email' => 'academic@example.com',
                'name' => 'Academic Staff',
                'role_id' => $role->id,
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('users', [
            'email' => 'academic@example.com',
            'role_id' => $role->id,
        ]);
    }

    public function test_system_role_cannot_be_deactivated(): void
    {
        $admin = User::factory()->admin()->create();
        $role = Role::factory()->system()->create([
            'slug' => 'system-role',
        ]);

        $this->actingAs($admin)
            ->delete(route('roles.destroy', $role))
            ->assertStatus(422);

        $this->assertDatabaseHas('roles', [
            'id' => $role->id,
        ]);
    }

    public function test_sidebar_permissions_are_shared_for_internal_admin(): void
    {
        $admin = $this->internalAdminWithPermissions([
            'dashboard.view',
            'students.view',
        ]);

        $this->actingAs($admin)
            ->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn (Assert $page): Assert => $page
                ->component('admin/dashboard/index')
                ->where('auth.user.permissions', ['dashboard.view', 'students.view'])
            );
    }

    /**
     * @param  list<string>  $permissionKeys
     */
    private function internalAdminWithPermissions(array $permissionKeys): User
    {
        $role = Role::factory()->create();
        $permissions = collect(PermissionRegistry::permissions())
            ->whereIn('key', $permissionKeys)
            ->map(fn (array $permission): Permission => Permission::query()->create([
                'description' => $permission['description'],
                'group' => $permission['group'],
                'key' => $permission['key'],
                'label' => $permission['label'],
            ]));

        $role->permissions()->sync($permissions->pluck('id')->all());

        return User::factory()->admin()->create([
            'role_id' => $role->id,
        ]);
    }
}
