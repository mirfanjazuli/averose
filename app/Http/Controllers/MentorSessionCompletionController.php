<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreMentorJournalRequest;
use App\Models\MentorJournal;
use App\Models\SessionBooking;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class MentorSessionCompletionController extends Controller
{
    public function store(StoreMentorJournalRequest $request, SessionBooking $sessionBooking): RedirectResponse
    {
        DB::transaction(function () use ($request, $sessionBooking): void {
            $journal = MentorJournal::query()->firstOrNew([
                'session_booking_id' => $sessionBooking->id,
            ]);

            $journal->fill([
                'mentor_id' => $sessionBooking->mentor_id,
                'student_id' => $sessionBooking->user_id,
                'subject_id' => $sessionBooking->subject_id,
                'slug' => $journal->slug ?: $this->uniqueSlug($sessionBooking),
                'note' => 'completed',
                'achievement' => $request->validated('achievement'),
                'improvement_area' => $request->validated('improvement_area'),
                'next_improvement_plan' => $request->validated('next_improvement_plan'),
            ]);
            $journal->save();

            $sessionBooking->update([
                'status' => 'completed',
            ]);
        });

        return back();
    }

    private function uniqueSlug(SessionBooking $sessionBooking): string
    {
        $baseSlug = Str::slug(collect([
            $sessionBooking->subject?->name ?? 'session',
            $sessionBooking->user?->name ?? 'student',
            $sessionBooking->scheduled_at?->format('Y-m-d'),
        ])->filter()->join(' ')) ?: 'mentor-journal';
        $slug = $baseSlug;
        $counter = 2;

        while (MentorJournal::query()->where('slug', $slug)->exists()) {
            $slug = "{$baseSlug}-{$counter}";
            $counter++;
        }

        return $slug;
    }
}
