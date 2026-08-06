<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\SyncTimezoneRequest;
use App\Http\Requests\UpdateTimezonePreferenceRequest;
use App\Services\DateTime\UserTimezoneSynchronizer;
use App\UserTimezoneMode;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;

class TimezoneController extends Controller
{
    public function sync(
        SyncTimezoneRequest $request,
        UserTimezoneSynchronizer $synchronizer,
    ): RedirectResponse {
        $synchronizer->syncAutomatic($request->user(), $request->string('timezone')->toString());

        return back();
    }

    public function update(
        UpdateTimezonePreferenceRequest $request,
        UserTimezoneSynchronizer $synchronizer,
    ): RedirectResponse {
        $synchronizer->updatePreference(
            $request->user(),
            $request->string('timezone')->toString(),
            UserTimezoneMode::from($request->string('mode')->toString()),
        );

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Time zone updated.')]);

        return back();
    }
}
