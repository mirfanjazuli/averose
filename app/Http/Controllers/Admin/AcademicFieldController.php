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
        return Inertia::render('admin/academics/fields', [
            'fields' => AcademicField::query()
                ->withCount(['programs', 'subjects'])
                ->latest()
                ->get()
                ->map(fn (AcademicField $field): array => [
                    'id' => $field->id,
                    'name' => $field->name,
                    'slug' => $field->slug,
                    'description' => $field->description,
                    'programsCount' => $field->programs_count,
                    'subjectsCount' => $field->subjects_count,
                    'status' => $field->status,
                ]),
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
        $academicField->delete();

        return back();
    }
}
