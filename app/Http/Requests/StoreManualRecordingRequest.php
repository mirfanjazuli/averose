<?php

namespace App\Http\Requests;

use App\UserRole;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\ValidationException;

class StoreManualRecordingRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->role === UserRole::Admin;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'recorded_at' => ['nullable', 'date'],
            'session_booking_id' => ['required', 'integer', 'exists:session_bookings,id'],
            'title' => ['nullable', 'string', 'max:255'],
            'youtube_url' => ['required', 'url'],
        ];
    }

    public function youtubeVideoId(): string
    {
        $url = (string) $this->validated('youtube_url');
        $host = parse_url($url, PHP_URL_HOST);
        $path = trim((string) parse_url($url, PHP_URL_PATH), '/');
        parse_str((string) parse_url($url, PHP_URL_QUERY), $query);

        $videoId = null;

        if (is_string($host) && str_contains($host, 'youtu.be')) {
            $videoId = explode('/', $path)[0] ?? null;
        }

        if (! $videoId && isset($query['v']) && is_string($query['v'])) {
            $videoId = $query['v'];
        }

        if (! $videoId && str_starts_with($path, 'embed/')) {
            $videoId = explode('/', substr($path, 6))[0] ?? null;
        }

        if (! is_string($videoId) || ! preg_match('/^[A-Za-z0-9_-]{6,}$/', $videoId)) {
            throw ValidationException::withMessages([
                'youtube_url' => 'Please enter a valid YouTube video URL.',
            ]);
        }

        return $videoId;
    }
}
