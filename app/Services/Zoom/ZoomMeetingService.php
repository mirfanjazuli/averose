<?php

namespace App\Services\Zoom;

use App\Models\SessionBooking;
use App\Models\ZoomAccount;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class ZoomMeetingService
{
    public function create(ZoomAccount $account, SessionBooking $booking): ZoomMeetingData
    {
        if (! config('services.zoom.create_real_meetings')) {
            return $this->fakeMeeting($account, $booking);
        }

        $token = $this->accessToken($account);
        $response = Http::withToken($token)
            ->acceptJson()
            ->post($this->apiUrl('/users/me/meetings'), [
                'agenda' => $this->agenda($booking),
                'default_password' => true,
                'duration' => $booking->duration,
                'settings' => [
                    'approval_type' => 2,
                    'auto_recording' => 'none',
                    'join_before_host' => false,
                    'waiting_room' => true,
                ],
                'start_time' => $booking->scheduled_at->toIso8601String(),
                'timezone' => config('app.timezone'),
                'topic' => $this->topic($booking),
                'type' => 2,
            ])
            ->throw()
            ->json();

        return new ZoomMeetingData(
            joinUrl: $response['join_url'],
            meetingId: isset($response['id']) ? (string) $response['id'] : null,
            passcode: $response['password'] ?? null,
            startUrl: $response['start_url'] ?? null,
        );
    }

    private function accessToken(ZoomAccount $account): string
    {
        $response = Http::asForm()
            ->withBasicAuth($account->client_id, $account->client_secret)
            ->post(config('services.zoom.auth_url'), [
                'account_id' => $account->account_id,
                'grant_type' => 'account_credentials',
            ])
            ->throw()
            ->json();

        return $response['access_token'];
    }

    private function fakeMeeting(ZoomAccount $account, SessionBooking $booking): ZoomMeetingData
    {
        $meetingId = Str::of("{$account->id}{$booking->id}")->padLeft(10, '0')->toString();

        return new ZoomMeetingData(
            joinUrl: "https://zoom.us/j/{$meetingId}",
            meetingId: $meetingId,
            passcode: null,
            startUrl: "https://zoom.us/s/{$meetingId}",
        );
    }

    private function apiUrl(string $path): string
    {
        return rtrim(config('services.zoom.api_url'), '/').$path;
    }

    private function topic(SessionBooking $booking): string
    {
        return $booking->subject?->name ?? 'AveRose Session';
    }

    private function agenda(SessionBooking $booking): string
    {
        $program = $booking->enrollment?->program?->name;

        return $program ? "AveRose {$program}" : 'AveRose mentoring session';
    }
}
