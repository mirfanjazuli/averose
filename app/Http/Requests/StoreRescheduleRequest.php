<?php

namespace App\Http\Requests;

use App\Rules\IanaTimezone;
use App\Services\DateTime\UserDateTimeService;
use App\UserRole;
use Carbon\CarbonImmutable;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreRescheduleRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->role === UserRole::Student;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'notes' => ['required', 'string', 'max:1000'],
            'reason' => ['required', 'string', 'max:120'],
            'requested_scheduled_at' => ['required', 'date_format:Y-m-d H:i'],
            'timezone' => ['required', 'string', 'max:64', new IanaTimezone],
        ];
    }

    public function requestedScheduledAtUtc(): CarbonImmutable
    {
        return app(UserDateTimeService::class)->fromLocal(
            $this->string('requested_scheduled_at')->toString(),
            $this->timezone(),
        );
    }

    public function timezone(): string
    {
        return $this->string('timezone')->toString();
    }
}
