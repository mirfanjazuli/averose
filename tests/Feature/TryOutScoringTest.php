<?php

namespace Tests\Feature;

use App\Models\TryOut;
use App\Models\TryOutAccess;
use App\Models\TryOutAttempt;
use App\Models\TryOutQuestion;
use App\Models\User;
use App\Services\TryOutScoringService;
use App\TryOutQuestionType;
use App\TryOutScoringMode;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class TryOutScoringTest extends TestCase
{
    use RefreshDatabase;

    public function test_raw_score_uses_question_scores(): void
    {
        $tryOut = TryOut::factory()->create(['scoring_mode' => TryOutScoringMode::RawScore]);
        $first = $this->question($tryOut, 1, ['A'], 30);
        $second = $this->question($tryOut, 2, ['B'], 70);

        $result = app(TryOutScoringService::class)->score(
            $tryOut,
            $tryOut->questions()->get(),
            [$first->id => 'A', $second->id => 'A'],
        );

        $this->assertSame(30.0, $result['score']);
        $this->assertSame(100.0, $result['max_score']);
        $this->assertSame(30.0, $result['percentage_score']);
        $this->assertSame(1, $result['correct_count']);
        $this->assertSame(1, $result['wrong_count']);
    }

    public function test_raw_score_normalizes_question_weights_to_one_hundred(): void
    {
        $tryOut = TryOut::factory()->create(['scoring_mode' => TryOutScoringMode::RawScore]);
        $first = $this->question($tryOut, 1, ['A'], 1);
        $second = $this->question($tryOut, 2, ['B'], 1);
        $third = $this->question($tryOut, 3, ['C'], 2);

        $result = app(TryOutScoringService::class)->score(
            $tryOut,
            $tryOut->questions()->get(),
            [$first->id => 'A', $second->id => 'B', $third->id => 'A'],
        );

        $this->assertSame(50.0, $result['score']);
        $this->assertSame(100.0, $result['max_score']);
        $this->assertSame(25.0, $result['score_breakdown'][(string) $first->id]['points']);
        $this->assertSame(25.0, $result['score_breakdown'][(string) $second->id]['points']);
        $this->assertSame(0.0, $result['score_breakdown'][(string) $third->id]['points']);
    }

    public function test_multiple_answer_awards_partial_credit_and_penalizes_extra_selections(): void
    {
        $tryOut = TryOut::factory()->create(['scoring_mode' => TryOutScoringMode::RawScore]);
        $exact = $this->question($tryOut, 1, ['A', 'C']);
        $partial = $this->question($tryOut, 2, ['B', 'D']);
        $extra = $this->question($tryOut, 3, ['A', 'E']);

        $result = app(TryOutScoringService::class)->score(
            $tryOut,
            $tryOut->questions()->get(),
            [
                $exact->id => ['C', 'A'],
                $partial->id => ['B'],
                $extra->id => ['A', 'C', 'E'],
            ],
        );

        $this->assertSame(1, $result['correct_count']);
        $this->assertSame(2, $result['partial_count']);
        $this->assertSame(0, $result['wrong_count']);
        $this->assertSame(66.67, $result['score']);
        $this->assertSame(66.67, $result['percentage_score']);
        $this->assertSame(0.5, $result['score_breakdown'][(string) $partial->id]['credit']);
        $this->assertSame(0.5, $result['score_breakdown'][(string) $extra->id]['credit']);

        $selectAllResult = app(TryOutScoringService::class)->score(
            $tryOut,
            collect([$exact]),
            [$exact->id => ['A', 'B', 'C', 'D', 'E']],
        );

        $this->assertSame(0.0, $selectAllResult['score']);
        $this->assertSame(1, $selectAllResult['wrong_count']);
    }

    public function test_question_type_controls_single_and_multiple_answer_inputs(): void
    {
        $student = User::factory()->student()->create();
        $tryOut = TryOut::factory()->create([
            'scoring_mode' => TryOutScoringMode::RawScore,
            'status' => 'public',
        ]);
        $single = $this->question($tryOut, 1, ['A']);
        $multiple = $this->question($tryOut, 2, ['B', 'D']);

        $this->actingAs($student)
            ->get(route('try-outs.show', $tryOut))
            ->assertInertia(fn (Assert $page) => $page
                ->where('tryOut.questions.0.questionType', 'single_choice')
                ->where('tryOut.questions.1.questionType', 'multiple_answer')
                ->missing('tryOut.questions.0.correctAnswers')
            );

        $this->actingAs($student)
            ->post(route('try-outs.submit', $tryOut), [
                'answers' => [
                    (string) $single->id => 'A',
                    (string) $multiple->id => ['D', 'B'],
                ],
            ])
            ->assertSessionHasNoErrors();

        $attempt = TryOutAttempt::query()->sole();

        $this->assertSame(100.0, $attempt->score);
        $this->assertSame('A', $attempt->answers[(string) $single->id]);
        $this->assertSame(['B', 'D'], $attempt->answers[(string) $multiple->id]);
    }

    public function test_multiple_answer_partial_credit_is_saved_when_submitted_by_student(): void
    {
        $student = User::factory()->student()->create();
        $tryOut = TryOut::factory()->create([
            'scoring_mode' => TryOutScoringMode::RawScore,
            'status' => 'public',
        ]);
        $oneOfThree = $this->question($tryOut, 1, ['A', 'C', 'E'], 3);
        $twoOfThree = $this->question($tryOut, 2, ['A', 'B', 'D'], 3);

        $this->actingAs($student)
            ->post(route('try-outs.submit', $tryOut), [
                'answers' => [
                    (string) $oneOfThree->id => ['A'],
                    (string) $twoOfThree->id => ['A', 'D'],
                ],
            ])
            ->assertSessionHasNoErrors();

        $attempt = TryOutAttempt::query()->sole();

        $this->assertSame(50.0, $attempt->score);
        $this->assertSame(2, $attempt->partial_count);
        $this->assertSame(16.67, (float) $attempt->score_breakdown[(string) $oneOfThree->id]['points']);
        $this->assertSame(33.33, (float) $attempt->score_breakdown[(string) $twoOfThree->id]['points']);
        $this->assertSame(0.3333, $attempt->score_breakdown[(string) $oneOfThree->id]['credit']);
        $this->assertSame(0.6667, $attempt->score_breakdown[(string) $twoOfThree->id]['credit']);
    }

    public function test_negative_marking_supports_wrong_and_unanswered_points(): void
    {
        $tryOut = TryOut::factory()->create([
            'correct_points' => 4,
            'scoring_mode' => TryOutScoringMode::NegativeMarking,
            'unanswered_points' => 0,
            'wrong_points' => -1,
        ]);
        $correct = $this->question($tryOut, 1, ['A']);
        $wrong = $this->question($tryOut, 2, ['B']);
        $unanswered = $this->question($tryOut, 3, ['C']);

        $result = app(TryOutScoringService::class)->score(
            $tryOut,
            $tryOut->questions()->get(),
            [$correct->id => 'A', $wrong->id => 'A', $unanswered->id => null],
        );

        $this->assertSame(3.0, $result['score']);
        $this->assertSame(12.0, $result['max_score']);
        $this->assertSame(25.0, $result['percentage_score']);
        $this->assertSame(1, $result['unanswered_count']);
    }

    public function test_private_submission_consumes_quota_and_preserves_snapshot(): void
    {
        $student = User::factory()->student()->create();
        $tryOut = TryOut::factory()->create([
            'scoring_mode' => TryOutScoringMode::RawScore,
            'status' => 'private',
        ]);
        $question = $this->question($tryOut, 1, ['A'], 100);
        $access = TryOutAccess::factory()->create([
            'attempt_quota' => 1,
            'try_out_id' => $tryOut->id,
            'user_id' => $student->id,
        ]);

        $response = $this->actingAs($student)->post(route('try-outs.submit', $tryOut), [
            'answers' => [(string) $question->id => 'A'],
        ]);

        $attempt = TryOutAttempt::query()->sole();
        $response->assertRedirect(route('try-outs.results.show', [$tryOut, $attempt]));
        $this->assertSame(1, $access->refresh()->attempts_used);
        $this->assertSame(['A'], $attempt->question_snapshot[0]['correctAnswers']);

        $question->update(['answer' => 'B', 'correct_answers' => ['B']]);

        $this->actingAs($student)
            ->get(route('try-outs.results.show', [$tryOut, $attempt]))
            ->assertInertia(fn (Assert $page) => $page
                ->where('tryOut.questions.0.correctAnswers', ['A'])
                ->where('attempt.scoreBreakdown.'.$question->id.'.points', 100)
            );

        $this->actingAs($student)
            ->post(route('try-outs.submit', $tryOut), ['answers' => [(string) $question->id => 'B']])
            ->assertNotFound();
    }

    public function test_submit_rejects_foreign_question_ids_and_wrong_answer_shape(): void
    {
        $student = User::factory()->student()->create();
        $tryOut = TryOut::factory()->create([
            'scoring_mode' => TryOutScoringMode::RawScore,
            'status' => 'public',
        ]);
        $question = $this->question($tryOut, 1, ['A', 'C']);

        $this->actingAs($student)
            ->post(route('try-outs.submit', $tryOut), [
                'answers' => [(string) $question->id => 'A', '999999' => ['A']],
            ])
            ->assertSessionHasErrors([
                'answers.'.$question->id,
                'answers.999999',
            ]);
    }

    public function test_submit_rejects_non_numeric_answer_for_numeric_question(): void
    {
        $student = User::factory()->student()->create();
        $tryOut = TryOut::factory()->create([
            'scoring_mode' => TryOutScoringMode::RawScore,
            'status' => 'public',
        ]);
        $numeric = TryOutQuestion::factory()->create([
            'answer' => '12.5',
            'correct_answers' => ['12.5'],
            'question_type' => TryOutQuestionType::NumericAnswer,
            'try_out_id' => $tryOut->id,
        ]);

        $this->actingAs($student)
            ->post(route('try-outs.submit', $tryOut), [
                'answers' => [(string) $numeric->id => 'twelve'],
            ])
            ->assertSessionHasErrors('answers.'.$numeric->id);
    }

    public function test_publish_rejects_raw_score_without_positive_question_score(): void
    {
        $admin = User::factory()->admin()->create();
        $tryOut = TryOut::factory()->create(['scoring_mode' => TryOutScoringMode::RawScore]);
        $this->question($tryOut, 1, ['A'], 0);

        $this->actingAs($admin)
            ->put(route('admin.try-outs.publish', $tryOut))
            ->assertSessionHasErrors('points');

        $this->assertSame('draft', $tryOut->refresh()->status);
    }

    public function test_negative_marking_requires_correct_points_to_be_greatest(): void
    {
        $admin = User::factory()->admin()->create();
        $tryOut = TryOut::factory()->create();

        $this->actingAs($admin)
            ->put(route('admin.try-outs.update', $tryOut), [
                'scoring_mode' => TryOutScoringMode::NegativeMarking->value,
                'status' => 'draft',
                'title' => $tryOut->title,
                'correct_points' => 1,
                'wrong_points' => 2,
                'unanswered_points' => 0,
            ])
            ->assertSessionHasErrors('wrong_points');
    }

    public function test_numeric_answers_are_compared_using_canonical_values(): void
    {
        $tryOut = TryOut::factory()->create(['scoring_mode' => TryOutScoringMode::RawScore]);
        $decimal = TryOutQuestion::factory()->create([
            'answer' => '12.5',
            'correct_answers' => ['12.5'],
            'number' => 1,
            'options' => [],
            'points' => 2,
            'question_type' => TryOutQuestionType::NumericAnswer,
            'try_out_id' => $tryOut->id,
        ]);
        $negative = TryOutQuestion::factory()->create([
            'answer' => '-3',
            'correct_answers' => ['-3'],
            'number' => 2,
            'options' => [],
            'points' => 1,
            'question_type' => TryOutQuestionType::NumericAnswer,
            'try_out_id' => $tryOut->id,
        ]);

        $result = app(TryOutScoringService::class)->score($tryOut, $tryOut->questions()->get(), [
            $decimal->id => '0012,500',
            $negative->id => '-3.0',
        ]);

        $this->assertSame(100.0, $result['score']);
        $this->assertSame(2, $result['correct_count']);
        $this->assertSame('12.5', $result['answers'][(string) $decimal->id]);
        $this->assertSame('-3', $result['answers'][(string) $negative->id]);
    }

    /** @param array<int, string> $correctAnswers */
    private function question(
        TryOut $tryOut,
        int $number,
        array $correctAnswers,
        ?float $points = null,
    ): TryOutQuestion {
        return TryOutQuestion::factory()->create([
            'answer' => $correctAnswers[0],
            'correct_answers' => $correctAnswers,
            'number' => $number,
            'points' => $points,
            'question_type' => count($correctAnswers) > 1
                ? TryOutQuestionType::MultipleAnswer
                : TryOutQuestionType::SingleChoice,
            'try_out_id' => $tryOut->id,
        ]);
    }
}
