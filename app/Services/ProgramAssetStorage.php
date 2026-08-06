<?php

namespace App\Services;

use App\Models\Program;
use App\Models\ProgramMaterial;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class ProgramAssetStorage
{
    public const DISK = 'r2';

    /** @var array<string, string> */
    private const EXTENSIONS_BY_MIME = [
        'application/pdf' => 'pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' => 'docx',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation' => 'pptx',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' => 'xlsx',
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
    ];

    /** @var array<string, string> */
    private const THUMBNAIL_EXTENSIONS_BY_MIME = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
    ];

    public function storeThumbnail(UploadedFile $file, Program $program): string
    {
        return $this->storeFile(
            $file,
            "programs/{$program->slug}/thumbnails",
            self::THUMBNAIL_EXTENSIONS_BY_MIME,
            'thumbnail',
        )['path'];
    }

    /**
     * @return array{disk: string, mime_type: string, original_name: string, path: string, size: int, uuid: string}
     */
    public function storeMaterial(UploadedFile $file, Program $program): array
    {
        return $this->storeFile(
            $file,
            "programs/{$program->slug}/materials",
            self::EXTENSIONS_BY_MIME,
            'materials',
        );
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

    public function deletePath(string $path, string $disk = self::DISK): void
    {
        Storage::disk($disk)->delete($path);
    }

    public function temporaryUrl(ProgramMaterial $material): string
    {
        return Storage::disk($material->disk)->temporaryUrl(
            $material->path,
            now()->addMinutes(30),
        );
    }

    /**
     * @param  array<string, string>  $extensionsByMime
     * @return array{disk: string, mime_type: string, original_name: string, path: string, size: int, uuid: string}
     */
    private function storeFile(
        UploadedFile $file,
        string $directory,
        array $extensionsByMime,
        string $errorKey,
    ): array {
        $mimeType = (string) $file->getMimeType();
        $extension = $extensionsByMime[$mimeType] ?? null;

        if (! $extension) {
            throw ValidationException::withMessages([
                $errorKey => 'The selected file format is not supported.',
            ]);
        }

        $uuid = (string) Str::uuid();
        $path = Storage::disk(self::DISK)->putFileAs(
            $directory,
            $file,
            "{$uuid}.{$extension}",
        );

        if (! is_string($path)) {
            throw ValidationException::withMessages([
                $errorKey => 'The file could not be uploaded.',
            ]);
        }

        return [
            'disk' => self::DISK,
            'mime_type' => $mimeType,
            'original_name' => Str::limit(basename($file->getClientOriginalName()), 255, ''),
            'path' => $path,
            'size' => (int) $file->getSize(),
            'uuid' => $uuid,
        ];
    }
}
