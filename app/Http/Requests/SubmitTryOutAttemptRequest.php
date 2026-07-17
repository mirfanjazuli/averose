<?php

namespace App\Http\Requests;

use App\Models\TryOut;
use App\Models\TryOutQuestion;
use App\TryOutQuestionType;
use App\UserRole;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class SubmitTryOutAttemptRequest extends FormRequest
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
            'answers' => ['required', 'array'],
        ];
    }

    /** @return array<int, callable> */
    public function after(): array
    {
        return [function (Validator $validator): void {
            /** @var TryOut|null $tryOut */
            $tryOut = $this->route('try_out');

            if (! $tryOut instanceof TryOut || ! is_array($this->input('answers'))) {
                return;
            }

            $questions = $tryOut->questions()->get()->keyBy(fn (TryOutQuestion $question): string => (string) $question->id);

            foreach ($this->input('answers') as $questionId => $answer) {
                /** @var TryOutQuestion|null $question */
                $question = $questions->get((string) $questionId);

                if ($question === null) {
                    $validator->errors()->add("answers.{$questionId}", 'This question does not belong to the try out.');

                    continue;
                }

                if ($answer === null || $answer === '') {
                    continue;
                }

                $type = $question->question_type ?? TryOutQuestionType::SingleChoice;

                if ($type === TryOutQuestionType::MultipleAnswer) {
                    if (! is_array($answer) || $answer === []) {
                        $validator->errors()->add("answers.{$questionId}", 'Select at least one answer.');

                        continue;
                    }

                    $normalized = array_map(fn (mixed $value): string => strtoupper((string) $value), $answer);

                    if (count($normalized) !== count(array_unique($normalized))) {
                        $validator->errors()->add("answers.{$questionId}", 'Duplicate answers are not allowed.');
                    }

                    if (array_diff($normalized, ['A', 'B', 'C', 'D', 'E']) !== []) {
                        $validator->errors()->add("answers.{$questionId}", 'Answers must use options A through E.');
                    }

                    continue;
                }

                if ($type === TryOutQuestionType::NumericAnswer) {
                    if (! is_string($answer) || preg_match('/^[+-]?\d+(?:[.,]\d+)?$/', trim($answer)) !== 1) {
                        $validator->errors()->add("answers.{$questionId}", 'Enter a valid numeric answer.');
                    }

                    continue;
                }

                if (! is_string($answer) || ! in_array(strtoupper($answer), ['A', 'B', 'C', 'D', 'E'], true)) {
                    $validator->errors()->add("answers.{$questionId}", 'Select one answer from A through E.');
                }
            }
        }];
    }
}
