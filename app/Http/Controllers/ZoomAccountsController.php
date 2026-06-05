<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreZoomAccountRequest;
use App\Http\Requests\UpdateZoomAccountRequest;
use App\Models\ZoomAccount;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class ZoomAccountsController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('admin/integrations/zoom-accounts', [
            'accounts' => ZoomAccount::query()
                ->latest()
                ->get(['id', 'name', 'slug', 'account_id', 'client_id', 'created_at', 'updated_at'])
                ->map(fn (ZoomAccount $account): array => $this->serializeAccount($account)),
        ]);
    }

    public function show(ZoomAccount $zoomAccount): Response
    {
        return Inertia::render('admin/integrations/zoom-account-detail', [
            'account' => $this->serializeAccount($zoomAccount, includeSecrets: true),
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

        if ($includeSecrets) {
            $serialized['clientSecret'] = $account->client_secret;
            $serialized['tokenSecret'] = $account->token_secret;
        }

        return $serialized;
    }
}
