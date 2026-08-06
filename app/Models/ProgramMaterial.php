<?php

namespace App\Models;

use Database\Factories\ProgramMaterialFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'uuid', 'program_id', 'uploaded_by', 'title', 'description', 'disk',
    'path', 'original_name', 'mime_type', 'size', 'status',
])]
class ProgramMaterial extends Model
{
    /** @use HasFactory<ProgramMaterialFactory> */
    use HasFactory;

    public function getRouteKeyName(): string
    {
        return 'uuid';
    }

    public function program(): BelongsTo
    {
        return $this->belongsTo(Program::class);
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    /** @return array<string, string> */
    protected function casts(): array
    {
        return ['size' => 'integer'];
    }
}
