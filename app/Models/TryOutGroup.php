<?php

namespace App\Models;

use Database\Factories\TryOutGroupFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

#[Fillable(['try_out_id', 'name', 'token', 'available_from', 'available_until', 'attempt_quota', 'max_participants', 'status'])]
class TryOutGroup extends Model
{
    /** @use HasFactory<TryOutGroupFactory> */
    use HasFactory;

    protected function casts(): array
    {
        return [
            'attempt_quota' => 'integer',
            'available_from' => 'date',
            'available_until' => 'date',
            'max_participants' => 'integer',
        ];
    }

    public function redeemedCount(): int
    {
        return $this->accesses()->count();
    }

    public function hasParticipantCapacity(): bool
    {
        return $this->max_participants === null || $this->redeemedCount() < $this->max_participants;
    }

    public function tryOut(): BelongsTo
    {
        return $this->belongsTo(TryOut::class);
    }

    public function accesses(): HasMany
    {
        return $this->hasMany(TryOutAccess::class);
    }

    protected static function booted(): void
    {
        static::creating(function (TryOutGroup $group): void {
            if (blank($group->token)) {
                $group->token = static::uniqueToken();
            }
        });
    }

    private static function uniqueToken(): string
    {
        do {
            $token = Str::upper(Str::random(10));
        } while (static::query()->where('token', $token)->exists());

        return $token;
    }
}
