<?php

namespace App\Models;

use Database\Factories\RescheduleRequestFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['schedule_id', 'user_id', 'mentor_id', 'reviewed_by', 'current_scheduled_at', 'requested_scheduled_at', 'duration', 'reason', 'notes', 'status', 'admin_note', 'reviewed_at'])]
class RescheduleRequest extends Model
{
    /** @use HasFactory<RescheduleRequestFactory> */
    use HasFactory;

    protected $table = 'reschedule_requests';

    public function schedule(): BelongsTo
    {
        return $this->belongsTo(Schedule::class, 'schedule_id');
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
