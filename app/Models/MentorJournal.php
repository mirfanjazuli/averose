<?php

namespace App\Models;

use Database\Factories\MentorJournalFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['session_booking_id', 'mentor_id', 'student_id', 'subject_id', 'slug', 'note', 'achievement', 'improvement_area', 'next_improvement_plan'])]
class MentorJournal extends Model
{
    /** @use HasFactory<MentorJournalFactory> */
    use HasFactory;

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    public function sessionBooking(): BelongsTo
    {
        return $this->belongsTo(SessionBooking::class);
    }

    public function mentor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'mentor_id');
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
    }
}
