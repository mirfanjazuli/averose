<?php

namespace App\Models;

use Database\Factories\MentorLevelFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Support\Str;

#[Fillable(['name', 'slug', 'hourly_rate', 'is_default', 'status'])]
class MentorLevel extends Model
{
    /** @use HasFactory<MentorLevelFactory> */
    use HasFactory;

    protected $attributes = [
        'hourly_rate' => 0,
        'is_default' => false,
        'status' => 'active',
    ];

    public function mentors(): HasManyThrough
    {
        return $this->hasManyThrough(User::class, MentorProfile::class, 'mentor_level_id', 'id', 'id', 'user_id');
    }

    public function mentorProfiles(): HasMany
    {
        return $this->hasMany(MentorProfile::class);
    }

    public static function default(): ?self
    {
        return static::query()
            ->where('status', 'active')
            ->orderByDesc('is_default')
            ->orderBy('name')
            ->first();
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'hourly_rate' => 'decimal:2',
            'is_default' => 'boolean',
        ];
    }

    protected static function booted(): void
    {
        static::saving(function (MentorLevel $level): void {
            if ($level->isDirty('name') || blank($level->slug)) {
                $level->slug = static::uniqueSlug(Str::slug($level->name) ?: 'mentor-level', $level);
            }
        });

        static::saved(function (MentorLevel $level): void {
            if (! $level->is_default) {
                return;
            }

            static::query()
                ->whereKeyNot($level->id)
                ->where('is_default', true)
                ->update(['is_default' => false]);
        });
    }

    private static function uniqueSlug(string $baseSlug, MentorLevel $level): string
    {
        $slug = $baseSlug;
        $counter = 2;

        while (static::query()
            ->where('slug', $slug)
            ->when($level->exists, fn ($query) => $query->whereKeyNot($level->id))
            ->exists()) {
            $slug = "{$baseSlug}-{$counter}";
            $counter++;
        }

        return $slug;
    }
}
