<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreProgramRequest;
use App\Models\AcademicField;
use App\Models\Program;
use App\Models\ProgramEnrollment;
use App\Models\ProgramVariant;
use App\Models\Subject;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ProgramController extends Controller
{
    public function index(): Response
    {
        $subjectOptions = Subject::query()
            ->where('status', 'active')
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn (Subject $subject): array => [
                'id' => (string) $subject->id,
                'label' => $subject->name,
            ]);

        return Inertia::render('admin/academics/programs/index', [
            'fieldOptions' => AcademicField::query()
                ->where('status', 'active')
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
                    'thumbnail' => $program->thumbnail,
                    'thumbnailUrl' => $program->thumbnail ? Storage::disk('public')->url($program->thumbnail) : null,
                    'description' => $program->description,
                    'maxReschedule' => $program->max_reschedule,
                    'field' => $program->fields->pluck('name')->join(', ') ?: 'No field',
                    'fieldIds' => $program->fields->pluck('id')->map(fn (int $id): string => (string) $id),
                    'subjectIds' => $program->subjects->pluck('id')->map(fn (int $id): string => (string) $id),
                    'variantRows' => $program->variants->map(fn (ProgramVariant $variant): array => [
                        'id' => (string) $variant->id,
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
            'thumbnail' => $this->storeThumbnail($request->file('thumbnail')),
            'description' => $validated['description'] ?? null,
            'max_reschedule' => $validated['max_reschedule'],
        ]);

        $program->fields()->syncWithoutDetaching($validated['fields']);
        $program->subjects()->syncWithoutDetaching($validated['subjects'] ?? []);
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

        return Inertia::render('admin/academics/programs/show', [
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
                'thumbnail' => $program->thumbnail,
                'thumbnailUrl' => $program->thumbnail ? Storage::disk('public')->url($program->thumbnail) : null,
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

        $attributes = [
            'name' => "{$session} x {$duration} Minutes",
            'session' => $session,
            'duration' => $duration,
            'price' => $validated['price'],
        ];

        if ($this->shouldPreserveVariant($variant, $attributes)) {
            $newVariant = ProgramVariant::query()->create([
                ...$attributes,
                'field_id' => $variant->field_id,
                'status' => 'active',
            ]);

            $program->variants()->syncWithoutDetaching([$newVariant->id]);
        } else {
            $variant->update($attributes);
        }

        return back();
    }

    public function update(StoreProgramRequest $request, Program $program): RedirectResponse
    {
        $validated = $request->validated();

        $attributes = [
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'max_reschedule' => $validated['max_reschedule'],
        ];

        if ($request->hasFile('thumbnail')) {
            $attributes['thumbnail'] = $this->replaceThumbnail($program, $request->file('thumbnail'));
        }

        $program->update($attributes);

        $program->fields()->syncWithoutDetaching($validated['fields']);
        $program->subjects()->syncWithoutDetaching($validated['subjects'] ?? []);
        $this->syncProgramVariants($program, $validated['variants'] ?? []);

        return back();
    }

    public function destroy(Program $program): RedirectResponse
    {
        $program->update(['status' => 'inactive']);

        return back();
    }

    /**
     * @param  array<int, array{id?: int|null, field_id: int, session: int, duration: int, price: numeric-string|int|float}>  $variants
     */
    private function syncProgramVariants(Program $program, array $variants): void
    {
        $existingVariants = $program->variants()->get();

        $variantIds = collect($variants)
            ->map(function (array $variant) use ($existingVariants): int {
                $session = (int) $variant['session'];
                $duration = (int) $variant['duration'];
                $name = "{$session} x {$duration} Minutes";
                $existingVariant = isset($variant['id'])
                    ? $existingVariants->firstWhere('id', (int) $variant['id'])
                    : null;

                if ($existingVariant) {
                    $attributes = [
                        'name' => $name,
                        'field_id' => $variant['field_id'],
                        'session' => $session,
                        'duration' => $duration,
                        'price' => $variant['price'],
                        'status' => 'active',
                    ];

                    if ($this->shouldPreserveVariant($existingVariant, $attributes)) {
                        return ProgramVariant::query()->create($attributes)->id;
                    }

                    $existingVariant->update($attributes);

                    return $existingVariant->id;
                }

                return ProgramVariant::query()->create([
                    'field_id' => $variant['field_id'],
                    'name' => $name,
                    'session' => $session,
                    'duration' => $duration,
                    'price' => $variant['price'],
                    'status' => 'active',
                ])->id;
            });

        $program->variants()->syncWithoutDetaching($variantIds);
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    private function shouldPreserveVariant(ProgramVariant $variant, array $attributes): bool
    {
        $hasEnrollment = ProgramEnrollment::query()
            ->where('program_variant_id', $variant->id)
            ->exists();

        if (! $hasEnrollment) {
            return false;
        }

        return collect($attributes)
            ->except('status')
            ->contains(fn (mixed $value, string $key): bool => $this->variantAttributeChanged($variant, $key, $value));
    }

    private function variantAttributeChanged(ProgramVariant $variant, string $key, mixed $value): bool
    {
        $currentValue = $variant->getAttribute($key);

        if (in_array($key, ['field_id', 'session', 'duration'], true)) {
            return (int) $currentValue !== (int) $value;
        }

        if ($key === 'price') {
            return (float) $currentValue !== (float) $value;
        }

        return (string) $currentValue !== (string) $value;
    }

    private function storeThumbnail(?UploadedFile $thumbnail): ?string
    {
        if (! $thumbnail) {
            return null;
        }

        return $thumbnail->store('program-thumbnails', 'public');
    }

    private function replaceThumbnail(Program $program, UploadedFile $thumbnail): string
    {
        if ($program->thumbnail) {
            Storage::disk('public')->delete($program->thumbnail);
        }

        return $thumbnail->store('program-thumbnails', 'public');
    }
}
