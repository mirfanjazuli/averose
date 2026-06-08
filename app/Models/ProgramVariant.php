<?php

namespace App\Models;

use Database\Factories\ProgramVariantFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable(['field_id', 'name', 'session', 'duration', 'price', 'status'])]
class ProgramVariant extends Model
{
    /** @use HasFactory<ProgramVariantFactory> */
    use HasFactory, SoftDeletes;

    public function field(): BelongsTo
    {
        return $this->belongsTo(AcademicField::class, 'field_id');
    }

    public function programs(): BelongsToMany
    {
        return $this->belongsToMany(Program::class, 'program_variant_program')->withTimestamps();
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'session' => 'integer',
            'duration' => 'integer',
            'price' => 'decimal:2',
        ];
    }
}
