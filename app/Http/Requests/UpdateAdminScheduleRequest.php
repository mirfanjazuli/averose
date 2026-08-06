<?php

namespace App\Http\Requests;

use App\Rules\IanaTimezone;
use App\Services\DateTime\UserDateTimeService;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Http\FormRequest;

class UpdateAdminScheduleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasPermission('schedules.assign') ?? false;
    }

    /**
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'date' => ['required', 'date_format:Y-m-d'],
            'time' => ['required', 'date_format:H:i'],
            'timezone' => ['required', 'string', 'max:64', new IanaTimezone],
        ];
    }

    public function scheduledAtUtc(): CarbonImmutable
    {
        return app(UserDateTimeService::class)->fromLocal(
            "{$this->string('date')} {$this->string('time')}",
            $this->timezone(),
        );
    }

    public function timezone(): string
    {
        return $this->string('timezone')->toString();
    }
}
