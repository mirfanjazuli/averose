<?php

namespace App\Models;

use Database\Factories\StudentProfileFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['user_id', 'parent_phone', 'school', 'education_level', 'grade', 'timezone'])]
class StudentProfile extends Model
{
    /** @use HasFactory<StudentProfileFactory> */
    use HasFactory;

    protected $attributes = [
        'timezone' => 'Asia/Jakarta',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
