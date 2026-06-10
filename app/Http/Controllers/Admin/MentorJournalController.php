<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\MentorJournal;
use Inertia\Inertia;
use Inertia\Response;

class MentorJournalController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('admin/mentoring/journals', [
            'journals' => MentorJournal::query()
                ->with([
                    'mentor:id,name',
                    'sessionBooking:id,scheduled_at,duration',
                    'student:id,name',
                    'subject:id,name',
                ])
                ->latest('created_at')
                ->get()
                ->map(fn (MentorJournal $journal): array => $this->journalData($journal))
                ->all(),
        ]);
    }

    public function show(MentorJournal $journal): Response
    {
        $journal->load([
            'mentor:id,name',
            'sessionBooking:id,scheduled_at,duration',
            'student:id,name',
            'subject:id,name',
        ]);

        return Inertia::render('admin/mentoring/journal-detail', [
            'breadcrumbs' => [
                [
                    'title' => 'Mentoring',
                    'href' => '/mentoring/journals',
                ],
                [
                    'title' => 'Journals',
                    'href' => '/mentoring/journals',
                ],
                [
                    'title' => $journal->subject?->name ?? 'Journal',
                    'href' => "/mentoring/journals/{$journal->slug}",
                ],
            ],
            'journal' => $this->journalData($journal),
        ]);
    }

    private function journalData(MentorJournal $journal): array
    {
        $scheduledAt = $journal->sessionBooking?->scheduled_at;

        return [
            'achievement' => $journal->achievement,
            'date' => $scheduledAt?->format('Y-m-d') ?? $journal->created_at->format('Y-m-d'),
            'duration' => $journal->sessionBooking ? "{$journal->sessionBooking->duration} min" : '-',
            'id' => $journal->id,
            'improvementArea' => $journal->improvement_area,
            'mentor' => $journal->mentor?->name ?? '-',
            'nextImprovementPlan' => $journal->next_improvement_plan,
            'note' => $journal->note,
            'sessionName' => $journal->subject?->name ?? 'Session',
            'slug' => $journal->slug,
            'student' => $journal->student?->name ?? '-',
            'subject' => $journal->subject?->name ?? '-',
        ];
    }
}
