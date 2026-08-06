<?php

namespace Tests\Feature;

use App\Models\AcademicField;
use App\Models\Program;
use App\Models\ProgramEnrollment;
use App\Models\ProgramVariant;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use LogicException;
use Tests\TestCase;

class EnrollmentHistoryTest extends TestCase
{
    use RefreshDatabase;

    public function test_enrollment_snapshots_are_created_from_master_data_and_never_follow_master_edits(): void
    {
        [$enrollment, $program, $field, $variant] = $this->createEnrollment([
            'program' => ['name' => 'Medical Academy'],
            'field' => ['name' => 'Saintek'],
            'variant' => [
                'name' => 'Intensive',
                'session' => 12,
                'duration' => 90,
                'price' => 2500000,
            ],
        ]);

        $this->assertDatabaseHas('program_enrollments', [
            'id' => $enrollment->id,
            'program_name_snapshot' => 'Medical Academy',
            'field_name_snapshot' => 'Saintek',
            'variant_name_snapshot' => 'Intensive',
            'sessions_snapshot' => 12,
            'duration_snapshot' => 90,
            'price_snapshot' => 2500000,
        ]);

        $program->update(['name' => 'Renamed Program']);
        $field->update(['name' => 'Renamed Field']);
        $variant->update([
            'name' => 'Renamed Variant',
            'session' => 20,
            'duration' => 120,
            'price' => 5000000,
        ]);

        $enrollment->refresh();

        $this->assertSame('Medical Academy', $enrollment->programNameAtEnrollment());
        $this->assertSame('Saintek', $enrollment->fieldNameAtEnrollment());
        $this->assertSame('Intensive', $enrollment->variantNameAtEnrollment());
        $this->assertSame(12, $enrollment->sessionsAtEnrollment());
        $this->assertSame(90, $enrollment->durationAtEnrollment());
        $this->assertSame('2500000.00', $enrollment->priceAtEnrollment());
        $this->assertSame(12, $enrollment->sessionsRemaining());
    }

    public function test_multiple_enrollments_for_the_same_program_are_preserved_separately(): void
    {
        [$firstEnrollment, $program, $field, $variant] = $this->createEnrollment();

        $secondEnrollment = ProgramEnrollment::factory()
            ->for($firstEnrollment->user)
            ->for($program)
            ->for($field, 'field')
            ->for($variant, 'variant')
            ->create(['start_date' => '2026-09-01']);

        $this->assertNotSame($firstEnrollment->id, $secondEnrollment->id);
        $this->assertDatabaseCount('program_enrollments', 2);
    }

    public function test_enrollment_history_cannot_be_deleted_through_eloquent(): void
    {
        [$enrollment] = $this->createEnrollment();

        $this->expectException(LogicException::class);

        $enrollment->delete();
    }

    public function test_enrollment_identity_and_snapshots_cannot_be_changed(): void
    {
        [$enrollment] = $this->createEnrollment();

        $this->expectException(LogicException::class);

        $enrollment->forceFill(['program_name_snapshot' => 'Tampered'])->save();
    }

    public function test_database_restricts_hard_deleting_a_user_with_enrollment_history(): void
    {
        [$enrollment] = $this->createEnrollment();

        $this->expectException(QueryException::class);

        $enrollment->user->delete();
    }

    public function test_database_restricts_force_deleting_program_master_data_with_enrollment_history(): void
    {
        [, $program] = $this->createEnrollment();

        $this->expectException(QueryException::class);

        $program->forceDelete();
    }

    public function test_database_restricts_force_deleting_field_master_data_with_enrollment_history(): void
    {
        [, , $field] = $this->createEnrollment();

        $this->expectException(QueryException::class);

        $field->forceDelete();
    }

    public function test_database_restricts_force_deleting_variant_master_data_with_enrollment_history(): void
    {
        [, , , $variant] = $this->createEnrollment();

        $this->expectException(QueryException::class);

        $variant->forceDelete();
    }

    /**
     * @param  array{program?: array<string, mixed>, field?: array<string, mixed>, variant?: array<string, mixed>}  $attributes
     * @return array{ProgramEnrollment, Program, AcademicField, ProgramVariant}
     */
    private function createEnrollment(array $attributes = []): array
    {
        $user = User::factory()->student()->create();
        $program = Program::factory()->create($attributes['program'] ?? []);
        $field = AcademicField::factory()->create($attributes['field'] ?? []);
        $variant = ProgramVariant::factory()
            ->for($field, 'field')
            ->create($attributes['variant'] ?? []);
        $enrollment = ProgramEnrollment::factory()
            ->for($user)
            ->for($program)
            ->for($field, 'field')
            ->for($variant, 'variant')
            ->create();

        return [$enrollment, $program, $field, $variant];
    }
}
