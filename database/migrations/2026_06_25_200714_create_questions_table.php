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
        Schema::create('questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('try_out_id')->constrained()->cascadeOnDelete();
            $table->foreignId('subject_id')->nullable()->constrained()->nullOnDelete();
            $table->string('subject_name')->nullable();
            $table->unsignedInteger('number');
            $table->string('question_type')->default('single_choice');
            $table->longText('question_text');
            $table->longText('question_html')->nullable();
            $table->json('options');
            $table->json('options_html')->nullable();
            $table->string('answer', 1)->nullable();
            $table->json('correct_answers')->nullable();
            $table->decimal('points', 8, 4)->nullable();
            $table->longText('explanation')->nullable();
            $table->string('status')->default('active')->index();
            $table->timestamps();

            $table->unique(['try_out_id', 'number']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('questions');
    }
};
