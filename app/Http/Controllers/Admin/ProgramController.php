<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreProgramRequest;
use App\Models\AcademicField;
use App\Models\Program;
use App\Models\ProgramEnrollment;
use App\Models\ProgramVariant;
use App\Models\Subject;
use App\Support\StorageUrl;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ProgramController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('admin/academics/programs/index', [
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
                    'thumbnailUrl' => StorageUrl::forPath($program->thumbnail),
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

        if (isset($validated['fields'])) {
            $program->fields()->syncWithoutDetaching($validated['fields']);
            $program->subjects()->syncWithoutDetaching($validated['subjects'] ?? []);
            $this->syncProgramVariants($program, $validated['variants'] ?? []);
        }

        return redirect()
            ->route('programs.show', $program)
            ->with('success', 'Program added.');
    }

    public function show(Program $program): Response
    {
        $subjectOptions = Subject::query()
            ->where('status', 'active')
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn (Subject $subject): array => [
                'id' => (string) $subject->id,
                'label' => $subject->name,
            ]);

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
                'thumbnailUrl' => StorageUrl::forPath($program->thumbnail),
                'description' => $program->description,
                'maxReschedule' => $program->max_reschedule,
                'field' => $program->fields->pluck('name')->join(', ') ?: 'No field',
                'fields' => $program->fields->map(fn (AcademicField $field): array => [
                    'id' => $field->id,
                    'name' => $field->name,
                    'subjectIds' => $program->subjects->pluck('id')->values(),
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
            'fieldOptions' => AcademicField::query()
                ->where('status', 'active')
                ->orderBy('name')
                ->get(['id', 'name'])
                ->map(fn (AcademicField $field): array => [
                    'id' => (string) $field->id,
                    'label' => $field->name,
                    'subjects' => $subjectOptions,
                ]),
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

        if (isset($validated['fields'])) {
            $program->fields()->syncWithoutDetaching($validated['fields']);
            $program->subjects()->syncWithoutDetaching($validated['subjects'] ?? []);
            $this->syncProgramVariants($program, $validated['variants'] ?? []);
        }

        return back();
    }

    public function storeField(Request $request, Program $program): RedirectResponse
    {
        $validated = $request->validate([
            'field_id' => ['required', 'integer', 'exists:fields,id'],
            'subjects' => ['nullable', 'array'],
            'subjects.*' => ['integer', 'exists:subjects,id'],
        ]);

        $program->fields()->syncWithoutDetaching([(int) $validated['field_id']]);
        $program->subjects()->syncWithoutDetaching($validated['subjects'] ?? []);

        return back();
    }

    public function updateField(Request $request, Program $program, AcademicField $field): RedirectResponse
    {
        abort_unless($program->fields()->whereKey($field->getKey())->exists(), 404);

        $validated = $request->validate([
            'field_id' => ['required', 'integer', 'exists:fields,id'],
            'subjects' => ['nullable', 'array'],
            'subjects.*' => ['integer', 'exists:subjects,id'],
        ]);

        $newFieldId = (int) $validated['field_id'];
        $program->fields()->syncWithoutDetaching([$newFieldId]);

        if ($newFieldId !== $field->id && $this->canDetachField($program, $field)) {
            $program->fields()->detach($field->id);
        }

        $program->subjects()->syncWithoutDetaching($validated['subjects'] ?? []);

        return back();
    }

    public function copyField(Request $request, Program $program, AcademicField $field): RedirectResponse
    {
        abort_unless($program->fields()->whereKey($field->getKey())->exists(), 404);

        $validated = $request->validate([
            'target_field_id' => [
                'required',
                'integer',
                Rule::exists('fields', 'id'),
                Rule::notIn([$field->id]),
            ],
        ]);

        $targetFieldId = (int) $validated['target_field_id'];

        DB::transaction(function () use ($field, $program, $targetFieldId): void {
            $program->fields()->syncWithoutDetaching([$targetFieldId]);

            $sourceVariants = $program->variants()
                ->where('field_id', $field->id)
                ->where('status', 'active')
                ->get();

            $targetVariants = $program->variants()
                ->where('field_id', $targetFieldId)
                ->where('status', 'active')
                ->get();

            $newVariantIds = $sourceVariants
                ->reject(fn (ProgramVariant $sourceVariant): bool => $targetVariants->contains(
                    fn (ProgramVariant $targetVariant): bool => $targetVariant->session === $sourceVariant->session
                        && $targetVariant->duration === $sourceVariant->duration
                        && (float) $targetVariant->price === (float) $sourceVariant->price
                ))
                ->map(function (ProgramVariant $sourceVariant) use ($targetFieldId): int {
                    return ProgramVariant::query()->create([
                        'field_id' => $targetFieldId,
                        'name' => $sourceVariant->name,
                        'session' => $sourceVariant->session,
                        'duration' => $sourceVariant->duration,
                        'price' => $sourceVariant->price,
                        'status' => 'active',
                    ])->id;
                });

            $program->variants()->syncWithoutDetaching($newVariantIds->all());
        });

        return back();
    }

    public function storeVariant(Request $request, Program $program): RedirectResponse
    {
        $validated = $request->validate([
            'field_id' => ['required', 'integer', 'exists:fields,id'],
            'session' => ['required', 'integer', 'min:1', 'max:255'],
            'duration' => ['required', 'integer', 'in:60,90,120,180'],
            'price' => ['required', 'numeric', 'min:0', 'max:9999999999.99'],
        ]);

        $session = (int) $validated['session'];
        $duration = (int) $validated['duration'];
        $variant = ProgramVariant::query()->create([
            'field_id' => $validated['field_id'],
            'name' => "{$session} x {$duration} Minutes",
            'session' => $session,
            'duration' => $duration,
            'price' => $validated['price'],
            'status' => 'active',
        ]);

        $program->fields()->syncWithoutDetaching([(int) $validated['field_id']]);
        $program->variants()->syncWithoutDetaching([$variant->id]);

        return back();
    }

    public function destroy(Program $program): RedirectResponse
    {
        $program->update(['status' => 'inactive']);

        return back();
    }

    public function destroyVariant(Program $program, ProgramVariant $variant): RedirectResponse
    {
        abort_unless($program->variants()->whereKey($variant->getKey())->exists(), 404);

        $variant->update(['status' => 'inactive']);

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

    private function canDetachField(Program $program, AcademicField $field): bool
    {
        $hasEnrollment = ProgramEnrollment::query()
            ->where('program_id', $program->id)
            ->where('field_id', $field->id)
            ->exists();

        if ($hasEnrollment) {
            return false;
        }

        return ! $program->variants()
            ->where('field_id', $field->id)
            ->exists();
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

        return $thumbnail->store('program-thumbnails', $this->assetDiskName());
    }

    private function replaceThumbnail(Program $program, UploadedFile $thumbnail): string
    {
        if ($program->thumbnail) {
            Storage::disk($this->assetDiskName())->delete($program->thumbnail);
        }

        return $thumbnail->store('program-thumbnails', $this->assetDiskName());
    }

    private function assetDiskName(): string
    {
        return (string) config('filesystems.default', 'local');
    }
}
