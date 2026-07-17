<?php

namespace Tests\Feature;

use App\Models\TryOut;
use App\Models\TryOutAccess;
use App\Models\TryOutAsset;
use App\Models\TryOutAttempt;
use App\Models\TryOutGroup;
use App\Models\TryOutQuestion;
use App\Models\User;
use App\Services\TryOutAssetStorage;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Mockery\MockInterface;
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
        $publicTryOut = TryOut::factory()
            ->hasQuestions(3)
            ->create([
                'duration_minutes' => 90,
                'status' => 'public',
                'title' => 'Public Try Out',
            ]);
        TryOut::factory()
            ->hasQuestions(2)
            ->create(['status' => 'draft', 'title' => 'Draft Try Out']);

        $response = $this->actingAs($user)->get(route('try-outs'));

        $response
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('student/try-outs/index')
                ->where('summary.bestScore', null)
                ->where('summary.completed', 0)
                ->where('tryOuts.0.durationMinutes', 90)
                ->where('tryOuts.0.id', (string) $publicTryOut->id)
                ->where('tryOuts.0.questions', 3)
                ->where('tryOuts.0.title', 'Public Try Out')
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

    public function test_students_can_open_public_try_out_simulation(): void
    {
        $user = User::factory()->student()->create();
        $tryOut = TryOut::factory()->create([
            'duration_minutes' => 120,
            'status' => 'public',
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
                ->component('student/try-outs/session')
                ->where('tryOut.title', 'SMUA UNAIR Saintek')
                ->where('tryOut.durationMinutes', 120)
                ->where('tryOut.questions.0.questionText', 'Nilai dari x adalah …')
                ->where('tryOut.questions.0.questionHtml', 'Nilai dari <math class="math-equation" xmlns="http://www.w3.org/1998/Math/MathML"><mrow><msup><mrow><mi>x</mi></mrow><mrow><mn>2</mn></mrow></msup></mrow></math> adalah …')
                ->where('tryOut.questions.0.options.C', '3')
                ->where('tryOut.questions.0.optionsHtml.C', '<math class="math-equation" xmlns="http://www.w3.org/1998/Math/MathML"><mrow><mfrac><mrow><mn>3</mn></mrow><mrow><mn>1</mn></mrow></mfrac></mrow></math>')
            );
    }

    public function test_students_can_view_images_from_public_try_outs(): void
    {
        $user = User::factory()->student()->create();
        $tryOut = TryOut::factory()->create(['status' => 'public']);
        $asset = TryOutAsset::factory()->create(['try_out_id' => $tryOut->id]);
        $this->mock(
            TryOutAssetStorage::class,
            fn (MockInterface $mock) => $mock
                ->shouldReceive('temporaryUrl')
                ->once()
                ->withArgs(fn (TryOutAsset $value): bool => $value->is($asset))
                ->andReturn('https://r2.example.test/signed-image'),
        );

        $this
            ->actingAs($user)
            ->get(route('try-out-assets.show', $asset->uuid))
            ->assertRedirect('https://r2.example.test/signed-image');
    }

    public function test_students_cannot_view_private_try_out_images_without_access(): void
    {
        $user = User::factory()->student()->create();
        $tryOut = TryOut::factory()->create(['status' => 'private']);
        $asset = TryOutAsset::factory()->create(['try_out_id' => $tryOut->id]);

        $this
            ->actingAs($user)
            ->get(route('try-out-assets.show', $asset->uuid))
            ->assertNotFound();
    }

    public function test_students_can_view_private_try_out_images_with_active_access(): void
    {
        $user = User::factory()->student()->create();
        $tryOut = TryOut::factory()->create(['status' => 'private']);
        $asset = TryOutAsset::factory()->create(['try_out_id' => $tryOut->id]);
        TryOutAccess::factory()->create([
            'try_out_id' => $tryOut->id,
            'user_id' => $user->id,
        ]);
        $this->mock(
            TryOutAssetStorage::class,
            fn (MockInterface $mock) => $mock
                ->shouldReceive('temporaryUrl')
                ->once()
                ->andReturn('https://r2.example.test/private-image'),
        );

        $this
            ->actingAs($user)
            ->get(route('try-out-assets.show', $asset->uuid))
            ->assertRedirect('https://r2.example.test/private-image');
    }

    public function test_students_can_submit_try_out_answers_and_receive_score(): void
    {
        $user = User::factory()->student()->create();
        $tryOut = TryOut::factory()->create(['status' => 'public']);
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

        $this->assertSame(100.0, $attempt->max_score);
        $this->assertSame(50.0, $attempt->percentage_score);

        $this->assertSame([
            (string) $firstQuestion->id => 'C',
            (string) $secondQuestion->id => null,
        ], $attempt->answers);
    }

    public function test_students_can_view_try_out_results_page(): void
    {
        $user = User::factory()->student()->create();
        $tryOut = TryOut::factory()->create([
            'status' => 'public',
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
                ->component('student/try-outs/results/index')
                ->where('attempts.0.id', (string) $attempt->id)
                ->where('attempts.0.score', 80)
                ->where('attempts.0.tryOut.title', 'SMUA UNAIR Saintek')
            );
    }

    public function test_students_can_view_try_out_result_detail(): void
    {
        $user = User::factory()->student()->create();
        $tryOut = TryOut::factory()->create([
            'status' => 'public',
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
                ->component('student/try-outs/results/show')
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
        $tryOut = TryOut::factory()->create(['status' => 'public']);
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

    public function test_private_try_out_without_access_is_hidden_and_denied(): void
    {
        $user = User::factory()->student()->create();
        $tryOut = TryOut::factory()
            ->hasQuestions(1)
            ->create(['status' => 'private', 'title' => 'Private Try Out']);

        $this->actingAs($user)
            ->get(route('try-outs'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->missing('tryOuts.0')
            );

        $this->actingAs($user)
            ->get(route('try-outs.show', $tryOut))
            ->assertNotFound();
    }

    public function test_student_can_redeem_private_try_out_group_token(): void
    {
        $user = User::factory()->student()->create();
        $tryOut = TryOut::factory()
            ->hasQuestions(1)
            ->create(['status' => 'private']);
        $group = TryOutGroup::factory()->create([
            'attempt_quota' => 2,
            'try_out_id' => $tryOut->id,
        ]);

        $this
            ->actingAs($user)
            ->post(route('try-outs.redeem'), [
                'token' => strtolower($group->token),
            ])
            ->assertRedirect()
            ->assertSessionHas('success', 'Token try out berhasil digunakan.');

        $access = TryOutAccess::query()->sole();

        $this->assertSame($group->id, $access->try_out_group_id);
        $this->assertSame($tryOut->id, $access->try_out_id);
        $this->assertSame($user->id, $access->user_id);
        $this->assertSame(2, $access->attempt_quota);

        $this
            ->actingAs($user)
            ->get(route('try-outs'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('tryOuts.0.id', (string) $tryOut->id)
                ->where('tryOuts.0.remainingAttempts', 2)
            );

        $question = $tryOut->questions()->firstOrFail();

        $this
            ->actingAs($user)
            ->post(route('try-outs.submit', $tryOut), [
                'answers' => [
                    $question->id => $question->answer,
                ],
            ])
            ->assertRedirect();

        $this->assertSame(1, $access->refresh()->attempts_used);
    }

    public function test_redeeming_same_group_token_twice_is_idempotent(): void
    {
        $user = User::factory()->student()->create();
        $group = TryOutGroup::factory()->create();

        $this
            ->actingAs($user)
            ->post(route('try-outs.redeem'), ['token' => $group->token])
            ->assertRedirect()
            ->assertSessionHas('success', 'Token try out berhasil digunakan.');

        $this
            ->actingAs($user)
            ->post(route('try-outs.redeem'), ['token' => $group->token])
            ->assertRedirect()
            ->assertSessionHas('success', 'Token try out sudah pernah digunakan.');

        $this->assertDatabaseCount('try_out_accesses', 1);
    }

    public function test_redeeming_same_group_token_with_inactive_access_returns_clear_error(): void
    {
        $user = User::factory()->student()->create();
        $group = TryOutGroup::factory()->create(['attempt_quota' => 1]);

        TryOutAccess::factory()->create([
            'attempt_quota' => 1,
            'attempts_used' => 1,
            'try_out_group_id' => $group->id,
            'try_out_id' => $group->try_out_id,
            'user_id' => $user->id,
        ]);

        $this
            ->actingAs($user)
            ->post(route('try-outs.redeem'), ['token' => $group->token])
            ->assertRedirect()
            ->assertSessionHasErrors([
                'token' => 'Akses dari token ini sudah tidak aktif atau attempt sudah habis.',
            ]);

        $this->assertDatabaseCount('try_out_accesses', 1);
    }

    public function test_student_cannot_redeem_invalid_inactive_expired_or_full_group_token(): void
    {
        $user = User::factory()->student()->create();
        $inactive = TryOutGroup::factory()->create(['status' => 'inactive']);
        $expired = TryOutGroup::factory()->create([
            'available_from' => now()->subMonth()->toDateString(),
            'available_until' => now()->subDay()->toDateString(),
        ]);
        $full = TryOutGroup::factory()->create(['max_participants' => 1]);
        TryOutAccess::factory()->create([
            'try_out_group_id' => $full->id,
            'try_out_id' => $full->try_out_id,
        ]);

        foreach (['MISSINGTOKEN', $inactive->token, $expired->token, $full->token] as $token) {
            $this
                ->actingAs($user)
                ->post(route('try-outs.redeem'), ['token' => $token])
                ->assertSessionHasErrors('token');
        }

        $this->assertDatabaseCount('try_out_accesses', 1);
    }

    public function test_private_try_out_with_active_access_can_be_opened_and_submitted(): void
    {
        $user = User::factory()->student()->create();
        $tryOut = TryOut::factory()->create(['status' => 'private']);
        $question = TryOutQuestion::factory()->create([
            'answer' => 'C',
            'try_out_id' => $tryOut->id,
        ]);
        $access = TryOutAccess::factory()->create([
            'attempt_quota' => 2,
            'attempts_used' => 0,
            'try_out_id' => $tryOut->id,
            'user_id' => $user->id,
        ]);

        $this->actingAs($user)
            ->get(route('try-outs'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('tryOuts.0.id', (string) $tryOut->id)
                ->where('tryOuts.0.remainingAttempts', 2)
                ->where('tryOuts.0.status', 'Private')
            );

        $this->actingAs($user)
            ->get(route('try-outs.show', $tryOut))
            ->assertOk();

        $this->actingAs($user)
            ->post(route('try-outs.submit', $tryOut), [
                'answers' => [
                    $question->id => 'C',
                ],
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('try_out_accesses', [
            'attempts_used' => 1,
            'id' => $access->id,
        ]);
        $this->assertDatabaseHas('try_out_attempts', [
            'try_out_id' => $tryOut->id,
            'try_out_access_id' => $access->id,
            'user_id' => $user->id,
        ]);
    }

    public function test_private_try_out_with_exhausted_access_cannot_be_submitted(): void
    {
        $user = User::factory()->student()->create();
        $tryOut = TryOut::factory()->create(['status' => 'private']);
        $question = TryOutQuestion::factory()->create(['try_out_id' => $tryOut->id]);
        TryOutAccess::factory()->create([
            'attempt_quota' => 1,
            'attempts_used' => 1,
            'try_out_id' => $tryOut->id,
            'user_id' => $user->id,
        ]);

        $this->actingAs($user)
            ->post(route('try-outs.submit', $tryOut), [
                'answers' => [
                    $question->id => 'A',
                ],
            ])
            ->assertNotFound();
    }

    public function test_student_with_two_private_accesses_can_submit_again_using_next_available_access(): void
    {
        $user = User::factory()->student()->create();
        $tryOut = TryOut::factory()->create(['status' => 'private']);
        $question = TryOutQuestion::factory()->create([
            'answer' => 'A',
            'try_out_id' => $tryOut->id,
        ]);
        $firstAccess = TryOutAccess::factory()->create([
            'attempt_quota' => 1,
            'attempts_used' => 0,
            'available_until' => now()->addWeek()->toDateString(),
            'try_out_id' => $tryOut->id,
            'user_id' => $user->id,
        ]);
        $secondAccess = TryOutAccess::factory()->create([
            'attempt_quota' => 1,
            'attempts_used' => 0,
            'available_until' => now()->addMonth()->toDateString(),
            'try_out_id' => $tryOut->id,
            'user_id' => $user->id,
        ]);

        foreach (range(1, 2) as $attemptNumber) {
            $this->actingAs($user)
                ->post(route('try-outs.submit', $tryOut), [
                    'answers' => [
                        $question->id => 'A',
                    ],
                ])
                ->assertRedirect();
        }

        $this->assertSame(1, $firstAccess->refresh()->attempts_used);
        $this->assertSame(1, $secondAccess->refresh()->attempts_used);
    }

    public function test_expired_private_access_is_ignored(): void
    {
        $user = User::factory()->student()->create();
        $tryOut = TryOut::factory()->create(['status' => 'private']);

        TryOutAccess::factory()->create([
            'available_from' => now()->subMonth()->toDateString(),
            'available_until' => now()->subDay()->toDateString(),
            'try_out_id' => $tryOut->id,
            'user_id' => $user->id,
        ]);

        $this->actingAs($user)
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
