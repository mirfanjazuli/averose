<?php

namespace App\Models;

use Database\Factories\SessionRescheduleRequestFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['session_booking_id', 'user_id', 'mentor_id', 'reviewed_by', 'current_scheduled_at', 'requested_scheduled_at', 'duration', 'reason', 'notes', 'status', 'admin_note', 'reviewed_at'])]
class SessionRescheduleRequest extends Model
{
    /** @use HasFactory<SessionRescheduleRequestFactory> */
    use HasFactory;

    public function booking(): BelongsTo
    {
        return $this->belongsTo(SessionBooking::class, 'session_booking_id');
    }

    public function mentor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'mentor_id');
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
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
            'current_scheduled_at' => 'datetime',
            'duration' => 'integer',
            'requested_scheduled_at' => 'datetime',
            'reviewed_at' => 'datetime',
        ];
    }
}
