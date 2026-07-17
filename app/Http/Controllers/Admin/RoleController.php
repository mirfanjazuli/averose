<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Permission;
use App\Models\Role;
use App\Support\PermissionRegistry;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class RoleController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('admin/users/roles/index', [
            'permissionGroups' => PermissionRegistry::grouped(),
            'roles' => Role::query()
                ->with('permissions:id,key')
                ->withCount('users')
                ->latest()
                ->get()
                ->map(fn (Role $role): array => $this->serializeRole($role))
                ->all(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $this->validateRole($request);
        $role = Role::query()->create([
            'description' => $validated['description'] ?? null,
            'is_system' => false,
            'name' => $validated['name'],
            'slug' => $this->uniqueSlug($validated['name']),
            'status' => $validated['status'],
        ]);

        $this->syncPermissions($role, $validated['permissions'] ?? []);

        return back()->with('success', 'Role created successfully.');
    }

    public function update(Request $request, Role $role): RedirectResponse
    {
        $validated = $this->validateRole($request);
        $role->update([
            'description' => $validated['description'] ?? null,
            'name' => $validated['name'],
            'slug' => $role->is_system ? $role->slug : $this->uniqueSlug($validated['name'], $role),
            'status' => $validated['status'],
        ]);

        $this->syncPermissions($role, $validated['permissions'] ?? []);

        return back()->with('success', 'Role updated successfully.');
    }

    public function destroy(Role $role): RedirectResponse
    {
        abort_if($role->is_system, 422, 'System roles cannot be deactivated.');

        $role->update(['status' => 'inactive']);

        return back()->with('success', 'Role deactivated successfully.');
    }

    /**
     * @return array{name: string, description?: string|null, status: string, permissions?: array<int, string>}
     */
    private function validateRole(Request $request): array
    {
        return $request->validate([
            'description' => ['nullable', 'string', 'max:4000'],
            'name' => ['required', 'string', 'max:255'],
            'permissions' => ['array'],
            'permissions.*' => ['string', Rule::in(PermissionRegistry::keys())],
            'status' => ['required', Rule::in(['active', 'inactive'])],
        ]);
    }

    /**
     * @param  array<int, string>  $permissionKeys
     */
    private function syncPermissions(Role $role, array $permissionKeys): void
    {
        $permissionIds = collect(PermissionRegistry::permissions())
            ->whereIn('key', $permissionKeys)
            ->map(function (array $permission): int {
                return Permission::query()->firstOrCreate(
                    ['key' => $permission['key']],
                    [
                        'description' => $permission['description'],
                        'group' => $permission['group'],
                        'label' => $permission['label'],
                    ],
                )->id;
            })
            ->all();

        $role->permissions()->sync($permissionIds);
    }

    private function uniqueSlug(string $name, ?Role $role = null): string
    {
        $baseSlug = Str::slug($name) ?: 'role';
        $slug = $baseSlug;
        $counter = 2;

        while (Role::query()
            ->where('slug', $slug)
            ->when($role?->exists, fn ($query) => $query->whereKeyNot($role->getKey()))
            ->exists()) {
            $slug = "{$baseSlug}-{$counter}";
            $counter++;
        }

        return $slug;
    }

    private function serializeRole(Role $role): array
    {
        return [
            'description' => $role->description,
            'id' => $role->id,
            'isSystem' => $role->is_system,
            'name' => $role->name,
            'permissions' => $role->permissions->pluck('key')->values()->all(),
            'slug' => $role->slug,
            'status' => $role->status,
            'usersCount' => $role->users_count,
        ];
    }
}
