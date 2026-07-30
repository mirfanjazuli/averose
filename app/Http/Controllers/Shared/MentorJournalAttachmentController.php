<?php

namespace App\Http\Controllers\Shared;

use App\Http\Controllers\Controller;
use App\Models\MentorJournalAttachment;
use App\Models\User;
use App\Services\MentorJournalAttachmentStorage;
use Illuminate\Http\RedirectResponse;

class MentorJournalAttachmentController extends Controller
{
    public function show(
        MentorJournalAttachment $mentorJournalAttachment,
        MentorJournalAttachmentStorage $storage,
    ): RedirectResponse {
        /** @var User $user */
        $user = request()->user();
        $mentorJournalAttachment->loadMissing('journal');

        abort_unless($this->canView($user, $mentorJournalAttachment), 404);

        return redirect()->away($storage->temporaryUrl($mentorJournalAttachment));
    }

    private function canView(User $user, MentorJournalAttachment $attachment): bool
    {
        $journal = $attachment->journal;

        if (! $journal) {
            return false;
        }

        if ($user->isAdmin()) {
            return $user->hasPermission('mentor_journals.view');
        }

        return ($user->isMentor() && $journal->mentor_id === $user->id)
            || ($user->isStudent() && $journal->student_id === $user->id);
    }
}
