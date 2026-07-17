<?php

namespace App\Support;

class PermissionRegistry
{
    /**
     * @return array<string, array<int, array{key: string, label: string, description: string}>>
     */
    public static function grouped(): array
    {
        return [
            'Dashboard' => [
                ['key' => 'dashboard.view', 'label' => 'View dashboard', 'description' => 'Open the admin dashboard.'],
                ['key' => 'dashboard.export_pdf', 'label' => 'Export dashboard PDF', 'description' => 'Download dashboard reports as PDF.'],
            ],
            'Scheduling' => [
                ['key' => 'schedules.view', 'label' => 'View schedules', 'description' => 'Open schedule management pages.'],
                ['key' => 'schedules.assign', 'label' => 'Assign mentor', 'description' => 'Assign mentors to schedules.'],
                ['key' => 'reschedule_requests.approve', 'label' => 'Approve reschedule requests', 'description' => 'Approve student reschedule requests.'],
                ['key' => 'reschedule_requests.reject', 'label' => 'Reject reschedule requests', 'description' => 'Reject student reschedule requests.'],
            ],
            'Students' => [
                ['key' => 'students.view', 'label' => 'View students', 'description' => 'Open student list and detail pages.'],
                ['key' => 'students.create', 'label' => 'Create students', 'description' => 'Create student accounts.'],
                ['key' => 'students.update', 'label' => 'Update students', 'description' => 'Edit student accounts.'],
                ['key' => 'students.delete', 'label' => 'Deactivate students', 'description' => 'Deactivate student accounts.'],
                ['key' => 'students.manage_enrollments', 'label' => 'Manage enrollments', 'description' => 'Add student program enrollments.'],
                ['key' => 'students.manage_try_out_access', 'label' => 'Manage try out access', 'description' => 'Grant or remove private try out access.'],
            ],
            'Mentors' => [
                ['key' => 'mentors.view', 'label' => 'View mentors', 'description' => 'Open mentor list and detail pages.'],
                ['key' => 'mentors.create', 'label' => 'Create mentors', 'description' => 'Create mentor accounts.'],
                ['key' => 'mentors.update', 'label' => 'Update mentors', 'description' => 'Edit mentor accounts.'],
                ['key' => 'mentors.delete', 'label' => 'Deactivate mentors', 'description' => 'Deactivate mentor accounts.'],
            ],
            'Internal Users' => [
                ['key' => 'internal.view', 'label' => 'View internal users', 'description' => 'Open internal user list.'],
                ['key' => 'internal.create', 'label' => 'Create internal users', 'description' => 'Create internal user accounts.'],
                ['key' => 'internal.update', 'label' => 'Update internal users', 'description' => 'Edit internal user accounts and roles.'],
                ['key' => 'internal.delete', 'label' => 'Deactivate internal users', 'description' => 'Deactivate internal user accounts.'],
            ],
            'Roles & Permissions' => [
                ['key' => 'roles.view', 'label' => 'View roles', 'description' => 'Open roles and permissions.'],
                ['key' => 'roles.create', 'label' => 'Create roles', 'description' => 'Create internal roles.'],
                ['key' => 'roles.update', 'label' => 'Update roles', 'description' => 'Edit role permissions.'],
                ['key' => 'roles.delete', 'label' => 'Deactivate roles', 'description' => 'Deactivate non-system roles.'],
            ],
            'Academics' => [
                ['key' => 'fields.view', 'label' => 'View fields', 'description' => 'Open academic fields.'],
                ['key' => 'fields.create', 'label' => 'Create fields', 'description' => 'Create academic fields.'],
                ['key' => 'fields.update', 'label' => 'Update fields', 'description' => 'Edit academic fields.'],
                ['key' => 'fields.delete', 'label' => 'Deactivate fields', 'description' => 'Deactivate academic fields.'],
                ['key' => 'programs.view', 'label' => 'View programs', 'description' => 'Open academic programs.'],
                ['key' => 'programs.create', 'label' => 'Create programs', 'description' => 'Create academic programs.'],
                ['key' => 'programs.update', 'label' => 'Update programs', 'description' => 'Edit academic programs.'],
                ['key' => 'programs.delete', 'label' => 'Deactivate programs', 'description' => 'Deactivate academic programs.'],
                ['key' => 'subjects.view', 'label' => 'View subjects', 'description' => 'Open subjects.'],
                ['key' => 'subjects.create', 'label' => 'Create subjects', 'description' => 'Create subjects.'],
                ['key' => 'subjects.update', 'label' => 'Update subjects', 'description' => 'Edit subjects.'],
                ['key' => 'subjects.delete', 'label' => 'Deactivate subjects', 'description' => 'Deactivate subjects.'],
            ],
            'Try Outs' => [
                ['key' => 'try_outs.view', 'label' => 'View try outs', 'description' => 'Open try out pages.'],
                ['key' => 'try_outs.create', 'label' => 'Create try outs', 'description' => 'Create try outs through import.'],
                ['key' => 'try_outs.update', 'label' => 'Update try outs', 'description' => 'Edit try out metadata.'],
                ['key' => 'try_outs.publish', 'label' => 'Publish try outs', 'description' => 'Publish draft try outs.'],
                ['key' => 'try_outs.unpublish', 'label' => 'Unpublish try outs', 'description' => 'Return try outs to draft.'],
                ['key' => 'try_outs.import', 'label' => 'Import try outs', 'description' => 'Generate and confirm try out imports.'],
                ['key' => 'try_outs.manage_questions', 'label' => 'Manage questions', 'description' => 'Edit try out questions and assets.'],
                ['key' => 'try_outs.manage_groups', 'label' => 'Manage groups', 'description' => 'Create and deactivate try out groups.'],
                ['key' => 'try_outs.view_leaderboard', 'label' => 'View leaderboard', 'description' => 'Open try out leaderboards.'],
            ],
            'Monitoring' => [
                ['key' => 'mentor_journals.view', 'label' => 'View mentor journals', 'description' => 'Open mentor journal monitoring.'],
                ['key' => 'recordings.view', 'label' => 'View recordings', 'description' => 'Open recording management.'],
                ['key' => 'recordings.create', 'label' => 'Create recordings', 'description' => 'Add manual recording links.'],
                ['key' => 'recordings.deactivate', 'label' => 'Deactivate recordings', 'description' => 'Deactivate recording links.'],
            ],
            'Integrations' => [
                ['key' => 'zoom_accounts.view', 'label' => 'View Zoom accounts', 'description' => 'Open Zoom accounts.'],
                ['key' => 'zoom_accounts.create', 'label' => 'Create Zoom accounts', 'description' => 'Create Zoom accounts.'],
                ['key' => 'zoom_accounts.update', 'label' => 'Update Zoom accounts', 'description' => 'Edit Zoom accounts.'],
                ['key' => 'zoom_accounts.delete', 'label' => 'Deactivate Zoom accounts', 'description' => 'Deactivate Zoom accounts.'],
            ],
        ];
    }

    /**
     * @return list<string>
     */
    public static function keys(): array
    {
        return collect(self::grouped())
            ->flatten(1)
            ->pluck('key')
            ->values()
            ->all();
    }

    /**
     * @return array<int, array{key: string, group: string, label: string, description: string}>
     */
    public static function permissions(): array
    {
        return collect(self::grouped())
            ->flatMap(fn (array $permissions, string $group): array => array_map(
                fn (array $permission): array => [...$permission, 'group' => $group],
                $permissions,
            ))
            ->values()
            ->all();
    }
}
