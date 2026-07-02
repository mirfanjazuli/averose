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
        Schema::table('try_out_questions', function (Blueprint $table) {
            $table->longText('question_html')->nullable()->after('question_text');
            $table->json('options_html')->nullable()->after('options');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('try_out_questions', function (Blueprint $table) {
            $table->dropColumn(['question_html', 'options_html']);
        });
    }
};
