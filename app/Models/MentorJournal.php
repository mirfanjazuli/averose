<?php

namespace App\Models;

use Database\Factories\MentorJournalFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['schedule_id', 'mentor_id', 'student_id', 'subject_id', 'slug', 'achievement', 'improvement_area', 'next_improvement_plan'])]
class MentorJournal extends Model
{
    /** @use HasFactory<MentorJournalFactory> */
    use HasFactory;

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    public function getRouteKey(): mixed
    {
        return $this->routeIdentifier();
    }

    public function routeIdentifier(): string
    {
        return $this->schedule?->code ?? $this->slug;
    }

    public function resolveRouteBinding($value, $field = null): ?self
    {
        $routeKey = $field ?? $this->getRouteKeyName();

        return $this->newQuery()
            ->where(function (Builder $query) use ($routeKey, $value): void {
                $query->where($routeKey, $value);

                if ($routeKey === 'slug') {
                    $query->orWhereHas('schedule', fn (Builder $scheduleQuery): Builder => $scheduleQuery->where('code', $value));
                }
            })
            ->first();
    }

    public function schedule(): BelongsTo
    {
        return $this->belongsTo(Schedule::class);
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

    public function attachments(): HasMany
    {
        return $this->hasMany(MentorJournalAttachment::class);
    }
}
