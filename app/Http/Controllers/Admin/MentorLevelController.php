<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\MentorLevel;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class MentorLevelController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('admin/users/mentor-levels/index', [
            'levels' => MentorLevel::query()
                ->withCount('mentors')
                ->orderBy('name')
                ->get()
                ->map(fn (MentorLevel $level): array => $this->serializeLevel($level))
                ->all(),
        ]);
    }

    public function show(MentorLevel $mentorLevel): Response
    {
        $mentorLevel->loadCount('mentors');

        $mentors = $mentorLevel->mentors()
            ->orderBy('name')
            ->get(['users.id', 'users.name', 'users.nickname', 'users.slug', 'users.email', 'users.status', 'users.created_at'])
            ->map(fn ($mentor): array => [
                'createdAt' => $mentor->created_at?->toJSON(),
                'email' => $mentor->email,
                'id' => $mentor->id,
                'name' => $mentor->name,
                'nickname' => $mentor->nickname,
                'slug' => $mentor->slug,
                'status' => $mentor->status,
            ])
            ->all();

        return Inertia::render('admin/users/mentor-levels/show', [
            'breadcrumbs' => [
                [
                    'title' => 'Users',
                    'href' => route('students'),
                ],
                [
                    'title' => 'Mentor Levels',
                    'href' => route('mentor-levels'),
                ],
                [
                    'title' => $mentorLevel->name,
                    'href' => route('mentor-levels.show', $mentorLevel),
                ],
            ],
            'level' => $this->serializeLevel($mentorLevel),
            'mentors' => $mentors,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $this->validated($request);

        DB::transaction(function () use ($validated): void {
            MentorLevel::query()->create($validated);
        });

        return back();
    }

    public function update(Request $request, MentorLevel $mentorLevel): RedirectResponse
    {
        $validated = $this->validated($request, $mentorLevel);

        DB::transaction(function () use ($mentorLevel, $validated): void {
            $mentorLevel->update($validated);
        });

        return back();
    }

    public function destroy(MentorLevel $mentorLevel): RedirectResponse
    {
        $mentorLevel->update(['status' => 'inactive']);

        return back();
    }

    /**
     * @return array{name: string, hourly_rate: mixed, status?: string}
     */
    private function validated(Request $request, ?MentorLevel $mentorLevel = null): array
    {
        return $request->validate([
            'hourly_rate' => ['required', 'numeric', 'min:0', 'max:9999999999.99'],
            'name' => ['required', 'string', 'max:255', Rule::unique('mentor_levels', 'name')->ignore($mentorLevel)],
            'status' => ['sometimes', Rule::in(['active', 'inactive'])],
        ]) + ($mentorLevel ? [] : ['status' => 'active']);
    }

    private function serializeLevel(MentorLevel $level): array
    {
        return [
            'hourlyRate' => $level->hourly_rate,
            'id' => $level->id,
            'mentorsCount' => $level->mentors_count,
            'name' => $level->name,
            'slug' => $level->slug,
            'status' => $level->status,
        ];
    }
}
