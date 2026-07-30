<?php

namespace App\Http\Controllers\Mentor;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreMentorJournalRequest;
use App\Models\MentorJournal;
use App\Models\Schedule;
use App\Services\MentorJournalAttachmentStorage;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Throwable;

class SessionCompletionController extends Controller
{
    public function store(
        StoreMentorJournalRequest $request,
        Schedule $schedule,
        MentorJournalAttachmentStorage $attachmentStorage,
    ): RedirectResponse {
        $uploads = [];

        try {
            foreach ($request->file('attachments', []) as $attachment) {
                $uploads[] = $attachmentStorage->store($attachment, $schedule, $request->user());
            }

            DB::transaction(function () use ($request, $schedule, $uploads): void {
                $schedule = Schedule::query()
                    ->whereKey($schedule->id)
                    ->lockForUpdate()
                    ->firstOrFail();

                if (! in_array($schedule->status, ['assigned', 'rescheduled'], true)) {
                    throw ValidationException::withMessages([
                        'schedule' => 'This session cannot be completed.',
                    ]);
                }

                $journal = MentorJournal::query()->firstOrNew([
                    'schedule_id' => $schedule->id,
                ]);

                $journal->fill([
                    'mentor_id' => $schedule->mentor_id,
                    'student_id' => $schedule->user_id,
                    'subject_id' => $schedule->subject_id,
                    'slug' => $schedule->code,
                    'achievement' => $request->validated('achievement'),
                    'improvement_area' => $request->validated('improvement_area'),
                    'next_improvement_plan' => $request->validated('next_improvement_plan'),
                ]);
                $journal->save();
                $journal->attachments()->createMany($uploads);

                $previousStatus = $schedule->status;

                $schedule->update([
                    'status' => 'completed',
                ]);
                $schedule->recordHistory('completed', "Sesi diselesaikan oleh {$request->user()->name}.", $request->user(), [
                    'attachments_count' => count($uploads),
                    'mentor_journal_id' => $journal->id,
                    'status' => [
                        'from' => $previousStatus,
                        'to' => $schedule->status,
                    ],
                ], $request->ip());
            });
        } catch (Throwable $exception) {
            $attachmentStorage->deleteUploads($uploads);

            throw $exception;
        }

        return back();
    }
}
