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
        Schema::create('try_out_accesses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('try_out_id')->constrained()->cascadeOnDelete();
            $table->foreignId('try_out_group_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->date('available_from');
            $table->date('available_until');
            $table->unsignedInteger('attempt_quota');
            $table->unsignedInteger('attempts_used')->default(0);
            $table->string('status')->default('active');
            $table->timestamps();

            $table->index(['try_out_id', 'user_id']);
            $table->index(['try_out_group_id', 'user_id'], 'try_out_accesses_group_user_index');
            $table->index(['user_id', 'status']);
            $table->index(['available_from', 'available_until']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('try_out_accesses');
    }
};
