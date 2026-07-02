<?php

namespace App\Models;

use Database\Factories\TryOutFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

#[Fillable(['title', 'slug', 'description', 'source_file_name', 'duration_minutes', 'status'])]
class TryOut extends Model
{
    /** @use HasFactory<TryOutFactory> */
    use HasFactory;

    public function questions(): HasMany
    {
        return $this->hasMany(TryOutQuestion::class)->orderBy('number');
    }

    public function attempts(): HasMany
    {
        return $this->hasMany(TryOutAttempt::class);
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    protected static function booted(): void
    {
        static::saving(function (TryOut $tryOut): void {
            if (! $tryOut->isDirty('title') && filled($tryOut->slug)) {
                return;
            }

            $tryOut->slug = static::uniqueSlug($tryOut);
        });
    }

    private static function uniqueSlug(TryOut $tryOut): string
    {
        $baseSlug = Str::slug($tryOut->title) ?: 'try-out';
        $slug = $baseSlug;
        $counter = 2;

        while (static::query()
            ->where('slug', $slug)
            ->when($tryOut->exists, fn ($query) => $query->whereKeyNot($tryOut->getKey()))
            ->exists()) {
            $slug = "{$baseSlug}-{$counter}";
            $counter++;
        }

        return $slug;
    }
}
