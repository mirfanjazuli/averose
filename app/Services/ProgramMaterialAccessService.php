<?php

namespace App\Services;

use App\Models\Program;
use App\Models\ProgramMaterial;
use App\Models\User;

class ProgramMaterialAccessService
{
    public function hasLifetimeAccess(User $user, Program|int $program): bool
    {
        if (! $user->isStudent()) {
            return false;
        }

        $programId = $program instanceof Program ? $program->getKey() : $program;

        return $user->programEnrollments()
            ->where('program_id', $programId)
            ->exists();
    }

    public function canView(User $user, ProgramMaterial $material): bool
    {
        if ($user->isAdmin()) {
            return $user->hasPermission('programs.view');
        }

        return $material->status === 'active'
            && $this->hasLifetimeAccess($user, $material->program_id);
    }
}
