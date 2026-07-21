<?php

namespace App\Support;

use Illuminate\Support\Facades\Storage;
use Throwable;

class StorageUrl
{
    public static function forPath(?string $path, ?string $diskName = null): ?string
    {
        if (blank($path)) {
            return null;
        }

        $diskName ??= (string) config('filesystems.default', 'local');
        $disk = Storage::disk($diskName);

        try {
            return $disk->temporaryUrl($path, now()->addMinutes(30));
        } catch (Throwable) {
            return $disk->url($path);
        }
    }
}
