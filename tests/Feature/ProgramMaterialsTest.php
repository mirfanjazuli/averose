<?php

namespace Tests\Feature;

use App\Models\AcademicField;
use App\Models\Program;
use App\Models\ProgramEnrollment;
use App\Models\ProgramMaterial;
use App\Models\ProgramVariant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ProgramMaterialsTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_upload_multiple_program_materials_to_r2(): void
    {
        Storage::fake('r2');
        $admin = User::factory()->admin()->create();
        $program = Program::factory()->create(['name' => 'Medical Academy']);

        $this->actingAs($admin)
            ->post(route('programs.materials.store', $program), [
                'materials' => [
                    UploadedFile::fake()->create('Anatomy Guide.pdf', 500, 'application/pdf'),
                    UploadedFile::fake()->image('Diagram.png', 800, 600),
                ],
            ])
            ->assertRedirect();

        $materials = $program->materials()->orderBy('id')->get();

        $this->assertCount(2, $materials);
        $this->assertSame('Anatomy Guide', $materials[0]->title);
        $this->assertSame('active', $materials[0]->status);
        $this->assertSame($admin->id, $materials[0]->uploaded_by);

        foreach ($materials as $material) {
            $this->assertStringStartsWith(
                "programs/{$program->slug}/materials/",
                $material->path,
            );
            Storage::disk('r2')->assertExists($material->path);
        }
    }

    public function test_material_upload_validation_prevents_partial_uploads(): void
    {
        Storage::fake('r2');
        $admin = User::factory()->admin()->create();
        $program = Program::factory()->create();

        $this->actingAs($admin)
            ->post(route('programs.materials.store', $program), [
                'materials' => collect(range(1, 11))
                    ->map(fn (int $number): UploadedFile => UploadedFile::fake()->create("file-{$number}.pdf", 10, 'application/pdf'))
                    ->all(),
            ])
            ->assertSessionHasErrors('materials');

        $this->assertDatabaseCount('program_materials', 0);
        $this->assertSame([], Storage::disk('r2')->allFiles());
    }

    public function test_material_upload_rejects_unsupported_and_oversized_files(): void
    {
        Storage::fake('r2');
        $admin = User::factory()->admin()->create();
        $program = Program::factory()->create();

        $this->actingAs($admin)
            ->post(route('programs.materials.store', $program), [
                'materials' => [
                    UploadedFile::fake()->create('archive.zip', 10, 'application/zip'),
                ],
            ])
            ->assertSessionHasErrors('materials.0');

        $this->actingAs($admin)
            ->post(route('programs.materials.store', $program), [
                'materials' => [
                    UploadedFile::fake()->create('large.pdf', 25601, 'application/pdf'),
                ],
            ])
            ->assertSessionHasErrors('materials.0');

        $this->assertDatabaseCount('program_materials', 0);
        $this->assertSame([], Storage::disk('r2')->allFiles());
    }

    public function test_admin_can_edit_and_deactivate_material_without_deleting_object(): void
    {
        Storage::fake('r2');
        $admin = User::factory()->admin()->create();
        $program = Program::factory()->create();
        $material = ProgramMaterial::factory()->for($program)->create();
        Storage::disk('r2')->put($material->path, 'content');

        $this->actingAs($admin)
            ->put(route('programs.materials.update', [$program, $material]), [
                'title' => 'Updated material',
                'description' => 'Updated description.',
            ])
            ->assertRedirect();

        $this->actingAs($admin)
            ->put(route('programs.materials.status', [$program, $material]), [
                'status' => 'inactive',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('program_materials', [
            'id' => $material->id,
            'title' => 'Updated material',
            'description' => 'Updated description.',
            'status' => 'inactive',
        ]);
        Storage::disk('r2')->assertExists($material->path);
    }

    public function test_student_with_active_enrollment_can_view_program_detail_and_material(): void
    {
        Storage::fake('r2');
        [$student, $enrollment] = $this->studentEnrollment('active');
        $material = ProgramMaterial::factory()->for($enrollment->program)->create([
            'title' => 'Biology Notes',
        ]);
        Storage::disk('r2')->put($material->path, 'content');

        $this->actingAs($student)
            ->get(route('enrollments.show', $enrollment))
            ->assertOk()
            ->assertInertia(fn (Assert $page): Assert => $page
                ->component('student/enrollments/show')
                ->where('enrollment.hasMaterialAccess', true)
                ->where('materials.0.title', 'Biology Notes')
                ->where('materials.0.url', route('program-materials.show', $material))
            );

        $this->actingAs($student)
            ->get(route('program-materials.show', $material))
            ->assertRedirect();
    }

    public function test_inactive_enrollment_keeps_lifetime_program_material_access(): void
    {
        Storage::fake('r2');
        [$student, $enrollment] = $this->studentEnrollment('inactive');
        $material = ProgramMaterial::factory()->for($enrollment->program)->create();

        $this->actingAs($student)
            ->get(route('enrollments.show', $enrollment))
            ->assertOk()
            ->assertInertia(fn (Assert $page): Assert => $page
                ->where('enrollment.hasMaterialAccess', true)
                ->has('materials', 1)
            );

        $this->actingAs($student)
            ->get(route('program-materials.show', $material))
            ->assertRedirect();
    }

    public function test_exhausted_enrollment_keeps_lifetime_program_material_access(): void
    {
        Storage::fake('r2');
        [$student, $enrollment] = $this->studentEnrollment('active');
        $enrollment->update(['sessions_used' => $enrollment->variant->session]);
        $material = ProgramMaterial::factory()
            ->for($enrollment->program)
            ->create();
        Storage::disk('r2')->put($material->path, 'content');

        $this->actingAs($student)
            ->get(route('enrollments.show', $enrollment))
            ->assertOk()
            ->assertInertia(fn (Assert $page): Assert => $page
                ->where('enrollment.hasMaterialAccess', true)
                ->has('materials', 1)
            );

        $this->actingAs($student)
            ->get(route('program-materials.show', $material))
            ->assertRedirect();
    }

    public function test_inactive_material_is_not_available_with_lifetime_access(): void
    {
        Storage::fake('r2');
        [$student, $enrollment] = $this->studentEnrollment('inactive');
        $material = ProgramMaterial::factory()
            ->for($enrollment->program)
            ->create(['status' => 'inactive']);

        $this->actingAs($student)
            ->get(route('enrollments.show', $enrollment))
            ->assertOk()
            ->assertInertia(fn (Assert $page): Assert => $page
                ->where('enrollment.hasMaterialAccess', true)
                ->has('materials', 0)
            );

        $this->actingAs($student)
            ->get(route('program-materials.show', $material))
            ->assertNotFound();
    }

    public function test_unrelated_student_and_mentor_cannot_view_program_material(): void
    {
        Storage::fake('r2');
        $material = ProgramMaterial::factory()->create();

        $this->actingAs(User::factory()->student()->create())
            ->get(route('program-materials.show', $material))
            ->assertNotFound();

        $this->actingAs(User::factory()->mentor()->create())
            ->get(route('program-materials.show', $material))
            ->assertNotFound();
    }

    public function test_student_cannot_view_another_students_enrollment_detail(): void
    {
        [$student, $enrollment] = $this->studentEnrollment('active');
        $otherStudent = User::factory()->student()->create();

        $this->actingAs($otherStudent)
            ->get(route('enrollments.show', $enrollment))
            ->assertNotFound();

        $this->assertNotSame($student->id, $otherStudent->id);
    }

    /**
     * @return array{0: User, 1: ProgramEnrollment}
     */
    private function studentEnrollment(string $status): array
    {
        $student = User::factory()->student()->create();
        $field = AcademicField::factory()->create();
        $program = Program::factory()->create();
        $variant = ProgramVariant::factory()->for($field, 'field')->create();
        $enrollment = ProgramEnrollment::factory()
            ->for($student)
            ->for($program)
            ->for($field, 'field')
            ->for($variant, 'variant')
            ->create(['status' => $status]);

        return [$student, $enrollment];
    }
}
