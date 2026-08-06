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
        Schema::create('schedules', function (Blueprint $table) {
            $table->id();
            $table->string('code')->nullable()->unique();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('mentor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('zoom_account_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('program_enrollment_id')->constrained()->cascadeOnDelete();
            $table->foreignId('subject_id')->constrained()->cascadeOnDelete();
            $table->dateTime('scheduled_at');
            $table->string('timezone', 64)->default('Asia/Jakarta');
            $table->unsignedSmallInteger('duration');
            $table->string('zoom_link')->nullable();
            $table->string('zoom_meeting_id')->nullable();
            $table->text('zoom_start_url')->nullable();
            $table->string('zoom_passcode')->nullable();
            $table->timestamp('assigned_at')->nullable();
            $table->string('delivery_mode')->default('online')->index();
            $table->string('status')->default('pending')->index();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('schedules');
    }
};
