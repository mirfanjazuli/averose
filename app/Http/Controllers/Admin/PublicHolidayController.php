<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\ImportPublicHolidaysRequest;
use App\Http\Requests\StorePublicHolidayRequest;
use App\Models\PublicHoliday;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class PublicHolidayController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('admin/scheduling/public-holidays/index', [
            'holidays' => PublicHoliday::query()
                ->orderBy('date')
                ->get()
                ->map(fn (PublicHoliday $holiday): array => $this->serializeHoliday($holiday))
                ->all(),
        ]);
    }

    public function store(StorePublicHolidayRequest $request): RedirectResponse
    {
        PublicHoliday::query()->create([
            ...$request->validated(),
            'source' => 'manual',
        ]);

        return back();
    }

    public function update(StorePublicHolidayRequest $request, PublicHoliday $publicHoliday): RedirectResponse
    {
        $publicHoliday->update($request->validated());

        return back();
    }

    public function destroy(PublicHoliday $publicHoliday): RedirectResponse
    {
        $publicHoliday->update(['status' => 'inactive']);

        return back();
    }

    public function import(ImportPublicHolidaysRequest $request): RedirectResponse
    {
        collect($request->validated('holidays'))
            ->unique(fn (array $holiday): string => $holiday['date'].'|'.$holiday['name'])
            ->each(fn (array $holiday): PublicHoliday => PublicHoliday::query()->firstOrCreate(
                [
                    'date' => $holiday['date'],
                    'name' => $holiday['name'],
                ],
                [
                    'source' => 'library',
                    'status' => 'active',
                    'type' => $holiday['type'],
                ],
            ));

        return back();
    }

    private function serializeHoliday(PublicHoliday $holiday): array
    {
        return [
            'date' => $holiday->date,
            'id' => $holiday->id,
            'name' => $holiday->name,
            'source' => $holiday->source,
            'status' => $holiday->status,
            'type' => $holiday->type,
        ];
    }
}
