<?php

namespace App\Http\Requests;

use App\Rules\IanaTimezone;
use App\Services\DateTime\UserDateTimeService;
use App\UserRole;
use Carbon\CarbonImmutable;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateStudentScheduleRequest extends FormRequest
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
            'date' => ['required', 'date_format:Y-m-d'],
            'time' => ['required', 'date_format:H:i'],
            'timezone' => ['required', 'string', 'max:64', new IanaTimezone],
        ];
    }

    public function scheduledAtUtc(): CarbonImmutable
    {
        return app(UserDateTimeService::class)->fromLocal(
            "{$this->string('date')} {$this->string('time')}",
            $this->string('timezone')->toString(),
        );
    }

    public function timezone(): string
    {
        return $this->string('timezone')->toString();
    }
}
