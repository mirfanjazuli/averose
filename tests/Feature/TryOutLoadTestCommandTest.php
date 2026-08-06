<?php

namespace Tests\Feature;

use App\Models\TryOut;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

class TryOutLoadTestCommandTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_prepares_an_idempotent_private_try_out_dataset(): void
    {
        Storage::fake('local');

        $arguments = [
            '--password' => 'load-test-secret',
            '--questions' => 6,
            '--users' => 3,
        ];

        $this->artisan('load-test:try-out:prepare', $arguments)->assertSuccessful();
        $this->artisan('load-test:try-out:prepare', $arguments)->assertSuccessful();

        $tryOut = TryOut::query()->where('source_file_name', 'load-test:try-outs')->firstOrFail();

        $this->assertSame('private', $tryOut->status);
        $this->assertSame(6, $tryOut->questions()->count());
        $this->assertSame(3, User::query()->where('email', 'like', 'loadtest.tryout.%@example.test')->count());
        $this->assertSame(3, $tryOut->accesses()->count());
        $this->assertSame(3, $tryOut->accesses()->where('attempts_used', 0)->count());
        $this->assertDatabaseCount('student_profiles', 3);
        $this->assertDatabaseHas('questions', [
            'number' => 5,
            'question_type' => 'multiple_answer',
            'try_out_id' => $tryOut->id,
        ]);
        Storage::disk('local')->assertExists('load-tests/try-out-users.csv');

        $credentials = Storage::disk('local')->get('load-tests/try-out-users.csv');
        $this->assertStringContainsString('index,email,password', $credentials);
        $this->assertStringContainsString('loadtest.tryout.0001@example.test,load-test-secret', $credentials);
    }

    public function test_it_cleans_up_only_the_load_test_dataset(): void
    {
        Storage::fake('local');
        $regularUser = User::factory()->student()->create();

        $this->artisan('load-test:try-out:prepare', [
            '--password' => 'load-test-secret',
            '--questions' => 3,
            '--users' => 2,
        ])->assertSuccessful();

        $this->artisan('load-test:try-out:cleanup')->assertSuccessful();

        $this->assertDatabaseMissing('try_outs', ['source_file_name' => 'load-test:try-outs']);
        $this->assertSame(0, User::query()->where('email', 'like', 'loadtest.tryout.%@example.test')->count());
        $this->assertDatabaseHas('users', ['id' => $regularUser->id]);
        Storage::disk('local')->assertMissing('load-tests/try-out-users.csv');
    }

    public function test_the_generated_student_can_open_and_submit_the_try_out(): void
    {
        Storage::fake('local');

        $this->artisan('load-test:try-out:prepare', [
            '--password' => 'load-test-secret',
            '--questions' => 10,
            '--users' => 1,
        ])->assertSuccessful();

        $student = User::query()->where('email', 'loadtest.tryout.0001@example.test')->firstOrFail();
        $tryOut = TryOut::query()->where('source_file_name', 'load-test:try-outs')->firstOrFail();
        $answers = $tryOut->questions()->get()->mapWithKeys(fn ($question): array => [
            (string) $question->id => match ($question->question_type->value) {
                'multiple_answer' => ['A', 'C'],
                'numeric_answer' => '42',
                default => 'A',
            },
        ])->all();

        $this->actingAs($student)
            ->get(route('try-outs.show', $tryOut))
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('student/try-outs/session')
                ->has('tryOut.questions', 10));

        $response = $this->actingAs($student)->post(route('try-outs.submit', $tryOut), [
            'answers' => $answers,
        ]);

        $attempt = $tryOut->attempts()->whereBelongsTo($student)->firstOrFail();

        $response->assertRedirect(route('try-outs.results.show', [$tryOut, $attempt]));
        $this->assertCount(10, $attempt->question_snapshot);
        $this->assertCount(10, $attempt->score_breakdown);
        $this->assertSame(1, $tryOut->accesses()->whereBelongsTo($student)->value('attempts_used'));
        $this->actingAs($student)
            ->post(route('try-outs.submit', $tryOut), ['answers' => $answers])
            ->assertNotFound();
    }

    public function test_it_rejects_invalid_dataset_sizes(): void
    {
        $this->artisan('load-test:try-out:prepare', ['--users' => 3001])->assertExitCode(2);
        $this->assertDatabaseMissing('try_outs', ['source_file_name' => 'load-test:try-outs']);
    }
}
