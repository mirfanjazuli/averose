<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreSubjectRequest;
use App\Models\Subject;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class SubjectController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('admin/academics/subjects', [
            'subjects' => Subject::query()
                ->withCount('programs')
                ->latest()
                ->get()
                ->map(fn (Subject $subject): array => [
                    'id' => $subject->id,
                    'name' => $subject->name,
                    'slug' => $subject->slug,
                    'description' => $subject->description,
                    'icon' => $subject->icon,
                    'programsCount' => $subject->programs_count,
                    'status' => $subject->status,
                ]),
        ]);
    }

    public function store(StoreSubjectRequest $request): RedirectResponse
    {
        Subject::create([
            ...$request->validated(),
            'status' => $request->validated('status', 'active'),
        ]);

        return back();
    }

    public function update(StoreSubjectRequest $request, Subject $subject): RedirectResponse
    {
        $subject->update([
            ...$request->validated(),
            'status' => $request->validated('status', $subject->status),
        ]);

        return back();
    }

    public function destroy(Subject $subject): RedirectResponse
    {
        $subject->delete();

        return back();
    }
}
