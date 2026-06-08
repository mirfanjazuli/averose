<?php

namespace App\Models;

use Database\Factories\AcademicFieldFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

#[Fillable(['name', 'slug', 'description', 'status'])]
class AcademicField extends Model
{
    /** @use HasFactory<AcademicFieldFactory> */
    use HasFactory, SoftDeletes;

    protected $table = 'fields';

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    public function subjects(): BelongsToMany
    {
        return $this->belongsToMany(Subject::class, 'field_subject', 'field_id', 'subject_id')->withTimestamps();
    }

    public function programs(): BelongsToMany
    {
        return $this->belongsToMany(Program::class, 'field_program', 'field_id', 'program_id')->withTimestamps();
    }

    public function variants(): HasMany
    {
        return $this->hasMany(ProgramVariant::class, 'field_id');
    }

    protected static function booted(): void
    {
        static::saving(function (AcademicField $field): void {
            if (! $field->isDirty('name') && filled($field->slug)) {
                return;
            }

            $field->slug = static::uniqueSlug($field);
        });
    }

    private static function uniqueSlug(AcademicField $field): string
    {
        $baseSlug = Str::slug($field->name) ?: 'field';
        $slug = $baseSlug;
        $counter = 2;

        while (static::query()
            ->where('slug', $slug)
            ->when($field->exists, fn ($query) => $query->whereKeyNot($field->getKey()))
            ->exists()) {
            $slug = "{$baseSlug}-{$counter}";
            $counter++;
        }

        return $slug;
    }
}
