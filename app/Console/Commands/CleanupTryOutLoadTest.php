<?php

namespace App\Console\Commands;

use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

#[Signature('load-test:try-out:cleanup {--force : Allow execution in production}')]
#[Description('Remove the synthetic try out load-test dataset and credentials')]
class CleanupTryOutLoadTest extends Command
{
    private const CREDENTIALS_PATH = 'load-tests/try-out-users.csv';

    private const EMAIL_PATTERN = 'loadtest.tryout.%@example.test';

    private const SOURCE_MARKER = 'load-test:try-outs';

    public function handle(): int
    {
        if (app()->environment('production') && ! $this->option('force')) {
            $this->components->error('Refusing to remove load-test data in production without --force.');

            return self::FAILURE;
        }

        [$tryOuts, $users] = DB::transaction(function (): array {
            $tryOuts = DB::table('try_outs')->where('source_file_name', self::SOURCE_MARKER)->delete();
            $users = DB::table('users')->where('email', 'like', self::EMAIL_PATTERN)->delete();

            return [$tryOuts, $users];
        }, 3);

        Storage::disk('local')->delete(self::CREDENTIALS_PATH);

        $this->components->twoColumnDetail('Try outs removed', (string) $tryOuts);
        $this->components->twoColumnDetail('Students removed', (string) $users);

        return self::SUCCESS;
    }
}
