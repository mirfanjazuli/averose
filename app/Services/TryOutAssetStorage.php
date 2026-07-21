<?php

namespace App\Services;

use App\Models\TryOut;
use App\Models\TryOutAsset;
use App\Models\User;
use DOMDocument;
use DOMElement;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use RuntimeException;
use Throwable;

class TryOutAssetStorage
{
    private const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

    /** @var array<string, string> */
    private const EXTENSIONS_BY_MIME = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
    ];

    public function storeEmbedded(string $contents, string $sourceName, User $uploader, string $previewToken): TryOutAsset
    {
        return $this->store(
            contents: $contents,
            sourceName: $sourceName,
            uploader: $uploader,
            directory: "try-out-previews/{$previewToken}",
            status: 'preview',
            previewToken: $previewToken,
        );
    }

    public function storeUpload(UploadedFile $image, TryOut $tryOut, User $uploader): TryOutAsset
    {
        $contents = $image->get();

        return $this->store(
            contents: $contents,
            sourceName: $image->getClientOriginalName(),
            uploader: $uploader,
            directory: "try-outs/{$this->tryOutDirectoryName($tryOut)}/pending",
            status: 'pending',
            tryOut: $tryOut,
        );
    }

    public function promotePreview(string $previewToken, TryOut $tryOut, User $uploader): void
    {
        $assets = TryOutAsset::query()
            ->where('preview_token', $previewToken)
            ->whereBelongsTo($uploader, 'uploader')
            ->where('status', 'preview')
            ->get();

        $assets
            ->each(function (TryOutAsset $asset) use ($tryOut): void {
                $extension = pathinfo($asset->path, PATHINFO_EXTENSION);
                $permanentPath = "try-outs/{$this->tryOutDirectoryName($tryOut)}/{$asset->uuid}.{$extension}";
                $disk = Storage::disk($asset->disk);

                if (! $disk->move($asset->path, $permanentPath)) {
                    throw new RuntimeException("Unable to promote try out asset {$asset->uuid}.");
                }

                $asset->update([
                    'path' => $permanentPath,
                    'preview_token' => null,
                    'status' => 'permanent',
                    'try_out_id' => $tryOut->id,
                ]);
            });

        $assets
            ->pluck('disk')
            ->unique()
            ->each(fn (string $disk): bool => Storage::disk($disk)->deleteDirectory("try-out-previews/{$previewToken}"));
    }

    public function finalizeReferencedAssets(TryOut $tryOut, User $uploader, string ...$htmlValues): void
    {
        $uuids = collect($htmlValues)
            ->flatMap(fn (string $html): array => $this->referencedAssetUuids($html))
            ->unique()
            ->values();

        if ($uuids->isEmpty()) {
            return;
        }

        TryOutAsset::query()
            ->whereBelongsTo($tryOut)
            ->whereBelongsTo($uploader, 'uploader')
            ->whereIn('uuid', $uuids)
            ->where('status', 'pending')
            ->update(['status' => 'permanent']);
    }

    public function cleanupPreview(string $previewToken, ?User $uploader = null): void
    {
        TryOutAsset::query()
            ->where('preview_token', $previewToken)
            ->when($uploader, fn ($query) => $query->whereBelongsTo($uploader, 'uploader'))
            ->get()
            ->each(fn (TryOutAsset $asset) => $this->delete($asset));
    }

    public function cleanupExpiredTemporaryAssets(): int
    {
        $deleted = 0;

        TryOutAsset::query()
            ->whereIn('status', ['preview', 'pending'])
            ->where('created_at', '<=', now()->subHour())
            ->eachById(function (TryOutAsset $asset) use (&$deleted): void {
                $this->delete($asset);
                $deleted++;
            });

        return $deleted;
    }

    public function temporaryUrl(TryOutAsset $asset): string
    {
        return Cache::remember(
            "try-out-asset-url:{$asset->uuid}:{$asset->updated_at?->timestamp}",
            now()->addMinutes(25),
            fn (): string => Storage::disk($asset->disk)->temporaryUrl($asset->path, now()->addMinutes(30)),
        );
    }

    /**
     * @param  array<int, string>  $htmlValues
     * @return array<int, string>
     */
    public function resolveTryOutAssetUrls(TryOut $tryOut, array $htmlValues): array
    {
        $uuids = collect($htmlValues)
            ->flatMap(fn (string $html): array => $this->referencedAssetUuids($html))
            ->unique()
            ->values();

        if ($uuids->isEmpty()) {
            return $htmlValues;
        }

        $replacements = TryOutAsset::query()
            ->whereBelongsTo($tryOut)
            ->where('status', 'permanent')
            ->whereIn('uuid', $uuids)
            ->get()
            ->mapWithKeys(fn (TryOutAsset $asset): array => [
                "/try-out-assets/{$asset->uuid}" => $this->temporaryUrl($asset),
            ])
            ->all();

        if ($replacements === []) {
            return $htmlValues;
        }

        return array_map(
            fn (string $html): string => str_replace(array_keys($replacements), array_values($replacements), $html),
            $htmlValues,
        );
    }

    public function url(TryOutAsset $asset): string
    {
        return route(
            'try-out-assets.show',
            ['try_out_asset' => $asset->uuid],
            absolute: false,
        );
    }

    public function sanitizeEditorHtml(string $html, TryOut $tryOut): string
    {
        $document = new DOMDocument('1.0', 'UTF-8');
        $previousState = libxml_use_internal_errors(true);
        $document->loadHTML(
            '<?xml encoding="UTF-8"><div id="try-out-rich-content">'.$html.'</div>',
            LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD,
        );
        libxml_clear_errors();
        libxml_use_internal_errors($previousState);

        $root = $document->getElementById('try-out-rich-content');

        if (! $root instanceof DOMElement) {
            return e(strip_tags($html));
        }

        $blockedTags = ['base', 'button', 'embed', 'form', 'iframe', 'input', 'link', 'meta', 'object', 'script', 'select', 'style', 'textarea'];

        foreach ($blockedTags as $tag) {
            while ($root->getElementsByTagName($tag)->length > 0) {
                $root->getElementsByTagName($tag)->item(0)?->parentNode?->removeChild($root->getElementsByTagName($tag)->item(0));
            }
        }

        foreach (iterator_to_array($root->getElementsByTagName('*')) as $element) {
            if (! $element instanceof DOMElement) {
                continue;
            }

            foreach (iterator_to_array($element->attributes) as $attribute) {
                $name = Str::lower($attribute->name);
                $value = Str::lower(trim($attribute->value));

                if (str_starts_with($name, 'on') || in_array($name, ['srcdoc', 'style'], true) || str_starts_with($value, 'javascript:')) {
                    $element->removeAttribute($attribute->name);
                }
            }
        }

        foreach (iterator_to_array($root->getElementsByTagName('img')) as $image) {
            if (! $image instanceof DOMElement) {
                continue;
            }

            $uuid = $this->assetUuidFromUrl($image->getAttribute('src'));
            $isOwnedAsset = $uuid !== null && TryOutAsset::query()
                ->whereBelongsTo($tryOut)
                ->where('uuid', $uuid)
                ->exists();

            if (! $isOwnedAsset) {
                $image->parentNode?->removeChild($image);

                continue;
            }

            $alt = $image->getAttribute('alt');

            foreach (iterator_to_array($image->attributes) as $attribute) {
                $image->removeAttribute($attribute->name);
            }

            $image->setAttribute('src', route('try-out-assets.show', ['try_out_asset' => $uuid], absolute: false));
            $image->setAttribute('alt', Str::limit($alt, 255, ''));
            $image->setAttribute('loading', 'lazy');
            $image->setAttribute('decoding', 'async');
        }

        $sanitized = '';

        foreach ($root->childNodes as $child) {
            $sanitized .= $document->saveHTML($child);
        }

        return trim($sanitized);
    }

    public function plainText(string $html): string
    {
        return Str::of(html_entity_decode(strip_tags($html), ENT_QUOTES | ENT_HTML5, 'UTF-8'))
            ->replace(["\u{00a0}", "\u{2009}", "\u{202f}"], ' ')
            ->replaceMatches('/\s+/u', ' ')
            ->trim()
            ->toString();
    }

    /** @return array<int, string> */
    public function referencedAssetUuids(string $html): array
    {
        preg_match_all('#/try-out-assets/([0-9a-f-]{36})#i', $html, $matches);

        return array_values(array_unique($matches[1] ?? []));
    }

    private function store(
        string $contents,
        string $sourceName,
        User $uploader,
        string $directory,
        string $status,
        ?string $previewToken = null,
        ?TryOut $tryOut = null,
    ): TryOutAsset {
        $size = strlen($contents);
        $mimeType = (new \finfo(FILEINFO_MIME_TYPE))->buffer($contents) ?: 'application/octet-stream';
        $extension = self::EXTENSIONS_BY_MIME[$mimeType] ?? null;
        $field = $status === 'preview' ? 'document' : 'image';

        if ($extension === null) {
            throw ValidationException::withMessages([
                $field => "Image {$sourceName} uses unsupported format {$mimeType}. Use PNG, JPG, or WebP.",
            ]);
        }

        if ($size > self::MAX_IMAGE_SIZE) {
            throw ValidationException::withMessages([
                $field => "Image {$sourceName} exceeds the 5 MB limit.",
            ]);
        }

        $diskName = (string) config('filesystems.default', 'local');
        $uuid = (string) Str::uuid();
        $path = "{$directory}/{$uuid}.{$extension}";
        $disk = Storage::disk($diskName);

        try {
            if (! $disk->put($path, $contents, ['visibility' => 'private', 'ContentType' => $mimeType])) {
                throw new RuntimeException("Unable to upload image {$sourceName}.");
            }

            return TryOutAsset::query()->create([
                'disk' => $diskName,
                'mime_type' => $mimeType,
                'path' => $path,
                'preview_token' => $previewToken,
                'size' => $size,
                'status' => $status,
                'try_out_id' => $tryOut?->id,
                'uploaded_by' => $uploader->id,
                'uuid' => $uuid,
            ]);
        } catch (Throwable $exception) {
            $disk->delete($path);
            throw $exception;
        }
    }

    private function delete(TryOutAsset $asset): void
    {
        Storage::disk($asset->disk)->delete($asset->path);
        $asset->delete();
    }

    private function tryOutDirectoryName(TryOut $tryOut): string
    {
        $slug = Str::slug($tryOut->slug ?: $tryOut->title) ?: 'try-out';

        return "{$tryOut->id}-{$slug}";
    }

    private function assetUuidFromUrl(string $url): ?string
    {
        $path = parse_url($url, PHP_URL_PATH);

        if (! is_string($path) || preg_match('#^/try-out-assets/([0-9a-f-]{36})$#i', $path, $matches) !== 1) {
            return null;
        }

        return $matches[1];
    }
}
