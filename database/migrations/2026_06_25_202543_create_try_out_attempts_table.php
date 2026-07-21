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
        Schema::create('try_out_attempts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('try_out_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('try_out_access_id')->nullable()->constrained()->nullOnDelete();
            $table->json('answers');
            $table->unsignedInteger('correct_count');
            $table->unsignedInteger('partial_count')->default(0);
            $table->unsignedInteger('wrong_count')->default(0);
            $table->unsignedInteger('unanswered_count')->default(0);
            $table->unsignedInteger('question_count');
            $table->decimal('score', 12, 2);
            $table->string('scoring_mode')->default('raw_score');
            $table->decimal('max_score', 12, 2)->default(100);
            $table->decimal('percentage_score', 5, 2)->nullable();
            $table->json('scoring_snapshot')->nullable();
            $table->json('question_snapshot')->nullable();
            $table->json('score_breakdown')->nullable();
            $table->timestamp('submitted_at');
            $table->timestamps();

            $table->index(['user_id', 'submitted_at'], 'try_out_attempts_user_submitted_index');
            $table->index(['try_out_id', 'percentage_score', 'submitted_at'], 'try_out_attempts_leaderboard_index');
            $table->index(['try_out_id', 'user_id'], 'try_out_attempts_try_out_user_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('try_out_attempts');
    }
};
