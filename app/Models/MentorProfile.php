<?php

namespace App\Models;

use Database\Factories\MentorProfileFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['user_id', 'mentor_level_id', 'bio', 'expertise', 'bank_name', 'bank_account_name', 'bank_account_number'])]
class MentorProfile extends Model
{
    /** @use HasFactory<MentorProfileFactory> */
    use HasFactory;

    public function mentorLevel(): BelongsTo
    {
        return $this->belongsTo(MentorLevel::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'expertise' => 'array',
        ];
    }
}
