<?php

namespace App\Http\Controllers\Shared;

use App\Http\Controllers\Controller;
use App\Models\TryOutAsset;
use App\Models\User;
use App\Services\TryOutAssetStorage;
use Illuminate\Http\RedirectResponse;

class TryOutAssetController extends Controller
{
    public function show(TryOutAsset $tryOutAsset, TryOutAssetStorage $storage): RedirectResponse
    {
        /** @var User $user */
        $user = request()->user();

        abort_unless($this->canView($user, $tryOutAsset), 404);

        return redirect()->away($storage->temporaryUrl($tryOutAsset));
    }

    private function canView(User $user, TryOutAsset $asset): bool
    {
        if ($asset->status !== 'permanent') {
            return $user->isAdmin()
                && $asset->uploaded_by === $user->id
                && $user->hasPermission('try_outs.manage_questions');
        }

        if ($user->isAdmin()) {
            return $user->hasAnyPermission(['try_outs.view', 'try_outs.manage_questions']);
        }

        if (! $user->isStudent() || $asset->try_out_id === null) {
            return false;
        }

        $asset->loadMissing('tryOut');

        if ($asset->tryOut?->status === 'public') {
            return true;
        }

        if ($asset->tryOut?->status !== 'private') {
            return $asset->tryOut?->attempts()->whereBelongsTo($user)->exists() ?? false;
        }

        $today = now()->toDateString();

        return $asset->tryOut->accesses()
            ->whereBelongsTo($user)
            ->where('status', 'active')
            ->whereDate('available_from', '<=', $today)
            ->whereDate('available_until', '>=', $today)
            ->whereColumn('attempts_used', '<', 'attempt_quota')
            ->exists()
            || $asset->tryOut->attempts()->whereBelongsTo($user)->exists();
    }
}
