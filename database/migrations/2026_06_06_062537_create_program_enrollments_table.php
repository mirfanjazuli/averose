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
        Schema::create('program_enrollments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->restrictOnDelete();
            $table->foreignId('program_id')->constrained()->restrictOnDelete();
            $table->foreignId('field_id')->constrained('fields')->restrictOnDelete();
            $table->foreignId('program_variant_id')->constrained()->restrictOnDelete();
            $table->string('program_name_snapshot');
            $table->string('field_name_snapshot');
            $table->string('variant_name_snapshot');
            $table->unsignedSmallInteger('sessions_snapshot');
            $table->unsignedSmallInteger('duration_snapshot');
            $table->decimal('price_snapshot', 12, 2);
            $table->date('start_date');
            $table->unsignedSmallInteger('max_reschedule')->nullable();
            $table->unsignedSmallInteger('sessions_used')->default(0);
            $table->string('status')->default('active');
            $table->timestamps();

            $table->index(['user_id', 'program_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('program_enrollments');
    }
};
