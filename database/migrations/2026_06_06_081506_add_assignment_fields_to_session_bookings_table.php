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
        Schema::table('session_bookings', function (Blueprint $table) {
            $table->foreignId('mentor_id')->nullable()->after('user_id')->constrained('users')->nullOnDelete();
            $table->foreignId('zoom_account_id')->nullable()->after('mentor_id')->constrained()->nullOnDelete();
            $table->string('zoom_link')->nullable()->after('duration');
            $table->timestamp('assigned_at')->nullable()->after('zoom_link');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('session_bookings', function (Blueprint $table) {
            $table->dropConstrainedForeignId('mentor_id');
            $table->dropConstrainedForeignId('zoom_account_id');
            $table->dropColumn(['zoom_link', 'assigned_at']);
        });
    }
};
