<?php

namespace App\Models;

use App\Observers\ProgramEnrollmentObserver;
use Database\Factories\ProgramEnrollmentFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['user_id', 'program_id', 'field_id', 'program_variant_id', 'start_date', 'max_reschedule', 'sessions_used', 'status'])]
#[ObservedBy([ProgramEnrollmentObserver::class])]
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
        return $this->belongsTo(Program::class)->withTrashed();
    }

    public function field(): BelongsTo
    {
        return $this->belongsTo(AcademicField::class, 'field_id')->withTrashed();
    }

    public function variant(): BelongsTo
    {
        return $this->belongsTo(ProgramVariant::class, 'program_variant_id')->withTrashed();
    }

    public function schedules(): HasMany
    {
        return $this->hasMany(Schedule::class);
    }

    public function sessionsRemaining(): int
    {
        return max(0, $this->sessionsAtEnrollment() - $this->sessions_used);
    }

    public function programNameAtEnrollment(): string
    {
        return $this->program_name_snapshot ?: ($this->program?->name ?? '-');
    }

    public function fieldNameAtEnrollment(): string
    {
        return $this->field_name_snapshot ?: ($this->field?->name ?? '-');
    }

    public function variantNameAtEnrollment(): string
    {
        return $this->variant_name_snapshot ?: ($this->variant?->name ?? '-');
    }

    public function sessionsAtEnrollment(): int
    {
        return $this->sessions_snapshot ?? ($this->variant?->session ?? 0);
    }

    public function durationAtEnrollment(): int
    {
        return $this->duration_snapshot ?? ($this->variant?->duration ?? 0);
    }

    public function priceAtEnrollment(): string
    {
        return $this->price_snapshot ?? ($this->variant?->price ?? '0.00');
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
            'sessions_snapshot' => 'integer',
            'duration_snapshot' => 'integer',
            'price_snapshot' => 'decimal:2',
        ];
    }
}
