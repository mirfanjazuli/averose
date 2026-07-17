<?php

namespace App\Models;

use Database\Factories\RecordingFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['schedule_id', 'user_id', 'zoom_account_id', 'zoom_meeting_id', 'zoom_meeting_uuid', 'zoom_recording_file_id', 'youtube_video_id', 'youtube_url', 'title', 'recorded_at', 'duration', 'metadata', 'status'])]
class Recording extends Model
{
    /** @use HasFactory<RecordingFactory> */
    use HasFactory;

    protected $table = 'recordings';

    public function schedule(): BelongsTo
    {
        return $this->belongsTo(Schedule::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function zoomAccount(): BelongsTo
    {
        return $this->belongsTo(ZoomAccount::class);
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'duration' => 'integer',
            'metadata' => 'array',
            'recorded_at' => 'datetime',
        ];
    }
}
