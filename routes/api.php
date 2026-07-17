<?php

use App\Http\Controllers\N8n\YoutubeRecordingController;
use App\Http\Controllers\N8n\ZoomAccountConfigController;
use Illuminate\Support\Facades\Route;

Route::prefix('n8n')->group(function (): void {
    Route::get('zoom-accounts/{zoom_account:slug}', [ZoomAccountConfigController::class, 'show'])
        ->name('n8n.zoom-accounts.show');
    Route::post('youtube-recordings', [YoutubeRecordingController::class, 'store'])
        ->name('n8n.youtube-recordings.store');
});
