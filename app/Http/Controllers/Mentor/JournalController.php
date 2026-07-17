<?php

namespace App\Http\Controllers\Mentor;

use App\Http\Controllers\Controller;
use App\Models\MentorJournal;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class JournalController extends Controller
{
    public function index(Request $request): Response
    {
        return Inertia::render('mentor/journals/index', [
            'journals' => MentorJournal::query()
                ->with([
                    'schedule:id,scheduled_at,duration,program_enrollment_id',
                    'schedule.enrollment.program:id,name',
                    'student:id,name',
                    'subject:id,name',
                ])
                ->where('mentor_id', $request->user()->id)
                ->latest('created_at')
                ->get()
                ->map(fn (MentorJournal $journal): array => $this->journalData($journal))
                ->all(),
        ]);
    }

    public function show(Request $request, MentorJournal $journal): Response
    {
        abort_unless($journal->mentor_id === $request->user()->id, 404);

        $journal->load([
            'schedule:id,scheduled_at,duration,program_enrollment_id',
            'schedule.enrollment.program:id,name',
            'student:id,name',
            'subject:id,name',
        ]);

        return Inertia::render('mentor/journals/show', [
            'journal' => $this->journalData($journal),
        ]);
    }

    private function journalData(MentorJournal $journal): array
    {
        $scheduledAt = $journal->schedule?->scheduled_at;
        $endedAt = $journal->schedule && $scheduledAt
            ? $scheduledAt->copy()->addMinutes($journal->schedule->duration)
            : null;

        return [
            'achievement' => $journal->achievement,
            'date' => $scheduledAt?->format('l, d F Y') ?? $journal->created_at->format('l, d F Y'),
            'duration' => $journal->schedule ? "{$journal->schedule->duration} min" : '-',
            'id' => (string) $journal->id,
            'improvementArea' => $journal->improvement_area,
            'nextImprovementPlan' => $journal->next_improvement_plan,
            'note' => $journal->note,
            'program' => $journal->schedule?->enrollment?->program?->name ?? '-',
            'sessionName' => $journal->subject?->name ?? 'Session',
            'slug' => $journal->slug,
            'student' => $journal->student?->name ?? '-',
            'subject' => $journal->subject?->name ?? '-',
            'time' => $scheduledAt && $endedAt ? $scheduledAt->format('H:i').' - '.$endedAt->format('H:i') : '-',
        ];
    }
}
