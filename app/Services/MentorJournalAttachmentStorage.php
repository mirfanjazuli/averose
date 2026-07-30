<?php

namespace App\Services;

use App\Models\MentorJournalAttachment;
use App\Models\Schedule;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class MentorJournalAttachmentStorage
{
    private const DISK = 'r2';

    /** @var array<string, string> */
    private const EXTENSIONS_BY_MIME = [
        'application/pdf' => 'pdf',
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
    ];

    /**
     * @return array{disk: string, mime_type: string, original_name: string, path: string, size: int, uploaded_by: int, uuid: string}
     */
    public function store(UploadedFile $file, Schedule $schedule, User $uploader): array
    {
        $mimeType = (string) $file->getMimeType();
        $extension = self::EXTENSIONS_BY_MIME[$mimeType] ?? null;

        if (! $extension) {
            throw ValidationException::withMessages([
                'attachments' => 'Only PDF, JPG, PNG, and WebP files are supported.',
            ]);
        }

        $uuid = (string) Str::uuid();
        $year = $schedule->scheduled_at?->format('Y') ?? now()->format('Y');
        $scheduleCode = preg_replace('/[^A-Za-z0-9_-]/', '-', $schedule->code ?? "schedule-{$schedule->id}");
        $directory = "mentor-journals/{$year}/{$scheduleCode}";
        $filename = "{$uuid}.{$extension}";
        $path = Storage::disk(self::DISK)->putFileAs($directory, $file, $filename);

        if (! is_string($path)) {
            throw ValidationException::withMessages([
                'attachments' => 'The attachment could not be uploaded.',
            ]);
        }

        return [
            'disk' => self::DISK,
            'mime_type' => $mimeType,
            'original_name' => Str::limit(basename($file->getClientOriginalName()), 255, ''),
            'path' => $path,
            'size' => (int) $file->getSize(),
            'uploaded_by' => $uploader->id,
            'uuid' => $uuid,
        ];
    }

    /**
     * @param  array<int, array{disk: string, path: string}>  $uploads
     */
    public function deleteUploads(array $uploads): void
    {
        collect($uploads)
            ->groupBy('disk')
            ->each(fn ($diskUploads, string $disk): bool => Storage::disk($disk)->delete($diskUploads->pluck('path')->all()));
    }

    public function temporaryUrl(MentorJournalAttachment $attachment): string
    {
        return Storage::disk($attachment->disk)->temporaryUrl(
            $attachment->path,
            now()->addMinutes(30),
        );
    }
}
