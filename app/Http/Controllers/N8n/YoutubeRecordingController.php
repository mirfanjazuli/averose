<?php

namespace App\Http\Controllers\N8n;

use App\Http\Controllers\Controller;
use App\Models\SessionBooking;
use App\Models\SessionRecording;
use App\Models\ZoomAccount;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Symfony\Component\HttpFoundation\Response;

class YoutubeRecordingController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $this->abortWhenTokenIsInvalid($request);

        $validated = $request->validate([
            'account_id' => ['required', 'string'],
            'app_key' => ['required', 'string', 'exists:zoom_accounts,slug'],
            'duration' => ['nullable', 'integer', 'min:1'],
            'meeting_id' => ['required', 'string'],
            'meeting_uuid' => ['nullable', 'string'],
            'recording_file_id' => ['nullable', 'string'],
            'recording_type' => ['nullable', 'string'],
            'start_time' => ['nullable', 'date'],
            'title' => ['nullable', 'string', 'max:255'],
            'youtube_url' => ['nullable', 'url'],
            'youtube_video_id' => ['required', 'string', 'max:255'],
        ]);

        $zoomAccount = ZoomAccount::query()
            ->where('slug', $validated['app_key'])
            ->firstOrFail();

        abort_unless(
            hash_equals($zoomAccount->account_id, $validated['account_id']),
            Response::HTTP_UNPROCESSABLE_ENTITY,
            'Zoom account_id does not match the app_key.',
        );

        $booking = SessionBooking::query()
            ->where('zoom_account_id', $zoomAccount->id)
            ->where('zoom_meeting_id', $validated['meeting_id'])
            ->first();

        abort_unless($booking, Response::HTTP_UNPROCESSABLE_ENTITY, 'No session booking matches this Zoom meeting.');

        $youtubeUrl = $validated['youtube_url'] ?? "https://www.youtube.com/watch?v={$validated['youtube_video_id']}";

        $recording = SessionRecording::query()->updateOrCreate(
            ['youtube_video_id' => $validated['youtube_video_id']],
            [
                'duration' => $validated['duration'] ?? null,
                'metadata' => Arr::only($validated, ['recording_type']),
                'recorded_at' => $validated['start_time'] ?? null,
                'session_booking_id' => $booking->id,
                'title' => $validated['title'] ?? ($booking->subject?->name ?? 'Session recording'),
                'user_id' => $booking->user_id,
                'youtube_url' => $youtubeUrl,
                'zoom_account_id' => $zoomAccount->id,
                'zoom_meeting_id' => $validated['meeting_id'],
                'zoom_meeting_uuid' => $validated['meeting_uuid'] ?? null,
                'zoom_recording_file_id' => $validated['recording_file_id'] ?? null,
            ],
        );

        return response()->json([
            'id' => (string) $recording->id,
            'status' => $recording->wasRecentlyCreated ? 'created' : 'updated',
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
