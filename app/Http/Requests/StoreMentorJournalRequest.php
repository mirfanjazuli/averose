<?php

namespace App\Http\Requests;

use App\Models\SessionBooking;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreMentorJournalRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $sessionBooking = $this->route('session_booking');

        return $sessionBooking instanceof SessionBooking
            && $this->user()?->isMentor()
            && $sessionBooking->mentor_id === $this->user()->id;
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
            'improvement_area' => ['required', 'string', 'max:5000'],
            'next_improvement_plan' => ['required', 'string', 'max:5000'],
        ];
    }
}
