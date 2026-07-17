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
        Schema::create('field_subject', function (Blueprint $table) {
            $table->foreignId('field_id')->constrained('fields')->cascadeOnDelete();
            $table->foreignId('subject_id')->constrained()->cascadeOnDelete();
            $table->timestamps();

            $table->primary(['field_id', 'subject_id']);
        });

        Schema::create('field_program', function (Blueprint $table) {
            $table->foreignId('field_id')->constrained('fields')->cascadeOnDelete();
            $table->foreignId('program_id')->constrained()->cascadeOnDelete();
            $table->timestamps();

            $table->primary(['field_id', 'program_id']);
        });

        Schema::create('program_subject', function (Blueprint $table) {
            $table->foreignId('program_id')->constrained()->cascadeOnDelete();
            $table->foreignId('subject_id')->constrained()->cascadeOnDelete();
            $table->timestamps();

            $table->primary(['program_id', 'subject_id']);
        });

        Schema::create('program_variant_program', function (Blueprint $table) {
            $table->foreignId('program_id')->constrained()->cascadeOnDelete();
            $table->foreignId('program_variant_id')->constrained()->cascadeOnDelete();
            $table->timestamps();

            $table->primary(['program_id', 'program_variant_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('program_variant_program');
        Schema::dropIfExists('program_subject');
        Schema::dropIfExists('field_program');
        Schema::dropIfExists('field_subject');
    }
};
