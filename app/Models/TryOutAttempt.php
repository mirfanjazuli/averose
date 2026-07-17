<?php

namespace App\Models;

use App\TryOutScoringMode;
use Database\Factories\TryOutAttemptFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['try_out_id', 'user_id', 'try_out_access_id', 'answers', 'correct_count', 'partial_count', 'wrong_count', 'unanswered_count', 'question_count', 'score', 'scoring_mode', 'max_score', 'percentage_score', 'scoring_snapshot', 'question_snapshot', 'score_breakdown', 'submitted_at'])]
class TryOutAttempt extends Model
{
    /** @use HasFactory<TryOutAttemptFactory> */
    use HasFactory;

    protected function casts(): array
    {
        return [
            'answers' => 'array',
            'scoring_mode' => TryOutScoringMode::class,
            'score' => 'float',
            'max_score' => 'float',
            'percentage_score' => 'float',
            'scoring_snapshot' => 'array',
            'question_snapshot' => 'array',
            'score_breakdown' => 'array',
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

    public function access(): BelongsTo
    {
        return $this->belongsTo(TryOutAccess::class, 'try_out_access_id');
    }
}
