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
        Schema::table('program_enrollments', function (Blueprint $table) {
            $table->unsignedSmallInteger('sessions_used')->default(0)->after('max_reschedule');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('program_enrollments', function (Blueprint $table) {
            $table->dropColumn('sessions_used');
        });
    }
};
