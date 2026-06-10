<?php

namespace App\Models;

use Database\Factories\SessionBookingFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

#[Fillable(['user_id', 'mentor_id', 'zoom_account_id', 'program_enrollment_id', 'subject_id', 'scheduled_at', 'duration', 'zoom_link', 'zoom_meeting_id', 'zoom_start_url', 'zoom_passcode', 'assigned_at', 'status'])]
class SessionBooking extends Model
{
    /** @use HasFactory<SessionBookingFactory> */
    use HasFactory;

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function mentor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'mentor_id');
    }

    public function zoomAccount(): BelongsTo
    {
        return $this->belongsTo(ZoomAccount::class);
    }

    public function enrollment(): BelongsTo
    {
        return $this->belongsTo(ProgramEnrollment::class, 'program_enrollment_id');
    }

    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
    }

    public function mentorJournal(): HasOne
    {
        return $this->hasOne(MentorJournal::class);
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'scheduled_at' => 'datetime',
            'duration' => 'integer',
            'assigned_at' => 'datetime',
        ];
    }
}
