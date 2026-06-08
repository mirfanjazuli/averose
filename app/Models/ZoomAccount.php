<?php

namespace App\Models;

use Database\Factories\ZoomAccountFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

#[Fillable(['name', 'account_id', 'client_id', 'client_secret', 'token_secret'])]
#[Hidden(['client_secret', 'token_secret'])]
class ZoomAccount extends Model
{
    /** @use HasFactory<ZoomAccountFactory> */
    use HasFactory;

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    public function sessionBookings(): HasMany
    {
        return $this->hasMany(SessionBooking::class);
    }

    protected static function booted(): void
    {
        static::saving(function (ZoomAccount $account): void {
            if (! $account->isDirty('name') && filled($account->slug)) {
                return;
            }

            $baseSlug = Str::slug($account->name) ?: 'zoom-account';
            $slug = $baseSlug;
            $counter = 2;

            while (static::query()
                ->where('slug', $slug)
                ->when($account->exists, fn ($query) => $query->whereKeyNot($account->getKey()))
                ->exists()) {
                $slug = "{$baseSlug}-{$counter}";
                $counter++;
            }

            $account->slug = $slug;
        });
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'client_secret' => 'encrypted',
            'token_secret' => 'encrypted',
        ];
    }
}
