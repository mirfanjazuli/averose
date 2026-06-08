<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreZoomAccountRequest;
use App\Http\Requests\UpdateZoomAccountRequest;
use App\Models\ZoomAccount;
use Carbon\CarbonInterface;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class ZoomAccountsController extends Controller
{
    public function index(): Response
    {
        $accounts = ZoomAccount::query()
            ->with(['sessionBookings' => fn ($query) => $query
                ->where('scheduled_at', '<=', now())
                ->whereIn('status', ['assigned', 'rescheduled'])
                ->orderBy('scheduled_at')])
            ->latest()
            ->get(['id', 'name', 'slug', 'account_id', 'client_id', 'created_at', 'updated_at']);

        return Inertia::render('admin/integrations/zoom-accounts', [
            'accounts' => $accounts->map(fn (ZoomAccount $account): array => $this->serializeAccount($account)),
            'capacity' => $this->capacitySummary($accounts),
        ]);
    }

    public function show(ZoomAccount $zoomAccount): Response
    {
        return Inertia::render('admin/integrations/zoom-account-detail', [
            'account' => $this->serializeAccount($zoomAccount, includeSecrets: true),
            'meetings' => $this->scheduledMeetings($zoomAccount),
            'breadcrumbs' => [
                [
                    'title' => 'Zoom Accounts',
                    'href' => '/zoom-accounts',
                ],
                [
                    'title' => $zoomAccount->name,
                    'href' => route('zoom-accounts.show', $zoomAccount),
                ],
            ],
        ]);
    }

    public function store(StoreZoomAccountRequest $request): RedirectResponse
    {
        ZoomAccount::create($request->validated());

        return back();
    }

    public function update(UpdateZoomAccountRequest $request, ZoomAccount $zoomAccount): RedirectResponse
    {
        $validated = $request->validated();

        foreach (['client_secret', 'token_secret'] as $secretField) {
            if (blank($validated[$secretField] ?? null)) {
                unset($validated[$secretField]);
            }
        }

        $zoomAccount->update($validated);

        if ($request->query('redirect') === 'detail') {
            return redirect()->route('zoom-accounts.show', $zoomAccount);
        }

        return back();
    }

    public function destroy(ZoomAccount $zoomAccount): RedirectResponse
    {
        $zoomAccount->delete();

        return back();
    }

    /**
     * @return array{id: int, name: string, slug: string, accountId: string, clientId: string, createdAt: string|null, updatedAt: string|null, clientSecret?: string, tokenSecret?: string}
     */
    private function serializeAccount(ZoomAccount $account, bool $includeSecrets = false): array
    {
        $serialized = [
            'id' => $account->id,
            'name' => $account->name,
            'slug' => $account->slug,
            'accountId' => $account->account_id,
            'clientId' => $account->client_id,
            'createdAt' => $account->created_at?->format('M d, Y'),
            'updatedAt' => $account->updated_at?->format('M d, Y'),
        ];

        if ($account->relationLoaded('sessionBookings')) {
            $capacity = $this->accountCapacity($account);

            $serialized['activeMeetings'] = $capacity['activeMeetings'];
            $serialized['isFull'] = $capacity['isFull'];
            $serialized['releaseAt'] = $capacity['releaseAt']?->format('M d, Y H:i');
            $serialized['releaseIn'] = $capacity['releaseAt']?->diffForHumans();
        }

        if ($includeSecrets) {
            $serialized['clientSecret'] = $account->client_secret;
            $serialized['tokenSecret'] = $account->token_secret;
        }

        return $serialized;
    }

    private function capacitySummary($accounts): array
    {
        $fullAccounts = $accounts
            ->map(function (ZoomAccount $account): array {
                $capacity = $this->accountCapacity($account);

                return [
                    'activeMeetings' => $capacity['activeMeetings'],
                    'isFull' => $capacity['isFull'],
                    'name' => $account->name,
                    'releaseAt' => $capacity['releaseAt'],
                    'slug' => $account->slug,
                ];
            })
            ->filter(fn (array $account): bool => $account['isFull'])
            ->sortBy('releaseAt')
            ->values();

        $nearestRelease = $fullAccounts->first();

        return [
            'fullAccounts' => $fullAccounts->count(),
            'nearestRelease' => $nearestRelease ? [
                'activeMeetings' => $nearestRelease['activeMeetings'],
                'name' => $nearestRelease['name'],
                'releaseAt' => $nearestRelease['releaseAt']->format('M d, Y H:i'),
                'releaseIn' => $nearestRelease['releaseAt']->diffForHumans(),
                'slug' => $nearestRelease['slug'],
            ] : null,
        ];
    }

    private function accountCapacity(ZoomAccount $account): array
    {
        $activeBookings = $account->sessionBookings
            ->filter(fn ($booking): bool => $booking->scheduled_at->copy()->addMinutes($booking->duration)->greaterThan(now()))
            ->values();

        return [
            'activeMeetings' => $activeBookings->count(),
            'isFull' => $activeBookings->count() >= 2,
            'releaseAt' => $activeBookings
                ->map(fn ($booking): CarbonInterface => $booking->scheduled_at->copy()->addMinutes($booking->duration))
                ->sort()
                ->first(),
        ];
    }

    private function scheduledMeetings(ZoomAccount $account): array
    {
        return $account->sessionBookings()
            ->with(['mentor:id,name', 'subject:id,name', 'user:id,name', 'enrollment.program:id,name'])
            ->orderBy('scheduled_at')
            ->get()
            ->filter(fn ($booking): bool => $booking->scheduled_at->copy()->addMinutes($booking->duration)->greaterThan(now()))
            ->map(function ($booking): array {
                $endAt = $booking->scheduled_at->copy()->addMinutes($booking->duration);

                return [
                    'id' => (string) $booking->id,
                    'meetingId' => $booking->zoom_meeting_id,
                    'mentor' => $booking->mentor?->name ?? 'Unassigned mentor',
                    'program' => $booking->enrollment?->program?->name ?? '-',
                    'status' => str($booking->status)->headline()->toString(),
                    'student' => $booking->user?->name ?? '-',
                    'timingGroup' => $this->meetingTimingGroup($booking->scheduled_at, $endAt),
                    'time' => "{$booking->scheduled_at->format('D, M j, H:i')} - {$endAt->format('H:i')}",
                    'title' => $booking->subject?->name ?? 'Session',
                    'zoomLink' => $booking->zoom_link,
                ];
            })
            ->values()
            ->all();
    }

    private function meetingTimingGroup(CarbonInterface $startAt, CarbonInterface $endAt): string
    {
        if ($startAt->lessThanOrEqualTo(now()) && $endAt->greaterThan(now())) {
            return 'active';
        }

        if ($startAt->isToday()) {
            return 'today';
        }

        return 'upcoming';
    }
}
