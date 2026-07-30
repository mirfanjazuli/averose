<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreWorkingHourRequest;
use App\Models\WorkingHour;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class WorkingHourController extends Controller
{
    public function index(): Response
    {
        $this->ensureDefaults();

        return Inertia::render('admin/scheduling/working-hours/index', [
            'workingHours' => WorkingHour::query()
                ->orderBy('day_of_week')
                ->get()
                ->map(fn (WorkingHour $workingHour): array => $this->serializeWorkingHour($workingHour))
                ->all(),
        ]);
    }

    public function update(StoreWorkingHourRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $activeDays = collect($validated['days'])->map(fn (mixed $day): int => (int) $day);

        DB::transaction(function () use ($activeDays, $validated): void {
            collect(range(1, 7))->each(function (int $dayOfWeek) use ($activeDays, $validated): void {
                $isActive = $activeDays->contains($dayOfWeek);

                WorkingHour::query()->updateOrCreate(
                    ['day_of_week' => $dayOfWeek],
                    [
                        'end_time' => $isActive ? $validated['end_time'] : null,
                        'is_active' => $isActive,
                        'start_time' => $isActive ? $validated['start_time'] : null,
                    ],
                );
            });
        });

        return back()->with('success', 'Working hours updated.');
    }

    private function ensureDefaults(): void
    {
        collect(range(1, 7))->each(function (int $dayOfWeek): void {
            WorkingHour::query()->firstOrCreate(
                ['day_of_week' => $dayOfWeek],
                [
                    'end_time' => $dayOfWeek <= 5 ? '20:00' : null,
                    'is_active' => $dayOfWeek <= 5,
                    'start_time' => $dayOfWeek <= 5 ? '09:00' : null,
                ],
            );
        });
    }

    private function serializeWorkingHour(WorkingHour $workingHour): array
    {
        return [
            'dayOfWeek' => $workingHour->day_of_week,
            'endTime' => $workingHour->end_time ? substr($workingHour->end_time, 0, 5) : null,
            'id' => $workingHour->id,
            'isActive' => $workingHour->is_active,
            'startTime' => $workingHour->start_time ? substr($workingHour->start_time, 0, 5) : null,
        ];
    }
}
