<?php

namespace Tests\Feature;

use App\Models\AcademicField;
use App\Models\Program;
use App\Models\ProgramVariant;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AcademicStructureTest extends TestCase
{
    use RefreshDatabase;

    public function test_academic_models_can_store_program_form_relationships(): void
    {
        $field = AcademicField::factory()->create([
            'name' => 'Technology',
        ]);
        $subject = Subject::factory()->create([
            'name' => 'Laravel Backend',
        ]);
        $variant = ProgramVariant::factory()
            ->for($field, 'field')
            ->create([
                'name' => 'Bootcamp',
            ]);
        $program = Program::factory()->create([
            'name' => 'Backend Engineering',
            'max_reschedule' => 3,
        ]);

        $field->subjects()->attach($subject);
        $program->fields()->attach($field);
        $program->subjects()->attach($subject);
        $program->variants()->attach($variant);

        $this->assertDatabaseHas('fields', [
            'name' => 'Technology',
            'slug' => 'technology',
            'status' => 'active',
        ]);
        $this->assertDatabaseHas('subjects', [
            'name' => 'Laravel Backend',
            'slug' => 'laravel-backend',
            'icon' => 'book-open-check',
        ]);
        $this->assertDatabaseHas('programs', [
            'name' => 'Backend Engineering',
            'slug' => 'backend-engineering',
            'max_reschedule' => 3,
        ]);
        $this->assertDatabaseHas('program_variants', [
            'field_id' => $field->id,
            'name' => 'Bootcamp',
        ]);
        $this->assertDatabaseHas('field_subject', [
            'field_id' => $field->id,
            'subject_id' => $subject->id,
        ]);
        $this->assertDatabaseHas('field_program', [
            'field_id' => $field->id,
            'program_id' => $program->id,
        ]);
        $this->assertDatabaseHas('program_subject', [
            'program_id' => $program->id,
            'subject_id' => $subject->id,
        ]);
        $this->assertDatabaseHas('program_variant_program', [
            'program_id' => $program->id,
            'program_variant_id' => $variant->id,
        ]);
    }

    public function test_admin_can_store_academic_field(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)
            ->post('/academics/fields', [
                'name' => 'Creative',
                'description' => 'Creative learning paths.',
                'status' => 'active',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('fields', [
            'name' => 'Creative',
            'slug' => 'creative',
            'status' => 'active',
        ]);
    }

    public function test_admin_can_store_subject(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)
            ->post('/academics/subjects', [
                'name' => 'React Fundamentals',
                'description' => 'Core React concepts.',
                'icon' => 'atom',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('subjects', [
            'name' => 'React Fundamentals',
            'slug' => 'react-fundamentals',
            'icon' => 'atom',
            'status' => 'active',
        ]);
    }

    public function test_admin_can_store_program_with_academic_relationships(): void
    {
        $admin = User::factory()->admin()->create();
        $field = AcademicField::factory()->create();
        $subject = Subject::factory()->create();

        $this->actingAs($admin)
            ->post('/academics/programs', [
                'name' => 'Frontend Engineering',
                'description' => 'Build production frontend skills.',
                'max_reschedule' => 3,
                'fields' => [$field->id],
                'subjects' => [$subject->id],
                'variants' => [
                    [
                        'field_id' => $field->id,
                        'session' => 6,
                        'duration' => 90,
                        'price' => 1500000,
                    ],
                ],
            ])
            ->assertRedirect();

        $program = Program::query()->where('slug', 'frontend-engineering')->firstOrFail();
        $variant = ProgramVariant::query()->where('name', '6 x 90 Minutes')->firstOrFail();

        $this->assertDatabaseHas('field_program', [
            'field_id' => $field->id,
            'program_id' => $program->id,
        ]);
        $this->assertDatabaseHas('program_subject', [
            'program_id' => $program->id,
            'subject_id' => $subject->id,
        ]);
        $this->assertDatabaseHas('program_variant_program', [
            'program_id' => $program->id,
            'program_variant_id' => $variant->id,
        ]);
        $this->assertDatabaseHas('program_variants', [
            'field_id' => $field->id,
            'name' => '6 x 90 Minutes',
            'session' => 6,
            'duration' => 90,
            'price' => 1500000,
            'status' => 'active',
        ]);
    }

    public function test_admin_can_view_program_detail_page(): void
    {
        $admin = User::factory()->admin()->create();
        $field = AcademicField::factory()->create([
            'name' => 'Technology',
        ]);
        $subject = Subject::factory()->create([
            'name' => 'React Fundamentals',
        ]);
        $program = Program::factory()->create([
            'name' => 'Frontend Engineering',
        ]);
        $variant = ProgramVariant::factory()->for($field, 'field')->create([
            'name' => '6 x 90 Minutes',
            'session' => 6,
            'duration' => 90,
            'price' => 1500000,
        ]);

        $program->fields()->attach($field);
        $program->subjects()->attach($subject);
        $program->variants()->attach($variant);

        $this->actingAs($admin)
            ->get("/academics/programs/{$program->slug}")
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('admin/academics/program-detail')
                ->where('breadcrumbs.2.title', 'Frontend Engineering')
                ->where('program.name', 'Frontend Engineering')
                ->where('program.variants.0.duration', 90)
            );
    }

    public function test_admin_can_update_program_variant_from_detail_page(): void
    {
        $admin = User::factory()->admin()->create();
        $field = AcademicField::factory()->create();
        $program = Program::factory()->create([
            'name' => 'Frontend Engineering',
        ]);
        $variant = ProgramVariant::factory()->for($field, 'field')->create([
            'name' => '6 x 90 Minutes',
            'session' => 6,
            'duration' => 90,
            'price' => 1500000,
        ]);

        $program->variants()->attach($variant);

        $this->actingAs($admin)
            ->put("/academics/programs/{$program->slug}/variants/{$variant->id}", [
                'session' => 8,
                'duration' => 120,
                'price' => 2400000,
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('program_variants', [
            'id' => $variant->id,
            'name' => '8 x 120 Minutes',
            'session' => 8,
            'duration' => 120,
            'price' => 2400000,
        ]);
    }

    public function test_admin_can_update_academic_field_subject_and_program(): void
    {
        $admin = User::factory()->admin()->create();
        $field = AcademicField::factory()->create([
            'name' => 'Technology',
        ]);
        $subject = Subject::factory()->create([
            'name' => 'Laravel Backend',
        ]);
        $program = Program::factory()->create([
            'name' => 'Backend Engineering',
        ]);

        $this->actingAs($admin)
            ->put("/academics/fields/{$field->slug}", [
                'name' => 'Engineering',
                'description' => 'Engineering field.',
                'status' => 'active',
            ])
            ->assertRedirect();

        $this->actingAs($admin)
            ->put("/academics/subjects/{$subject->slug}", [
                'name' => 'PHP Backend',
                'description' => 'Backend fundamentals.',
                'icon' => 'code',
            ])
            ->assertRedirect();

        $this->actingAs($admin)
            ->put("/academics/programs/{$program->slug}", [
                'name' => 'Backend Bootcamp',
                'description' => 'Backend program.',
                'max_reschedule' => 2,
                'fields' => [$field->id],
                'subjects' => [$subject->id],
                'variants' => [
                    [
                        'field_id' => $field->id,
                        'session' => 8,
                        'duration' => 120,
                        'price' => 2400000,
                    ],
                ],
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('fields', [
            'name' => 'Engineering',
            'slug' => 'engineering',
        ]);
        $this->assertDatabaseHas('subjects', [
            'name' => 'PHP Backend',
            'slug' => 'php-backend',
            'icon' => 'code',
        ]);
        $this->assertDatabaseHas('programs', [
            'name' => 'Backend Bootcamp',
            'slug' => 'backend-bootcamp',
            'max_reschedule' => 2,
        ]);
        $this->assertDatabaseHas('program_variants', [
            'field_id' => $field->id,
            'name' => '8 x 120 Minutes',
            'session' => 8,
            'duration' => 120,
            'price' => 2400000,
        ]);
    }

    public function test_admin_can_delete_academic_field_subject_and_program(): void
    {
        $admin = User::factory()->admin()->create();
        $field = AcademicField::factory()->create();
        $subject = Subject::factory()->create();
        $program = Program::factory()->create();

        $this->actingAs($admin)
            ->delete("/academics/fields/{$field->slug}")
            ->assertRedirect();

        $this->actingAs($admin)
            ->delete("/academics/subjects/{$subject->slug}")
            ->assertRedirect();

        $this->actingAs($admin)
            ->delete("/academics/programs/{$program->slug}")
            ->assertRedirect();

        $this->assertSoftDeleted('fields', [
            'id' => $field->id,
        ]);
        $this->assertSoftDeleted('subjects', [
            'id' => $subject->id,
        ]);
        $this->assertSoftDeleted('programs', [
            'id' => $program->id,
        ]);
    }
}
