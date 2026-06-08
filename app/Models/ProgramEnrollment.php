<?php

namespace App\Models;

use Database\Factories\ProgramEnrollmentFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['user_id', 'program_id', 'field_id', 'program_variant_id', 'start_date', 'max_reschedule', 'sessions_used', 'status'])]
class ProgramEnrollment extends Model
{
    /** @use HasFactory<ProgramEnrollmentFactory> */
    use HasFactory;

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function program(): BelongsTo
    {
        return $this->belongsTo(Program::class);
    }

    public function field(): BelongsTo
    {
        return $this->belongsTo(AcademicField::class, 'field_id');
    }

    public function variant(): BelongsTo
    {
        return $this->belongsTo(ProgramVariant::class, 'program_variant_id');
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(SessionBooking::class);
    }

    public function sessionsRemaining(): int
    {
        return max(0, ($this->variant?->session ?? 0) - $this->sessions_used);
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'max_reschedule' => 'integer',
            'sessions_used' => 'integer',
        ];
    }
}
