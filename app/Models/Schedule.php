<?php

namespace App\Models;

use App\ScheduleDeliveryMode;
use App\UserRole;
use Database\Factories\ScheduleFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

#[Fillable(['user_id', 'mentor_id', 'zoom_account_id', 'program_enrollment_id', 'subject_id', 'scheduled_at', 'duration', 'delivery_mode', 'zoom_link', 'zoom_meeting_id', 'zoom_start_url', 'zoom_passcode', 'assigned_at', 'status'])]
class Schedule extends Model
{
    /** @use HasFactory<ScheduleFactory> */
    use HasFactory;

    protected $table = 'schedules';

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

    public function feedback(): HasOne
    {
        return $this->hasOne(ScheduleFeedback::class);
    }

    public function recordings(): HasMany
    {
        return $this->hasMany(Recording::class);
    }

    public function histories(): HasMany
    {
        return $this->hasMany(ScheduleHistory::class);
    }

    public function rescheduleRequests(): HasMany
    {
        return $this->hasMany(RescheduleRequest::class);
    }

    public function pendingRescheduleRequest(): HasOne
    {
        return $this->hasOne(RescheduleRequest::class)->where('status', 'pending')->latestOfMany();
    }

    /**
     * @param  array<string, mixed>  $changes
     */
    public function recordHistory(string $action, string $description, ?User $user = null, array $changes = [], ?string $ipAddress = null): ScheduleHistory
    {
        return $this->histories()->create([
            'action' => $action,
            'changes' => $changes === [] ? null : $changes,
            'description' => $description,
            'ip_address' => $ipAddress,
            'user_id' => $user?->id,
            'user_name' => $user?->name,
            'user_role' => $user?->role instanceof UserRole ? $user->role->value : ($user?->role ? (string) $user->role : null),
        ]);
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'assigned_at' => 'datetime',
            'delivery_mode' => ScheduleDeliveryMode::class,
            'duration' => 'integer',
            'scheduled_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::created(function (Schedule $schedule): void {
            if ($schedule->code) {
                return;
            }

            $schedule->forceFill([
                'code' => sprintf(
                    'SCH-%s-%06d',
                    $schedule->created_at->format('Y'),
                    $schedule->getKey(),
                ),
            ])->saveQuietly();
        });
    }
}
