<?php

namespace App\Console\Commands;

use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Notifications\DatabaseNotification;

#[Signature('notifications:prune {--days=180 : Delete read notifications older than this many days}')]
#[Description('Delete old read notifications while retaining unread notifications')]
class PruneReadNotifications extends Command
{
    public function handle(): int
    {
        $days = max(1, (int) $this->option('days'));
        $deleted = DatabaseNotification::query()
            ->whereNotNull('read_at')
            ->where('created_at', '<', now()->subDays($days))
            ->delete();

        $this->components->info("Deleted {$deleted} read notifications.");

        return self::SUCCESS;
    }
}
