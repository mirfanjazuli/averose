<?php

namespace App\Models;

use Database\Factories\SubjectFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

#[Fillable(['name', 'slug', 'description', 'icon', 'status'])]
class Subject extends Model
{
    /** @use HasFactory<SubjectFactory> */
    use HasFactory, SoftDeletes;

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    public function fields(): BelongsToMany
    {
        return $this->belongsToMany(AcademicField::class, 'field_subject', 'subject_id', 'field_id')->withTimestamps();
    }

    public function programs(): BelongsToMany
    {
        return $this->belongsToMany(Program::class, 'program_subject')->withTimestamps();
    }

    protected static function booted(): void
    {
        static::saving(function (Subject $subject): void {
            if (! $subject->isDirty('name') && filled($subject->slug)) {
                return;
            }

            $subject->slug = static::uniqueSlug($subject);
        });
    }

    private static function uniqueSlug(Subject $subject): string
    {
        $baseSlug = Str::slug($subject->name) ?: 'subject';
        $slug = $baseSlug;
        $counter = 2;

        while (static::query()
            ->where('slug', $slug)
            ->when($subject->exists, fn ($query) => $query->whereKeyNot($subject->getKey()))
            ->exists()) {
            $slug = "{$baseSlug}-{$counter}";
            $counter++;
        }

        return $slug;
    }
}
