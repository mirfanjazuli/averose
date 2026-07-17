<?php

namespace App\Models;

use Carbon\CarbonInterface;
use Database\Factories\TryOutAccessFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['try_out_id', 'try_out_group_id', 'user_id', 'available_from', 'available_until', 'attempt_quota', 'attempts_used', 'status'])]
class TryOutAccess extends Model
{
    /** @use HasFactory<TryOutAccessFactory> */
    use HasFactory;

    protected function casts(): array
    {
        return [
            'attempt_quota' => 'integer',
            'attempts_used' => 'integer',
            'available_from' => 'date',
            'available_until' => 'date',
        ];
    }

    public function remainingAttempts(): int
    {
        return max(0, $this->attempt_quota - $this->attempts_used);
    }

    public function isActiveFor(?CarbonInterface $date = null): bool
    {
        $date ??= now();

        return $this->status === 'active'
            && $this->available_from->copy()->startOfDay()->lessThanOrEqualTo($date)
            && $this->available_until->copy()->endOfDay()->greaterThanOrEqualTo($date)
            && $this->remainingAttempts() > 0;
    }

    public function tryOut(): BelongsTo
    {
        return $this->belongsTo(TryOut::class);
    }

    public function group(): BelongsTo
    {
        return $this->belongsTo(TryOutGroup::class, 'try_out_group_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function attempts(): HasMany
    {
        return $this->hasMany(TryOutAttempt::class);
    }
}
