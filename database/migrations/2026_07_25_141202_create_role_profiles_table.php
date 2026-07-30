<?php

use App\UserRole;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('student_profiles', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('parent_phone')->nullable();
            $table->string('school')->nullable();
            $table->string('education_level')->nullable();
            $table->string('grade')->nullable();
            $table->string('timezone')->default('Asia/Jakarta');
            $table->timestamps();
        });

        Schema::create('mentor_profiles', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->foreignId('mentor_level_id')->nullable()->constrained('mentor_levels')->nullOnDelete();
            $table->text('bio')->nullable();
            $table->json('expertise')->nullable();
            $table->string('bank_name')->nullable();
            $table->string('bank_account_name')->nullable();
            $table->string('bank_account_number')->nullable();
            $table->timestamps();
        });

        Schema::create('internal_profiles', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('department')->nullable();
            $table->string('position')->nullable();
            $table->string('employee_code')->nullable()->unique();
            $table->timestamps();
        });

        $now = now();
        $hasLegacyMentorLevel = Schema::hasColumn('users', 'mentor_level_id');

        DB::table('users')
            ->where('role', UserRole::Student->value)
            ->orderBy('id')
            ->get(['id'])
            ->each(fn (object $user): int => DB::table('student_profiles')->insert([
                'created_at' => $now,
                'updated_at' => $now,
                'user_id' => $user->id,
            ]));

        DB::table('users')
            ->where('role', UserRole::Mentor->value)
            ->orderBy('id')
            ->get($hasLegacyMentorLevel ? ['id', 'mentor_level_id'] : ['id'])
            ->each(fn (object $user): int => DB::table('mentor_profiles')->insert([
                'created_at' => $now,
                'mentor_level_id' => $hasLegacyMentorLevel ? $user->mentor_level_id : null,
                'updated_at' => $now,
                'user_id' => $user->id,
            ]));

        DB::table('users')
            ->where('role', UserRole::Admin->value)
            ->orderBy('id')
            ->get(['id'])
            ->each(fn (object $user): int => DB::table('internal_profiles')->insert([
                'created_at' => $now,
                'updated_at' => $now,
                'user_id' => $user->id,
            ]));

        if ($hasLegacyMentorLevel) {
            Schema::table('users', function (Blueprint $table): void {
                $table->dropConstrainedForeignId('mentor_level_id');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('internal_profiles');
        Schema::dropIfExists('mentor_profiles');
        Schema::dropIfExists('student_profiles');
    }
};
