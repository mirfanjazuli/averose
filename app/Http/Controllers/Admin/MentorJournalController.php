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
        return Inertia::render('admin/monitoring/mentor-journals/index', [
            'journals' => MentorJournal::query()
                ->with([
                    'mentor:id,name',
                    'schedule:id,code,scheduled_at,duration,program_enrollment_id',
                    'schedule.enrollment.program:id,name',
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
            'attachments:id,uuid,mentor_journal_id,original_name,mime_type,size',
            'mentor:id,name',
            'schedule:id,code,scheduled_at,duration,program_enrollment_id',
            'schedule.enrollment.program:id,name',
            'student:id,name',
            'subject:id,name',
        ]);

        return Inertia::render('admin/monitoring/mentor-journals/show', [
            'breadcrumbs' => [
                [
                    'title' => 'Monitoring',
                    'href' => '/monitoring/mentor-journals',
                ],
                [
                    'title' => 'Mentor Journals',
                    'href' => '/monitoring/mentor-journals',
                ],
                [
                    'title' => $journal->schedule?->code ?? "Journal #{$journal->id}",
                    'href' => "/monitoring/mentor-journals/{$journal->routeIdentifier()}",
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
            'id' => $journal->id,
            'improvementArea' => $journal->improvement_area,
            'mentor' => $journal->mentor?->name ?? '-',
            'mentorId' => (string) $journal->mentor_id,
            'nextImprovementPlan' => $journal->next_improvement_plan,
            'program' => $journal->schedule?->enrollment?->program?->name ?? '-',
            'scheduleCode' => $journal->schedule?->code ?? "Journal #{$journal->id}",
            'scheduleId' => $journal->schedule_id ? (string) $journal->schedule_id : null,
            'sessionEndAt' => $endedAt?->toJSON(),
            'sessionStartAt' => ($scheduledAt ?? $journal->created_at)->toJSON(),
            'slug' => $journal->routeIdentifier(),
            'student' => $journal->student?->name ?? '-',
            'studentId' => (string) $journal->student_id,
            'subject' => $journal->subject?->name ?? '-',
        ];
    }
}
