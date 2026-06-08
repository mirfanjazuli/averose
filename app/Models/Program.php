<?php

namespace App\Models;

use Database\Factories\ProgramFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

#[Fillable(['name', 'slug', 'description', 'max_reschedule', 'status'])]
class Program extends Model
{
    /** @use HasFactory<ProgramFactory> */
    use HasFactory, SoftDeletes;

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    public function fields(): BelongsToMany
    {
        return $this->belongsToMany(AcademicField::class, 'field_program', 'program_id', 'field_id')->withTimestamps();
    }

    public function subjects(): BelongsToMany
    {
        return $this->belongsToMany(Subject::class, 'program_subject')->withTimestamps();
    }

    public function variants(): BelongsToMany
    {
        return $this->belongsToMany(ProgramVariant::class, 'program_variant_program')->withTimestamps();
    }

    protected static function booted(): void
    {
        static::saving(function (Program $program): void {
            if (! $program->isDirty('name') && filled($program->slug)) {
                return;
            }

            $program->slug = static::uniqueSlug($program);
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
            'max_reschedule' => 'integer',
        ];
    }

    private static function uniqueSlug(Program $program): string
    {
        $baseSlug = Str::slug($program->name) ?: 'program';
        $slug = $baseSlug;
        $counter = 2;

        while (static::query()
            ->where('slug', $slug)
            ->when($program->exists, fn ($query) => $query->whereKeyNot($program->getKey()))
            ->exists()) {
            $slug = "{$baseSlug}-{$counter}";
            $counter++;
        }

        return $slug;
    }
}
