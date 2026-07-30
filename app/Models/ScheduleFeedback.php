<?php

namespace App\Models;

use Database\Factories\ScheduleFeedbackFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['schedule_id', 'user_id', 'mentor_id', 'interactivity_rating', 'material_clarity_rating', 'audio_quality_rating', 'visual_quality_rating', 'comment'])]
class ScheduleFeedback extends Model
{
    /** @use HasFactory<ScheduleFeedbackFactory> */
    use HasFactory;

    protected $table = 'schedule_feedback';

    protected function casts(): array
    {
        return [
            'audio_quality_rating' => 'integer',
            'interactivity_rating' => 'integer',
            'material_clarity_rating' => 'integer',
            'visual_quality_rating' => 'integer',
        ];
    }

    public function schedule(): BelongsTo
    {
        return $this->belongsTo(Schedule::class);
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function mentor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'mentor_id');
    }
}
