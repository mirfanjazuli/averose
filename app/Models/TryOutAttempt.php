<?php

namespace App\Models;

use Database\Factories\TryOutAttemptFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['try_out_id', 'user_id', 'answers', 'correct_count', 'question_count', 'score', 'submitted_at'])]
class TryOutAttempt extends Model
{
    /** @use HasFactory<TryOutAttemptFactory> */
    use HasFactory;

    protected function casts(): array
    {
        return [
            'answers' => 'array',
            'score' => 'float',
            'submitted_at' => 'datetime',
        ];
    }

    public function tryOut(): BelongsTo
    {
        return $this->belongsTo(TryOut::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
