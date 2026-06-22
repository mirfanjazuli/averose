<?php

use App\Http\Controllers\N8n\YoutubeRecordingController;
use App\Http\Controllers\N8n\ZoomAccountConfigController;
use Illuminate\Support\Facades\Route;

Route::prefix('n8n')->name('n8n.')->group(function (): void {
    Route::get('zoom-accounts/{zoom_account:slug}', [ZoomAccountConfigController::class, 'show'])
        ->name('zoom-accounts.show');
    Route::post('youtube-recordings', [YoutubeRecordingController::class, 'store'])
        ->name('youtube-recordings.store');
});
