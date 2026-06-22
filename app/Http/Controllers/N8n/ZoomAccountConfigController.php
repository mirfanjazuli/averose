<?php

namespace App\Http\Controllers\N8n;

use App\Http\Controllers\Controller;
use App\Models\ZoomAccount;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ZoomAccountConfigController extends Controller
{
    public function show(Request $request, ZoomAccount $zoomAccount): JsonResponse
    {
        $this->abortWhenTokenIsInvalid($request);

        return response()->json([
            'appKey' => $zoomAccount->slug,
            'accountId' => $zoomAccount->account_id,
            'enabled' => true,
            'name' => $zoomAccount->name,
            'secretToken' => $zoomAccount->token_secret,
        ]);
    }

    private function abortWhenTokenIsInvalid(Request $request): void
    {
        $configuredToken = (string) config('services.n8n.webhook_token');
        $requestToken = (string) $request->header('X-N8N-Token');

        abort_if($configuredToken === '', Response::HTTP_SERVICE_UNAVAILABLE, 'N8N webhook token is not configured.');
        abort_unless(hash_equals($configuredToken, $requestToken), Response::HTTP_UNAUTHORIZED);
    }
}
