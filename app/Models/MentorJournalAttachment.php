<?php

namespace App\Models;

use Database\Factories\MentorJournalAttachmentFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['uuid', 'mentor_journal_id', 'uploaded_by', 'disk', 'path', 'original_name', 'mime_type', 'size'])]
class MentorJournalAttachment extends Model
{
    /** @use HasFactory<MentorJournalAttachmentFactory> */
    use HasFactory;

    public function getRouteKeyName(): string
    {
        return 'uuid';
    }

    public function journal(): BelongsTo
    {
        return $this->belongsTo(MentorJournal::class, 'mentor_journal_id');
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'size' => 'integer',
        ];
    }
}
