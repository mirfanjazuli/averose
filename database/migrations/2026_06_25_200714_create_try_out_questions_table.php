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
        Schema::create('try_out_questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('try_out_id')->constrained()->cascadeOnDelete();
            $table->foreignId('subject_id')->nullable()->constrained()->nullOnDelete();
            $table->string('subject_name')->nullable();
            $table->unsignedInteger('number');
            $table->longText('question_text');
            $table->json('options');
            $table->string('answer', 1)->nullable();
            $table->longText('explanation')->nullable();
            $table->timestamps();

            $table->unique(['try_out_id', 'number']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('try_out_questions');
    }
};
