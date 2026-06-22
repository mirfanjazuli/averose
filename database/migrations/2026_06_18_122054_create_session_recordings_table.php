<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('session_recordings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('session_booking_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('zoom_account_id')->constrained()->cascadeOnDelete();
            $table->string('zoom_meeting_id')->index();
            $table->string('zoom_meeting_uuid')->nullable()->index();
            $table->string('zoom_recording_file_id')->nullable()->unique();
            $table->string('youtube_video_id')->unique();
            $table->text('youtube_url');
            $table->string('title');
            $table->timestamp('recorded_at')->nullable();
            $table->unsignedInteger('duration')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->unique(['session_booking_id', 'youtube_video_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('session_recordings');
    }
};
