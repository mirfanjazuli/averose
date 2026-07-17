<?php

namespace App\Console\Commands;

use App\Services\TryOutAssetStorage;
use Illuminate\Console\Command;

class CleanupTryOutPreviewAssets extends Command
{
    protected $signature = 'try-outs:cleanup-preview-assets';

    protected $description = 'Delete expired temporary try out image assets';

    public function handle(TryOutAssetStorage $storage): int
    {
        $deleted = $storage->cleanupExpiredTemporaryAssets();
        $this->info("Deleted {$deleted} expired try out image assets.");

        return self::SUCCESS;
    }
}
