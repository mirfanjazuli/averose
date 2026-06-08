<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('nickname')->nullable()->unique()->after('name');
            $table->string('slug')->nullable()->unique()->after('nickname');
            $table->string('status')->default('active')->after('role');
        });

        DB::table('users')
            ->orderBy('id')
            ->get(['id', 'name'])
            ->each(function (object $user): void {
                $firstName = Str::of($user->name)->trim()->explode(' ')->filter()->first() ?? 'User';
                $baseNickname = Str::of($firstName)->ascii()->replaceMatches('/[^A-Za-z0-9]/', '')->toString();
                $baseSlug = Str::slug($user->name) ?: 'user';

                DB::table('users')
                    ->where('id', $user->id)
                    ->update([
                        'nickname' => Str::ucfirst(Str::lower($baseNickname ?: 'User'))."_{$user->id}",
                        'slug' => "{$baseSlug}-{$user->id}",
                    ]);
            });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['nickname', 'slug', 'status']);
        });
    }
};
