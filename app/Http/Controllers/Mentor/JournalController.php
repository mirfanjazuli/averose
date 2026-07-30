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
                    'schedule:id,code,scheduled_at,duration,program_enrollment_id',
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
            'attachments:id,uuid,mentor_journal_id,original_name,mime_type,size',
            'schedule:id,code,scheduled_at,duration,program_enrollment_id',
            'schedule.enrollment.program:id,name',
            'student:id,name',
            'subject:id,name',
        ]);

        return Inertia::render('mentor/journals/show', [
            'breadcrumbs' => [
                [
                    'title' => 'Journals',
                    'href' => '/journals',
                ],
                [
                    'title' => $journal->schedule?->code ?? "Journal #{$journal->id}",
                    'href' => "/journals/{$journal->routeIdentifier()}",
                ],
            ],
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
            'attachments' => $journal->relationLoaded('attachments')
                ? $journal->attachments->map(fn ($attachment): array => [
                    'mimeType' => $attachment->mime_type,
                    'name' => $attachment->original_name,
                    'size' => $attachment->size,
                    'url' => route('mentor-journal-attachments.show', $attachment, absolute: false),
                    'uuid' => $attachment->uuid,
                ])->values()->all()
                : [],
            'completedAt' => $journal->created_at->toJSON(),
            'id' => (string) $journal->id,
            'improvementArea' => $journal->improvement_area,
            'nextImprovementPlan' => $journal->next_improvement_plan,
            'program' => $journal->schedule?->enrollment?->program?->name ?? '-',
            'scheduleCode' => $journal->schedule?->code ?? "Journal #{$journal->id}",
            'scheduleId' => $journal->schedule_id ? (string) $journal->schedule_id : null,
            'sessionEndAt' => $endedAt?->toJSON(),
            'sessionStartAt' => ($scheduledAt ?? $journal->created_at)->toJSON(),
            'slug' => $journal->routeIdentifier(),
            'student' => $journal->student?->name ?? '-',
            'subject' => $journal->subject?->name ?? '-',
        ];
    }
}
