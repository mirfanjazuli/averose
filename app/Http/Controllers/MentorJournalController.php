<?php

namespace App\Http\Controllers;

use App\Models\MentorJournal;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MentorJournalController extends Controller
{
    public function index(Request $request): Response
    {
        return Inertia::render('mentor/journals', [
            'journals' => MentorJournal::query()
                ->with([
                    'sessionBooking:id,scheduled_at,duration,program_enrollment_id',
                    'sessionBooking.enrollment.program:id,name',
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
            'sessionBooking:id,scheduled_at,duration,program_enrollment_id',
            'sessionBooking.enrollment.program:id,name',
            'student:id,name',
            'subject:id,name',
        ]);

        return Inertia::render('mentor/journal-detail', [
            'journal' => $this->journalData($journal),
        ]);
    }

    private function journalData(MentorJournal $journal): array
    {
        $scheduledAt = $journal->sessionBooking?->scheduled_at;
        $endedAt = $journal->sessionBooking && $scheduledAt
            ? $scheduledAt->copy()->addMinutes($journal->sessionBooking->duration)
            : null;

        return [
            'achievement' => $journal->achievement,
            'date' => $scheduledAt?->format('l, d F Y') ?? $journal->created_at->format('l, d F Y'),
            'duration' => $journal->sessionBooking ? "{$journal->sessionBooking->duration} min" : '-',
            'id' => (string) $journal->id,
            'improvementArea' => $journal->improvement_area,
            'nextImprovementPlan' => $journal->next_improvement_plan,
            'note' => $journal->note,
            'program' => $journal->sessionBooking?->enrollment?->program?->name ?? '-',
            'sessionName' => $journal->subject?->name ?? 'Session',
            'slug' => $journal->slug,
            'student' => $journal->student?->name ?? '-',
            'subject' => $journal->subject?->name ?? '-',
            'time' => $scheduledAt && $endedAt ? $scheduledAt->format('H:i').' - '.$endedAt->format('H:i') : '-',
        ];
    }
}
