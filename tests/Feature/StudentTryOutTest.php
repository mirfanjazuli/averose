<?php

namespace Tests\Feature;

use App\Models\TryOut;
use App\Models\TryOutAttempt;
use App\Models\TryOutQuestion;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class StudentTryOutTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_to_the_login_page(): void
    {
        $response = $this->get(route('try-outs'));

        $response->assertRedirect(route('login'));
    }

    public function test_students_can_visit_the_try_out_page(): void
    {
        $user = User::factory()->student()->create();
        $publishedTryOut = TryOut::factory()
            ->hasQuestions(3)
            ->create([
                'duration_minutes' => 90,
                'status' => 'published',
                'title' => 'Published Try Out',
            ]);
        TryOut::factory()
            ->hasQuestions(2)
            ->create(['status' => 'draft', 'title' => 'Draft Try Out']);

        $response = $this->actingAs($user)->get(route('try-outs'));

        $response
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('student/try-outs')
                ->where('summary.bestScore', null)
                ->where('summary.completed', 0)
                ->where('tryOuts.0.durationMinutes', 90)
                ->where('tryOuts.0.id', (string) $publishedTryOut->id)
                ->where('tryOuts.0.questions', 3)
                ->where('tryOuts.0.title', 'Published Try Out')
                ->missing('tryOuts.1')
            );
    }

    public function test_admins_cannot_visit_the_student_try_out_page(): void
    {
        $user = User::factory()->admin()->create();

        $this->actingAs($user)
            ->get(route('try-outs'))
            ->assertForbidden();
    }

    public function test_students_can_open_published_try_out_simulation(): void
    {
        $user = User::factory()->student()->create();
        $tryOut = TryOut::factory()->create([
            'duration_minutes' => 120,
            'status' => 'published',
            'title' => 'SMUA UNAIR Saintek',
        ]);
        TryOutQuestion::factory()->create([
            'answer' => 'C',
            'number' => 1,
            'options' => [
                'A' => '1',
                'B' => '2',
                'C' => '3',
                'D' => '4',
                'E' => '5',
            ],
            'options_html' => [
                'A' => '1',
                'B' => '2',
                'C' => '<math class="math-equation" xmlns="http://www.w3.org/1998/Math/MathML"><mrow><mfrac><mrow><mn>3</mn></mrow><mrow><mn>1</mn></mrow></mfrac></mrow></math>',
                'D' => '4',
                'E' => '5',
            ],
            'question_html' => 'Nilai dari <math class="math-equation" xmlns="http://www.w3.org/1998/Math/MathML"><mrow><msup><mrow><mi>x</mi></mrow><mrow><mn>2</mn></mrow></msup></mrow></math> adalah …',
            'question_text' => 'Nilai dari x adalah …',
            'subject_name' => 'Matematika IPA',
            'try_out_id' => $tryOut->id,
        ]);

        $response = $this->actingAs($user)->get(route('try-outs.show', $tryOut));

        $response
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('student/try-out-session')
                ->where('tryOut.title', 'SMUA UNAIR Saintek')
                ->where('tryOut.durationMinutes', 120)
                ->where('tryOut.questions.0.questionText', 'Nilai dari x adalah …')
                ->where('tryOut.questions.0.questionHtml', 'Nilai dari <math class="math-equation" xmlns="http://www.w3.org/1998/Math/MathML"><mrow><msup><mrow><mi>x</mi></mrow><mrow><mn>2</mn></mrow></msup></mrow></math> adalah …')
                ->where('tryOut.questions.0.options.C', '3')
                ->where('tryOut.questions.0.optionsHtml.C', '<math class="math-equation" xmlns="http://www.w3.org/1998/Math/MathML"><mrow><mfrac><mrow><mn>3</mn></mrow><mrow><mn>1</mn></mrow></mfrac></mrow></math>')
            );
    }

    public function test_students_can_submit_try_out_answers_and_receive_score(): void
    {
        $user = User::factory()->student()->create();
        $tryOut = TryOut::factory()->create(['status' => 'published']);
        $firstQuestion = TryOutQuestion::factory()->create([
            'answer' => 'C',
            'number' => 1,
            'try_out_id' => $tryOut->id,
        ]);
        $secondQuestion = TryOutQuestion::factory()->create([
            'answer' => 'A',
            'number' => 2,
            'try_out_id' => $tryOut->id,
        ]);

        $response = $this
            ->actingAs($user)
            ->post(route('try-outs.submit', $tryOut), [
                'answers' => [
                    $firstQuestion->id => 'C',
                    $secondQuestion->id => null,
                ],
            ]);

        $response
            ->assertRedirect(route('try-outs.results.show', [$tryOut, $tryOut->attempts()->first()]))
            ->assertSessionHas('success', 'Try out submitted.');

        $this->assertDatabaseHas('try_out_attempts', [
            'correct_count' => 1,
            'question_count' => 2,
            'score' => 50,
            'try_out_id' => $tryOut->id,
            'user_id' => $user->id,
        ]);

        $attempt = $tryOut->attempts()->firstOrFail();

        $this->assertSame([
            (string) $firstQuestion->id => 'C',
            (string) $secondQuestion->id => null,
        ], $attempt->answers);
    }

    public function test_students_can_view_try_out_results_page(): void
    {
        $user = User::factory()->student()->create();
        $tryOut = TryOut::factory()->create([
            'status' => 'published',
            'title' => 'SMUA UNAIR Saintek',
        ]);
        $attempt = TryOutAttempt::factory()->create([
            'correct_count' => 8,
            'question_count' => 10,
            'score' => 80,
            'try_out_id' => $tryOut->id,
            'user_id' => $user->id,
        ]);

        $response = $this->actingAs($user)->get(route('try-outs.results'));

        $response
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('student/try-out-results')
                ->where('attempts.0.id', (string) $attempt->id)
                ->where('attempts.0.score', 80)
                ->where('attempts.0.tryOut.title', 'SMUA UNAIR Saintek')
            );
    }

    public function test_students_can_view_try_out_result_detail(): void
    {
        $user = User::factory()->student()->create();
        $tryOut = TryOut::factory()->create([
            'status' => 'published',
            'title' => 'SMUA UNAIR Saintek',
        ]);
        $question = TryOutQuestion::factory()->create([
            'answer' => 'C',
            'number' => 1,
            'try_out_id' => $tryOut->id,
        ]);
        $attempt = TryOutAttempt::factory()->create([
            'answers' => [
                $question->id => 'C',
            ],
            'correct_count' => 1,
            'question_count' => 1,
            'score' => 100,
            'try_out_id' => $tryOut->id,
            'user_id' => $user->id,
        ]);

        $response = $this
            ->actingAs($user)
            ->get(route('try-outs.results.show', [$tryOut, $attempt]));

        $response
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('student/try-out-result-detail')
                ->where('attempt.score', 100)
                ->where("attempt.answers.{$question->id}", 'C')
                ->where('tryOut.questions.0.answer', 'C')
                ->where('tryOut.title', 'SMUA UNAIR Saintek')
            );
    }

    public function test_students_cannot_view_other_students_try_out_result_detail(): void
    {
        $user = User::factory()->student()->create();
        $otherUser = User::factory()->student()->create();
        $tryOut = TryOut::factory()->create(['status' => 'published']);
        $attempt = TryOutAttempt::factory()->create([
            'try_out_id' => $tryOut->id,
            'user_id' => $otherUser->id,
        ]);

        $this
            ->actingAs($user)
            ->get(route('try-outs.results.show', [$tryOut, $attempt]))
            ->assertForbidden();
    }

    public function test_students_cannot_open_draft_try_out_simulation(): void
    {
        $user = User::factory()->student()->create();
        $tryOut = TryOut::factory()->create(['status' => 'draft']);

        $this
            ->actingAs($user)
            ->get(route('try-outs.show', $tryOut))
            ->assertNotFound();
    }

    public function test_mentors_cannot_visit_the_try_out_page(): void
    {
        $user = User::factory()->mentor()->create();

        $this->actingAs($user)
            ->get(route('try-outs'))
            ->assertForbidden();
    }
}
