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
        Schema::create('mentor_levels', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->decimal('hourly_rate', 12)->default(0);
            $table->boolean('is_default')->default(false)->index();
            $table->string('status')->default('active')->index();
            $table->timestamps();
        });

        collect(['Junior', 'Middle', 'Senior'])->each(function (string $name, int $index): void {
            DB::table('mentor_levels')->insert([
                'created_at' => now(),
                'hourly_rate' => 0,
                'is_default' => $index === 0,
                'name' => $name,
                'slug' => Str::slug($name),
                'status' => 'active',
                'updated_at' => now(),
            ]);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('mentor_levels');
    }
};
