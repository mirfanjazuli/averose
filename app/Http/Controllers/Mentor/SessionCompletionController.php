<?php

namespace App\Http\Controllers\Mentor;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreMentorJournalRequest;
use App\Models\MentorJournal;
use App\Models\Schedule;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class SessionCompletionController extends Controller
{
    public function store(StoreMentorJournalRequest $request, Schedule $schedule): RedirectResponse
    {
        DB::transaction(function () use ($request, $schedule): void {
            $journal = MentorJournal::query()->firstOrNew([
                'schedule_id' => $schedule->id,
            ]);

            $journal->fill([
                'mentor_id' => $schedule->mentor_id,
                'student_id' => $schedule->user_id,
                'subject_id' => $schedule->subject_id,
                'slug' => $journal->slug ?: $this->uniqueSlug($schedule),
                'note' => 'completed',
                'achievement' => $request->validated('achievement'),
                'improvement_area' => $request->validated('improvement_area'),
                'next_improvement_plan' => $request->validated('next_improvement_plan'),
            ]);
            $journal->save();

            $schedule->update([
                'status' => 'completed',
            ]);
        });

        return back();
    }

    private function uniqueSlug(Schedule $schedule): string
    {
        $baseSlug = Str::slug(collect([
            $schedule->subject?->name ?? 'session',
            $schedule->user?->name ?? 'student',
            $schedule->scheduled_at?->format('Y-m-d'),
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
