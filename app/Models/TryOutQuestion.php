<?php

namespace App\Models;

use Database\Factories\TryOutQuestionFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['try_out_id', 'subject_id', 'subject_name', 'number', 'question_text', 'question_html', 'options', 'options_html', 'answer', 'explanation'])]
class TryOutQuestion extends Model
{
    /** @use HasFactory<TryOutQuestionFactory> */
    use HasFactory;

    protected function casts(): array
    {
        return [
            'options' => 'array',
            'options_html' => 'array',
        ];
    }

    public function tryOut(): BelongsTo
    {
        return $this->belongsTo(TryOut::class);
    }

    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
    }
}
