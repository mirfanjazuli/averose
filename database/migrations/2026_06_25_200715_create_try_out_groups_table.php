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
        Schema::create('try_out_groups', function (Blueprint $table) {
            $table->id();
            $table->foreignId('try_out_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('token')->unique();
            $table->date('available_from');
            $table->date('available_until');
            $table->unsignedInteger('attempt_quota');
            $table->unsignedInteger('max_participants')->nullable();
            $table->string('status')->default('active');
            $table->timestamps();

            $table->index(['try_out_id', 'status']);
            $table->index(['available_from', 'available_until']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('try_out_groups');
    }
};
