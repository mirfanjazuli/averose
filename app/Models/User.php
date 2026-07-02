<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\UserRole;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Str;
use Laravel\Fortify\Contracts\PasskeyUser;
use Laravel\Fortify\PasskeyAuthenticatable;
use Laravel\Fortify\TwoFactorAuthenticatable;

#[Fillable(['name', 'nickname', 'slug', 'email', 'password', 'role', 'status'])]
#[Hidden(['password', 'two_factor_secret', 'two_factor_recovery_codes', 'remember_token'])]
class User extends Authenticatable implements PasskeyUser
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, PasskeyAuthenticatable, TwoFactorAuthenticatable;

    /**
     * The model's default values for attributes.
     *
     * @var array<string, mixed>
     */
    protected $attributes = [
        'role' => UserRole::Student->value,
        'status' => 'active',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'role' => UserRole::class,
            'two_factor_confirmed_at' => 'datetime',
        ];
    }

    public function isAdmin(): bool
    {
        return $this->role === UserRole::Admin;
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    public function isStudent(): bool
    {
        return $this->role === UserRole::Student;
    }

    public function isMentor(): bool
    {
        return $this->role === UserRole::Mentor;
    }

    public function programEnrollments(): HasMany
    {
        return $this->hasMany(ProgramEnrollment::class);
    }

    public function mentorBookings(): HasMany
    {
        return $this->hasMany(SessionBooking::class, 'mentor_id');
    }

    public function mentorJournals(): HasMany
    {
        return $this->hasMany(MentorJournal::class, 'mentor_id');
    }

    public function sessionRecordings(): HasMany
    {
        return $this->hasMany(SessionRecording::class);
    }

    public function tryOutAttempts(): HasMany
    {
        return $this->hasMany(TryOutAttempt::class);
    }

    protected static function booted(): void
    {
        static::saving(function (User $user): void {
            if ($user->isDirty('name') || blank($user->slug)) {
                $user->slug = static::uniqueValue('slug', Str::slug($user->name) ?: 'user', $user);
            }

            if ($user->isDirty('name') || blank($user->nickname)) {
                $user->nickname = static::uniqueValue('nickname', static::nicknameBase($user->name), $user);
            }
        });
    }

    private static function nicknameBase(string $name): string
    {
        $firstName = Str::of($name)->trim()->explode(' ')->filter()->first() ?? 'User';
        $baseName = Str::of($firstName)->ascii()->replaceMatches('/[^A-Za-z0-9]/', '')->toString();

        return Str::ucfirst(Str::lower($baseName ?: 'User'));
    }

    private static function uniqueValue(string $column, string $baseValue, User $user): string
    {
        $value = $baseValue;
        $counter = 2;

        while (static::query()
            ->where($column, $value)
            ->when($user->exists, fn ($query) => $query->whereKeyNot($user->getKey()))
            ->exists()) {
            $value = "{$baseValue}_{$counter}";
            $counter++;
        }

        return $value;
    }
}
