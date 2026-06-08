<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreProgramRequest;
use App\Models\AcademicField;
use App\Models\Program;
use App\Models\ProgramVariant;
use App\Models\Subject;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProgramController extends Controller
{
    public function index(): Response
    {
        $subjectOptions = Subject::query()
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn (Subject $subject): array => [
                'id' => (string) $subject->id,
                'label' => $subject->name,
            ]);

        return Inertia::render('admin/academics/programs', [
            'fieldOptions' => AcademicField::query()
                ->orderBy('name')
                ->get(['id', 'name'])
                ->map(fn (AcademicField $field): array => [
                    'id' => (string) $field->id,
                    'label' => $field->name,
                    'subjects' => $subjectOptions,
                ]),
            'programs' => Program::query()
                ->with(['fields:id,name', 'subjects:id,name', 'variants:id,field_id,name,session,duration,price,status'])
                ->withCount('subjects')
                ->latest()
                ->get()
                ->map(fn (Program $program): array => [
                    'id' => $program->id,
                    'name' => $program->name,
                    'slug' => $program->slug,
                    'description' => $program->description,
                    'maxReschedule' => $program->max_reschedule,
                    'field' => $program->fields->pluck('name')->join(', ') ?: 'No field',
                    'fieldIds' => $program->fields->pluck('id')->map(fn (int $id): string => (string) $id),
                    'subjectIds' => $program->subjects->pluck('id')->map(fn (int $id): string => (string) $id),
                    'variantRows' => $program->variants->map(fn (ProgramVariant $variant): array => [
                        'fieldId' => (string) $variant->field_id,
                        'session' => $variant->session,
                        'duration' => $variant->duration,
                        'price' => $variant->price,
                    ]),
                    'subjects' => "{$program->subjects_count} subjects",
                    'students' => '0 students',
                    'status' => $program->status,
                ]),
        ]);
    }

    public function store(StoreProgramRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $program = Program::create([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'max_reschedule' => $validated['max_reschedule'],
        ]);

        $program->fields()->sync($validated['fields']);
        $program->subjects()->sync($validated['subjects'] ?? []);
        $this->syncProgramVariants($program, $validated['variants'] ?? []);

        return back();
    }

    public function show(Program $program): Response
    {
        $program->load([
            'fields:id,name',
            'subjects:id,name',
            'variants:id,field_id,name,session,duration,price,status',
            'variants.field:id,name',
        ]);
        $program->loadCount('subjects');

        return Inertia::render('admin/academics/program-detail', [
            'breadcrumbs' => [
                [
                    'title' => 'Academics',
                    'href' => '/academics/fields',
                ],
                [
                    'title' => 'Programs',
                    'href' => '/academics/programs',
                ],
                [
                    'title' => $program->name,
                    'href' => "/academics/programs/{$program->slug}",
                ],
            ],
            'program' => [
                'id' => $program->id,
                'name' => $program->name,
                'slug' => $program->slug,
                'description' => $program->description,
                'maxReschedule' => $program->max_reschedule,
                'field' => $program->fields->pluck('name')->join(', ') ?: 'No field',
                'fields' => $program->fields->map(fn (AcademicField $field): array => [
                    'id' => $field->id,
                    'name' => $field->name,
                ]),
                'subjects' => $program->subjects->map(fn (Subject $subject): array => [
                    'id' => $subject->id,
                    'name' => $subject->name,
                ]),
                'subjectsCount' => $program->subjects_count,
                'students' => '0 students',
                'status' => $program->status,
                'variants' => $program->variants->map(fn (ProgramVariant $variant): array => [
                    'id' => $variant->id,
                    'fieldId' => $variant->field_id,
                    'field' => $variant->field?->name,
                    'name' => $variant->name,
                    'session' => $variant->session,
                    'duration' => $variant->duration,
                    'price' => $variant->price,
                    'status' => $variant->status,
                ]),
            ],
        ]);
    }

    public function updateVariant(Request $request, Program $program, ProgramVariant $variant): RedirectResponse
    {
        abort_unless($program->variants()->whereKey($variant->getKey())->exists(), 404);

        $validated = $request->validate([
            'session' => ['required', 'integer', 'min:1', 'max:255'],
            'duration' => ['required', 'integer', 'in:60,90,120,180'],
            'price' => ['required', 'numeric', 'min:0', 'max:9999999999.99'],
        ]);

        $session = (int) $validated['session'];
        $duration = (int) $validated['duration'];

        $variant->update([
            'name' => "{$session} x {$duration} Minutes",
            'session' => $session,
            'duration' => $duration,
            'price' => $validated['price'],
        ]);

        return back();
    }

    public function update(StoreProgramRequest $request, Program $program): RedirectResponse
    {
        $validated = $request->validated();

        $program->update([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'max_reschedule' => $validated['max_reschedule'],
        ]);

        $program->fields()->sync($validated['fields']);
        $program->subjects()->sync($validated['subjects'] ?? []);
        $this->syncProgramVariants($program, $validated['variants'] ?? []);

        return back();
    }

    public function destroy(Program $program): RedirectResponse
    {
        $program->delete();

        return back();
    }

    /**
     * @param  array<int, array{field_id: int, session: int, duration: int, price: numeric-string|int|float}>  $variants
     */
    private function syncProgramVariants(Program $program, array $variants): void
    {
        $existingVariantIds = $program->variants()->pluck('program_variants.id');

        $program->variants()->detach();

        if ($existingVariantIds->isNotEmpty()) {
            ProgramVariant::withTrashed()->whereKey($existingVariantIds)->forceDelete();
        }

        $variantIds = collect($variants)
            ->map(function (array $variant): int {
                $session = (int) $variant['session'];
                $duration = (int) $variant['duration'];

                return ProgramVariant::query()->create([
                    'field_id' => $variant['field_id'],
                    'name' => "{$session} x {$duration} Minutes",
                    'session' => $session,
                    'duration' => $duration,
                    'price' => $variant['price'],
                    'status' => 'active',
                ])->id;
            });

        $program->variants()->sync($variantIds);
    }
}
