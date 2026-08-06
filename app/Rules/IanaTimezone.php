<?php

namespace App\Rules;

use Closure;
use DateTimeZone;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Translation\PotentiallyTranslatedString;

class IanaTimezone implements ValidationRule
{
    /** @var list<string>|null */
    private static ?array $identifiers = null;

    /**
     * Run the validation rule.
     *
     * @param  Closure(string, ?string=): PotentiallyTranslatedString  $fail
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        self::$identifiers ??= DateTimeZone::listIdentifiers(DateTimeZone::ALL);

        if (! is_string($value) || ! in_array($value, self::$identifiers, true)) {
            $fail('Zona waktu yang dipilih tidak valid.');
        }
    }
}
