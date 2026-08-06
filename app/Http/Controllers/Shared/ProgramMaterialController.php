<?php

namespace App\Http\Controllers\Shared;

use App\Http\Controllers\Controller;
use App\Models\ProgramMaterial;
use App\Models\User;
use App\Services\ProgramAssetStorage;
use App\Services\ProgramMaterialAccessService;
use Illuminate\Http\RedirectResponse;

class ProgramMaterialController extends Controller
{
    public function show(
        ProgramMaterial $programMaterial,
        ProgramAssetStorage $storage,
        ProgramMaterialAccessService $access,
    ): RedirectResponse {
        /** @var User $user */
        $user = request()->user();

        abort_unless($access->canView($user, $programMaterial), 404);

        return redirect()->away($storage->temporaryUrl($programMaterial));
    }
}
