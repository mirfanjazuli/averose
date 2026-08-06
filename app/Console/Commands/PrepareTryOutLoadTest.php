<?php

namespace App\Console\Commands;

use App\Models\TryOut;
use App\Models\User;
use App\UserRole;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use InvalidArgumentException;

#[Signature('load-test:try-out:prepare
    {--users=3000 : Number of synthetic students to create}
    {--questions=100 : Number of questions in the try out}
    {--password=LoadTest123! : Shared password written to the credentials file}
    {--force : Allow execution in production}')]
#[Description('Prepare an isolated private try out dataset for k6 load testing')]
class PrepareTryOutLoadTest extends Command
{
    private const CREDENTIALS_PATH = 'load-tests/try-out-users.csv';

    private const EMAIL_PREFIX = 'loadtest.tryout.';

    private const SOURCE_MARKER = 'load-test:try-outs';

    public function handle(): int
    {
        if (app()->environment('production') && ! $this->option('force')) {
            $this->components->error('Refusing to prepare load-test data in production without --force.');

            return self::FAILURE;
        }

        try {
            $userCount = $this->positiveIntegerOption('users', 3000);
            $questionCount = $this->positiveIntegerOption('questions', 100);
        } catch (InvalidArgumentException $exception) {
            $this->components->error($exception->getMessage());

            return self::INVALID;
        }

        $password = (string) $this->option('password');

        if ($password === '') {
            $this->components->error('The --password option cannot be empty.');

            return self::INVALID;
        }

        $this->components->info("Preparing {$userCount} students and {$questionCount} questions...");

        /** @var TryOut $tryOut */
        $tryOut = DB::transaction(function () use ($password, $questionCount, $userCount): TryOut {
            $tryOut = TryOut::query()->firstOrNew(['source_file_name' => self::SOURCE_MARKER]);
            $tryOut->fill([
                'correct_points' => null,
                'description' => 'Synthetic private try out for controlled load testing.',
                'duration_minutes' => 120,
                'scoring_mode' => 'raw_score',
                'status' => 'private',
                'title' => 'Load Test Try Out 3000',
                'unanswered_points' => null,
                'wrong_points' => null,
            ]);
            $tryOut->save();

            $this->upsertQuestions($tryOut, $questionCount);
            $userIds = $this->upsertStudents($userCount, $password);

            DB::table('try_out_attempts')
                ->where('try_out_id', $tryOut->id)
                ->whereIn('user_id', $userIds)
                ->delete();
            DB::table('try_out_accesses')
                ->where('try_out_id', $tryOut->id)
                ->whereIn('user_id', $userIds)
                ->delete();

            $now = now();

            collect($userIds)->chunk(500)->each(function ($ids) use ($now, $tryOut): void {
                DB::table('try_out_accesses')->insert($ids->map(fn (int $userId): array => [
                    'attempt_quota' => 1,
                    'attempts_used' => 0,
                    'available_from' => $now->copy()->subDay()->toDateString(),
                    'available_until' => $now->copy()->addMonth()->toDateString(),
                    'created_at' => $now,
                    'status' => 'active',
                    'try_out_group_id' => null,
                    'try_out_id' => $tryOut->id,
                    'updated_at' => $now,
                    'user_id' => $userId,
                ])->all());
            });

            return $tryOut;
        }, 3);

        $this->writeCredentials($userCount, $password);

        $this->newLine();
        $this->components->twoColumnDetail('Try out slug', $tryOut->slug);
        $this->components->twoColumnDetail('Students', (string) $userCount);
        $this->components->twoColumnDetail('Questions', (string) $questionCount);
        $this->components->twoColumnDetail('Credentials', Storage::disk('local')->path(self::CREDENTIALS_PATH));

        return self::SUCCESS;
    }

    private function positiveIntegerOption(string $name, int $maximum): int
    {
        $value = filter_var($this->option($name), FILTER_VALIDATE_INT);

        if ($value === false || $value < 1 || $value > $maximum) {
            throw new InvalidArgumentException("The --{$name} option must be between 1 and {$maximum}.");
        }

        return $value;
    }

    private function upsertQuestions(TryOut $tryOut, int $questionCount): void
    {
        $now = now();
        $options = [
            'A' => 'Option A',
            'B' => 'Option B',
            'C' => 'Option C',
            'D' => 'Option D',
            'E' => 'Option E',
        ];

        $rows = collect(range(1, $questionCount))->map(function (int $number) use ($now, $options, $tryOut): array {
            $type = match (true) {
                $number % 10 === 0 => 'numeric_answer',
                $number % 5 === 0 => 'multiple_answer',
                default => 'single_choice',
            };
            $correctAnswers = match ($type) {
                'numeric_answer' => ['42'],
                'multiple_answer' => ['A', 'C'],
                default => ['A'],
            };
            $questionOptions = $type === 'numeric_answer' ? [] : $options;

            return [
                'answer' => $type === 'multiple_answer' ? null : $correctAnswers[0],
                'correct_answers' => json_encode($correctAnswers, JSON_THROW_ON_ERROR),
                'created_at' => $now,
                'explanation' => null,
                'number' => $number,
                'options' => json_encode($questionOptions, JSON_THROW_ON_ERROR),
                'options_html' => json_encode($questionOptions, JSON_THROW_ON_ERROR),
                'points' => 1,
                'question_html' => "<p>Load test question {$number}: calculate or select the correct answer.</p>",
                'question_text' => "Load test question {$number}: calculate or select the correct answer.",
                'question_type' => $type,
                'status' => 'active',
                'sub_category_name' => $number % 2 === 0 ? 'Structure' : null,
                'subject_id' => null,
                'subject_name' => $number % 2 === 0 ? 'English' : 'Mathematics',
                'try_out_id' => $tryOut->id,
                'updated_at' => $now,
            ];
        });

        $tryOut->questions()->where('number', '>', $questionCount)->delete();
        $rows->chunk(500)->each(fn ($chunk) => DB::table('questions')->upsert(
            $chunk->all(),
            ['try_out_id', 'number'],
            [
                'answer', 'correct_answers', 'explanation', 'options', 'options_html', 'points',
                'question_html', 'question_text', 'question_type', 'status', 'sub_category_name',
                'subject_id', 'subject_name', 'updated_at',
            ],
        ));
    }

    /** @return array<int, int> */
    private function upsertStudents(int $userCount, string $password): array
    {
        $now = now();
        $passwordHash = Hash::make($password);
        $emails = [];

        collect(range(1, $userCount))->chunk(500)->each(function ($indexes) use (&$emails, $now, $passwordHash): void {
            $rows = $indexes->map(function (int $index) use (&$emails, $now, $passwordHash): array {
                $sequence = str_pad((string) $index, 4, '0', STR_PAD_LEFT);
                $email = self::EMAIL_PREFIX.$sequence.'@example.test';
                $emails[] = $email;

                return [
                    'created_at' => $now,
                    'email' => $email,
                    'email_verified_at' => $now,
                    'name' => "Load Test Student {$sequence}",
                    'nickname' => "LoadTest{$sequence}",
                    'password' => $passwordHash,
                    'role' => UserRole::Student->value,
                    'slug' => "load-test-student-{$sequence}",
                    'status' => 'active',
                    'timezone' => 'Asia/Jakarta',
                    'timezone_mode' => 'auto',
                    'updated_at' => $now,
                ];
            })->all();

            DB::table('users')->upsert($rows, ['email'], [
                'email_verified_at', 'name', 'nickname', 'password', 'role', 'slug', 'status',
                'timezone', 'timezone_mode', 'updated_at',
            ]);
        });

        $users = User::query()->whereIn('email', $emails)->orderBy('email')->get(['id', 'email']);
        $profiles = $users->map(fn (User $user): array => [
            'created_at' => $now,
            'updated_at' => $now,
            'user_id' => $user->id,
        ]);
        $profiles->chunk(500)->each(fn ($chunk) => DB::table('student_profiles')->insertOrIgnore($chunk->all()));

        return $users->pluck('id')->map(fn ($id): int => (int) $id)->all();
    }

    private function writeCredentials(int $userCount, string $password): void
    {
        $lines = ['index,email,password'];

        foreach (range(1, $userCount) as $index) {
            $sequence = str_pad((string) $index, 4, '0', STR_PAD_LEFT);
            $lines[] = implode(',', [$index, self::EMAIL_PREFIX.$sequence.'@example.test', $password]);
        }

        Storage::disk('local')->makeDirectory('load-tests/results');
        Storage::disk('local')->put(self::CREDENTIALS_PATH, implode("\n", $lines)."\n");
    }
}
