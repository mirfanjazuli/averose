<?php

namespace App\Http\Requests;

use App\Models\Schedule;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreMentorJournalRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $schedule = $this->route('schedule');

        return $schedule instanceof Schedule
            && $this->user()?->isMentor()
            && $schedule->mentor_id === $this->user()->id;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'achievement' => ['required', 'string', 'max:5000'],
            'attachments' => ['nullable', 'array', 'max:5'],
            'attachments.*' => ['file', 'mimetypes:application/pdf,image/jpeg,image/png,image/webp', 'max:10240'],
            'improvement_area' => ['required', 'string', 'max:5000'],
            'next_improvement_plan' => ['required', 'string', 'max:5000'],
        ];
    }

    /**
     * @return array<int, callable(Validator): void>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                $schedule = $this->route('schedule');

                if (! $schedule instanceof Schedule) {
                    return;
                }

                if (! in_array($schedule->status, ['assigned', 'rescheduled'], true)) {
                    $validator->errors()->add('schedule', 'This session cannot be completed.');

                    return;
                }

                $endsAt = $schedule->scheduled_at->copy()->addMinutes($schedule->duration);

                if ($endsAt->isFuture()) {
                    $validator->errors()->add('schedule', 'The session can only be completed after it ends.');
                }
            },
        ];
    }
}
