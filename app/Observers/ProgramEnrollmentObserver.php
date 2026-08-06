<?php

namespace App\Observers;

use App\Models\AcademicField;
use App\Models\Program;
use App\Models\ProgramEnrollment;
use App\Models\ProgramVariant;
use LogicException;

class ProgramEnrollmentObserver
{
    public function creating(ProgramEnrollment $programEnrollment): void
    {
        $program = Program::withTrashed()->findOrFail($programEnrollment->program_id);
        $field = AcademicField::withTrashed()->findOrFail($programEnrollment->field_id);
        $variant = ProgramVariant::withTrashed()->findOrFail($programEnrollment->program_variant_id);

        $programEnrollment->forceFill([
            'program_name_snapshot' => $program->name,
            'field_name_snapshot' => $field->name,
            'variant_name_snapshot' => $variant->name,
            'sessions_snapshot' => $variant->session,
            'duration_snapshot' => $variant->duration,
            'price_snapshot' => $variant->price,
        ]);
    }

    public function deleting(ProgramEnrollment $programEnrollment): void
    {
        throw new LogicException('Program enrollment history cannot be deleted.');
    }

    public function updating(ProgramEnrollment $programEnrollment): void
    {
        $immutableAttributes = [
            'user_id',
            'program_id',
            'field_id',
            'program_variant_id',
            'program_name_snapshot',
            'field_name_snapshot',
            'variant_name_snapshot',
            'sessions_snapshot',
            'duration_snapshot',
            'price_snapshot',
        ];

        if ($programEnrollment->isDirty($immutableAttributes)) {
            throw new LogicException('Program enrollment identity and snapshots cannot be changed.');
        }
    }
}
