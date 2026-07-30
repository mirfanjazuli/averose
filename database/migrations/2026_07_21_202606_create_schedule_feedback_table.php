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
        Schema::create('schedule_feedback', function (Blueprint $table) {
            $table->id();
            $table->foreignId('schedule_id')->unique()->constrained('schedules')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('mentor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->unsignedTinyInteger('interactivity_rating');
            $table->unsignedTinyInteger('material_clarity_rating');
            $table->unsignedTinyInteger('audio_quality_rating');
            $table->unsignedTinyInteger('visual_quality_rating');
            $table->text('comment')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'created_at']);
            $table->index(['mentor_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('schedule_feedback');
    }
};
