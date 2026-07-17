<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTryOutAssetRequest;
use App\Models\TryOut;
use App\Services\TryOutAssetStorage;
use Illuminate\Http\JsonResponse;

class TryOutAssetController extends Controller
{
    public function store(
        StoreTryOutAssetRequest $request,
        TryOut $tryOut,
        TryOutAssetStorage $storage,
    ): JsonResponse {
        $asset = $storage->storeUpload(
            $request->file('image'),
            $tryOut,
            $request->user(),
        );

        return response()->json([
            'url' => $storage->url($asset),
            'uuid' => $asset->uuid,
        ], 201);
    }
}
