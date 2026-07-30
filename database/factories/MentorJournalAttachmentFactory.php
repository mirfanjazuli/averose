<?php

namespace Database\Factories;

use App\Models\MentorJournal;
use App\Models\MentorJournalAttachment;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<MentorJournalAttachment>
 */
class MentorJournalAttachmentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $uuid = (string) Str::uuid();

        return [
            'disk' => 'r2',
            'mentor_journal_id' => MentorJournal::factory(),
            'mime_type' => 'application/pdf',
            'original_name' => 'session-material.pdf',
            'path' => "mentor-journals/2026/SCH-2026-000001/{$uuid}.pdf",
            'size' => 1024,
            'uploaded_by' => User::factory()->mentor(),
            'uuid' => $uuid,
        ];
    }
}
