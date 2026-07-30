<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAcademicFieldRequest;
use App\Models\AcademicField;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class AcademicFieldController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('admin/academics/fields/index', [
            'fields' => AcademicField::query()
                ->withCount(['programs', 'subjects'])
                ->latest()
                ->get()
                ->map(fn (AcademicField $field): array => $this->serializeField($field)),
        ]);
    }

    public function show(AcademicField $academicField): Response
    {
        $academicField->loadCount(['programs', 'subjects']);

        return Inertia::render('admin/academics/fields/show', [
            'breadcrumbs' => [
                [
                    'title' => 'Academics',
                    'href' => route('fields'),
                ],
                [
                    'title' => 'Fields',
                    'href' => route('fields'),
                ],
                [
                    'title' => $academicField->name,
                    'href' => route('fields.show', $academicField),
                ],
            ],
            'field' => $this->serializeField($academicField),
        ]);
    }

    public function store(StoreAcademicFieldRequest $request): RedirectResponse
    {
        AcademicField::create($request->validated());

        return back();
    }

    public function update(StoreAcademicFieldRequest $request, AcademicField $academicField): RedirectResponse
    {
        $academicField->update($request->validated());

        return back();
    }

    public function destroy(AcademicField $academicField): RedirectResponse
    {
        $academicField->update(['status' => 'inactive']);

        return back();
    }

    private function serializeField(AcademicField $field): array
    {
        return [
            'description' => $field->description,
            'id' => $field->id,
            'name' => $field->name,
            'programsCount' => $field->programs_count,
            'slug' => $field->slug,
            'status' => $field->status,
            'subjectsCount' => $field->subjects_count,
        ];
    }
}
