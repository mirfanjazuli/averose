<?php

namespace App\Services\DateTime;

use App\Models\User;
use App\UserTimezoneMode;
use DateTimeZone;

class UserTimezoneSynchronizer
{
    /** @var list<string>|null */
    private static ?array $timezones = null;

    public function isValid(string $timezone): bool
    {
        self::$timezones ??= DateTimeZone::listIdentifiers(DateTimeZone::ALL);

        return in_array($timezone, self::$timezones, true);
    }

    /** @return list<string> */
    public function timezones(): array
    {
        self::$timezones ??= DateTimeZone::listIdentifiers(DateTimeZone::ALL);

        return self::$timezones;
    }

    public function syncAutomatic(User $user, string $timezone): bool
    {
        if ($user->timezone_mode !== UserTimezoneMode::Auto) {
            return false;
        }

        return $this->save($user, $timezone, UserTimezoneMode::Auto);
    }

    public function updatePreference(User $user, string $timezone, UserTimezoneMode $mode): bool
    {
        return $this->save($user, $timezone, $mode);
    }

    private function save(User $user, string $timezone, UserTimezoneMode $mode): bool
    {
        if (! $this->isValid($timezone)) {
            return false;
        }

        if ($user->timezone === $timezone && $user->timezone_mode === $mode) {
            return false;
        }

        return $user->forceFill([
            'timezone' => $timezone,
            'timezone_mode' => $mode,
        ])->save();
    }
}
