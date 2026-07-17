<?php

namespace App\Services;

use App\Models\TryOut;
use App\Models\TryOutQuestion;
use App\TryOutQuestionType;
use App\TryOutScoringMode;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;

class TryOutScoringService
{
    /** @var array<int, string> */
    private const OPTIONS = ['A', 'B', 'C', 'D', 'E'];

    /**
     * @param  Collection<int, TryOutQuestion>  $questions
     * @param  array<int|string, mixed>  $submittedAnswers
     * @return array{answers: array<string, string|array<int, string>|null>, correct_count: int, partial_count: int, wrong_count: int, unanswered_count: int, score: float, max_score: float, percentage_score: float, scoring_snapshot: array<string, mixed>, question_snapshot: array<int, array<string, mixed>>, score_breakdown: array<string, array{status: string, points: float, credit: float}>}
     */
    public function score(TryOut $tryOut, Collection $questions, array $submittedAnswers): array
    {
        $mode = $tryOut->scoring_mode ?? TryOutScoringMode::RawScore;
        $weights = $mode === TryOutScoringMode::RawScore
            ? $this->resolvedRawScoreWeights($questions)
            : $this->resolvedWeights($questions);
        $answers = [];
        $breakdown = [];
        $questionSnapshot = [];
        $correctCount = 0;
        $partialCount = 0;
        $wrongCount = 0;
        $unansweredCount = 0;
        $score = 0.0;

        foreach ($questions->values() as $index => $question) {
            $questionId = (string) $question->id;
            $correctAnswers = $this->answerKey($question);
            $submittedAnswer = $this->normalizeSubmittedAnswer(
                $submittedAnswers[$questionId] ?? $submittedAnswers[$question->id] ?? null,
                $question->question_type ?? TryOutQuestionType::SingleChoice,
            );
            $answers[$questionId] = $submittedAnswer;
            $isUnanswered = $submittedAnswer === null || $submittedAnswer === [];
            $credit = $isUnanswered ? 0.0 : $this->answerCredit($question, $submittedAnswer, $correctAnswers);
            $isCorrect = $credit === 1.0;

            if ($isUnanswered) {
                $status = 'unanswered';
                $unansweredCount++;
            } elseif ($isCorrect) {
                $status = 'correct';
                $correctCount++;
            } elseif ($credit > 0) {
                $status = 'partial';
                $partialCount++;
            } else {
                $status = 'wrong';
                $wrongCount++;
            }

            $earnedPoints = match ($mode) {
                TryOutScoringMode::RawScore => $weights[$index] * $credit,
                TryOutScoringMode::NegativeMarking => $isUnanswered
                    ? (float) $tryOut->unanswered_points
                    : (float) $tryOut->wrong_points
                        + (((float) $tryOut->correct_points - (float) $tryOut->wrong_points) * $credit),
            };
            $score += $earnedPoints;
            $breakdown[$questionId] = [
                'credit' => round($credit, 4),
                'points' => round($earnedPoints, 2),
                'status' => $status,
            ];
            $questionSnapshot[] = $this->questionSnapshot(
                $question,
                $correctAnswers,
                $weights[$index],
            );
        }

        $maxScore = match ($mode) {
            TryOutScoringMode::NegativeMarking => $questions->count() * (float) $tryOut->correct_points,
            TryOutScoringMode::RawScore => $questions->isEmpty() ? 0.0 : 100.0,
        };
        $score = round($score, 2);
        $percentage = $maxScore > 0
            ? max(0, min(100, round(($score / $maxScore) * 100, 2)))
            : 0.0;

        return [
            'answers' => $answers,
            'correct_count' => $correctCount,
            'partial_count' => $partialCount,
            'wrong_count' => $wrongCount,
            'unanswered_count' => $unansweredCount,
            'score' => $score,
            'max_score' => round($maxScore, 2),
            'percentage_score' => $percentage,
            'scoring_snapshot' => [
                'correct_points' => $tryOut->correct_points,
                'mode' => $mode->value,
                'unanswered_points' => $tryOut->unanswered_points,
                'wrong_points' => $tryOut->wrong_points,
            ],
            'question_snapshot' => $questionSnapshot,
            'score_breakdown' => $breakdown,
        ];
    }

    /** @return array<int, string> */
    public function correctAnswers(TryOutQuestion $question): array
    {
        $answers = $question->correct_answers;

        if (! is_array($answers) || $answers === []) {
            $answers = filled($question->answer) ? [$question->answer] : [];
        }

        if (($question->question_type ?? TryOutQuestionType::SingleChoice) === TryOutQuestionType::NumericAnswer) {
            $answer = $this->normalizeNumericAnswer($answers[0] ?? null);

            return $answer === null ? [] : [$answer];
        }

        return $this->normalizeAnswerSet($answers);
    }

    public function validateReadyForPublication(TryOut $tryOut): void
    {
        $tryOut->loadMissing('questions');
        $errors = [];

        if ($tryOut->questions->isEmpty()) {
            $errors['questions'] = 'Add at least one question before publishing.';
        }

        foreach ($tryOut->questions as $question) {
            $answers = $this->answerKey($question);

            if ($answers === []) {
                $errors['questions'] = "Question {$question->number} does not have an answer key.";
                break;
            }

            $type = $question->question_type ?? TryOutQuestionType::SingleChoice;

            if (in_array($type, [TryOutQuestionType::SingleChoice, TryOutQuestionType::NumericAnswer], true) && count($answers) !== 1) {
                $errors['questions'] = "Question {$question->number} must have one answer key.";
                break;
            }

            if ($type === TryOutQuestionType::MultipleAnswer && count($answers) < 2) {
                $errors['questions'] = "Question {$question->number} needs at least two answer keys.";
                break;
            }

            if (($tryOut->scoring_mode ?? TryOutScoringMode::RawScore) === TryOutScoringMode::RawScore && (float) $question->points <= 0) {
                $errors['points'] = "Question {$question->number} needs a positive score.";
                break;
            }
        }

        if ($tryOut->scoring_mode === TryOutScoringMode::NegativeMarking) {
            $correct = $tryOut->correct_points;
            $wrong = $tryOut->wrong_points;
            $unanswered = $tryOut->unanswered_points;

            if ($correct === null || $wrong === null || $unanswered === null || $correct <= 0 || $correct <= $wrong || $correct <= $unanswered) {
                $errors['correct_points'] = 'Correct points must be positive and greater than wrong and unanswered points.';
            }
        }

        if ($errors !== []) {
            throw ValidationException::withMessages($errors);
        }
    }

    /**
     * @param  Collection<int, TryOutQuestion>  $questions
     * @return array<int, float>
     */
    private function resolvedWeights(Collection $questions): array
    {
        $savedWeights = $questions->map(fn (TryOutQuestion $question): ?float => $question->points)->all();

        return array_map(fn (?float $weight): float => $weight ?? 1.0, $savedWeights);
    }

    /**
     * @param  Collection<int, TryOutQuestion>  $questions
     * @return array<int, float>
     */
    private function resolvedRawScoreWeights(Collection $questions): array
    {
        $weights = $this->resolvedWeights($questions);
        $total = array_sum($weights);

        if ($total <= 0) {
            return $questions->isEmpty()
                ? []
                : array_fill(0, $questions->count(), round(100 / $questions->count(), 4));
        }

        return array_map(fn (float $weight): float => ($weight / $total) * 100, $weights);
    }

    /** @param array<int, mixed> $answers */
    private function normalizeAnswerSet(array $answers): array
    {
        $normalized = array_values(array_unique(array_filter(
            array_map(fn (mixed $answer): string => strtoupper(trim((string) $answer)), $answers),
            fn (string $answer): bool => in_array($answer, self::OPTIONS, true),
        )));
        sort($normalized);

        return $normalized;
    }

    private function normalizeSubmittedAnswer(mixed $answer, TryOutQuestionType $type): string|array|null
    {
        if ($type === TryOutQuestionType::MultipleAnswer) {
            return is_array($answer) ? $this->normalizeAnswerSet($answer) : null;
        }

        if (! is_string($answer)) {
            return null;
        }

        if ($type === TryOutQuestionType::NumericAnswer) {
            return $this->normalizeNumericAnswer($answer);
        }

        $answer = strtoupper(trim($answer));

        return in_array($answer, self::OPTIONS, true) ? $answer : null;
    }

    /** @param array<int|string, string> $correctAnswers */
    private function answerCredit(TryOutQuestion $question, string|array $submittedAnswer, array $correctAnswers): float
    {
        $type = $question->question_type ?? TryOutQuestionType::SingleChoice;

        return match ($type) {
            TryOutQuestionType::MultipleAnswer => $this->multipleAnswerCredit($submittedAnswer, $correctAnswers),
            default => in_array((string) $submittedAnswer, $correctAnswers, true) ? 1.0 : 0.0,
        };
    }

    /** @param array<int, string> $correctAnswers */
    private function multipleAnswerCredit(string|array $submittedAnswer, array $correctAnswers): float
    {
        if ($correctAnswers === []) {
            return 0.0;
        }

        $submitted = $this->normalizeAnswerSet(
            is_array($submittedAnswer) ? $submittedAnswer : [$submittedAnswer],
        );
        $correctSelections = count(array_intersect($submitted, $correctAnswers));
        $incorrectSelections = count(array_diff($submitted, $correctAnswers));

        return max(0, min(1, ($correctSelections - $incorrectSelections) / count($correctAnswers)));
    }

    /** @return array<int|string, string> */
    private function answerKey(TryOutQuestion $question): array
    {
        return $this->correctAnswers($question);
    }

    public function normalizeNumericAnswer(mixed $answer): ?string
    {
        if (! is_string($answer) && ! is_int($answer) && ! is_float($answer)) {
            return null;
        }

        $answer = str_replace(',', '.', trim((string) $answer));

        if (preg_match('/^[+-]?\d+(?:\.\d+)?$/', $answer) !== 1) {
            return null;
        }

        $isNegative = str_starts_with($answer, '-');
        $unsigned = ltrim($answer, '+-');
        [$integer, $fraction] = array_pad(explode('.', $unsigned, 2), 2, '');
        $integer = ltrim($integer, '0') ?: '0';
        $fraction = rtrim($fraction, '0');
        $normalized = $integer.($fraction === '' ? '' : ".{$fraction}");

        return $isNegative && $normalized !== '0' ? "-{$normalized}" : $normalized;
    }

    /**
     * @param  array<int|string, string>  $correctAnswers
     * @return array<string, mixed>
     */
    private function questionSnapshot(TryOutQuestion $question, array $correctAnswers, ?float $points): array
    {
        return [
            'answer' => $correctAnswers[0] ?? null,
            'correctAnswers' => $correctAnswers,
            'id' => (string) $question->id,
            'number' => $question->number,
            'options' => $question->options,
            'optionsHtml' => $question->options_html ?? $question->options,
            'points' => $points,
            'questionHtml' => $question->question_html ?? e($question->question_text),
            'questionText' => $question->question_text,
            'questionType' => ($question->question_type ?? TryOutQuestionType::SingleChoice)->value,
            'subjectName' => $question->subject_name,
        ];
    }
}
