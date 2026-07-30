<?php

namespace Tests\Feature;

use App\Models\MentorJournal;
use App\Models\MentorJournalAttachment;
use App\Models\Schedule;
use App\Models\Subject;
use App\Models\User;
use App\Services\MentorJournalAttachmentStorage;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Mockery\MockInterface;
use RuntimeException;
use Tests\TestCase;

class MentorJournalsTest extends TestCase
{
    use RefreshDatabase;

    public function test_mentor_can_complete_session_and_create_journal(): void
    {
        $mentor = User::factory()->mentor()->create();
        $student = User::factory()->student()->create([
            'name' => 'Alya Safira',
        ]);
        $subject = Subject::factory()->create([
            'name' => 'IELTS Writing',
        ]);
        $session = Schedule::factory()->create([
            'duration' => 60,
            'mentor_id' => $mentor->id,
            'scheduled_at' => now()->subMinutes(61),
            'status' => 'assigned',
            'subject_id' => $subject->id,
            'user_id' => $student->id,
        ]);

        $this->actingAs($mentor)
            ->post(route('mentor.sessions.complete', $session), [
                'achievement' => 'Student wrote a clear thesis statement.',
                'improvement_area' => 'Develop stronger supporting examples.',
                'next_improvement_plan' => 'Draft one essay outline before the next session.',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('mentor_journals', [
            'achievement' => 'Student wrote a clear thesis statement.',
            'improvement_area' => 'Develop stronger supporting examples.',
            'mentor_id' => $mentor->id,
            'next_improvement_plan' => 'Draft one essay outline before the next session.',
            'schedule_id' => $session->id,
            'slug' => $session->code,
            'student_id' => $student->id,
            'subject_id' => $subject->id,
        ]);
        $this->assertDatabaseHas('schedules', [
            'id' => $session->id,
            'status' => 'completed',
        ]);
        $this->assertFalse(Schema::hasColumn('mentor_journals', 'note'));
    }

    public function test_mentor_can_complete_session_with_multiple_attachments(): void
    {
        Storage::fake('r2');

        $mentor = User::factory()->mentor()->create();
        $student = User::factory()->student()->create();
        $session = Schedule::factory()->create([
            'duration' => 60,
            'mentor_id' => $mentor->id,
            'scheduled_at' => '2026-07-30 09:00:00',
            'status' => 'assigned',
            'user_id' => $student->id,
        ]);

        $this->travelTo('2026-07-30 10:01:00');

        $this->actingAs($mentor)
            ->post(route('mentor.sessions.complete', $session), [
                'achievement' => 'Student completed the lesson.',
                'attachments' => [
                    UploadedFile::fake()->create('Session Notes.pdf', 512, 'application/pdf'),
                    UploadedFile::fake()->image('Diagram.png'),
                ],
                'improvement_area' => 'Review the lesson.',
                'next_improvement_plan' => 'Continue next time.',
            ])
            ->assertRedirect();

        $journal = MentorJournal::query()->whereBelongsTo($session)->firstOrFail();
        $attachments = $journal->attachments()->orderBy('id')->get();

        $this->assertCount(2, $attachments);
        $this->assertSame(['Session Notes.pdf', 'Diagram.png'], $attachments->pluck('original_name')->all());
        $this->assertSame([$mentor->id, $mentor->id], $attachments->pluck('uploaded_by')->all());
        $this->assertSame(['r2', 'r2'], $attachments->pluck('disk')->all());

        foreach ($attachments as $attachment) {
            $this->assertStringStartsWith("mentor-journals/2026/{$session->code}/", $attachment->path);
            Storage::disk('r2')->assertExists($attachment->path);
        }
    }

    public function test_completion_attachment_validation_rejects_invalid_files(): void
    {
        Storage::fake('r2');

        $mentor = User::factory()->mentor()->create();
        $session = Schedule::factory()->create([
            'duration' => 60,
            'mentor_id' => $mentor->id,
            'scheduled_at' => now()->subMinutes(61),
            'status' => 'assigned',
        ]);

        $this->actingAs($mentor)
            ->post(route('mentor.sessions.complete', $session), [
                'achievement' => 'Completed the lesson.',
                'attachments' => array_fill(0, 6, UploadedFile::fake()->create('notes.pdf', 10, 'application/pdf')),
                'improvement_area' => 'Review the lesson.',
                'next_improvement_plan' => 'Continue next time.',
            ])
            ->assertSessionHasErrors('attachments');

        $this->actingAs($mentor)
            ->post(route('mentor.sessions.complete', $session), [
                'achievement' => 'Completed the lesson.',
                'attachments' => [UploadedFile::fake()->create('archive.zip', 10, 'application/zip')],
                'improvement_area' => 'Review the lesson.',
                'next_improvement_plan' => 'Continue next time.',
            ])
            ->assertSessionHasErrors('attachments.0');

        $this->actingAs($mentor)
            ->post(route('mentor.sessions.complete', $session), [
                'achievement' => 'Completed the lesson.',
                'attachments' => [UploadedFile::fake()->create('large.pdf', 10241, 'application/pdf')],
                'improvement_area' => 'Review the lesson.',
                'next_improvement_plan' => 'Continue next time.',
            ])
            ->assertSessionHasErrors('attachments.0');

        $this->assertDatabaseMissing('mentor_journals', ['schedule_id' => $session->id]);
        $this->assertSame('assigned', $session->fresh()->status);
    }

    public function test_storage_failure_does_not_complete_session_or_create_journal(): void
    {
        $mentor = User::factory()->mentor()->create();
        $session = Schedule::factory()->create([
            'duration' => 60,
            'mentor_id' => $mentor->id,
            'scheduled_at' => now()->subMinutes(61),
            'status' => 'assigned',
        ]);
        $uploadedAttachment = [
            'disk' => 'r2',
            'mime_type' => 'application/pdf',
            'original_name' => 'notes.pdf',
            'path' => "mentor-journals/2026/{$session->code}/uploaded.pdf",
            'size' => 1024,
            'uploaded_by' => $mentor->id,
            'uuid' => '0198f2c4-0000-7000-8000-000000000001',
        ];

        $this->mock(MentorJournalAttachmentStorage::class, function (MockInterface $mock) use ($uploadedAttachment): void {
            $uploadAttempt = 0;

            $mock->shouldReceive('store')
                ->twice()
                ->andReturnUsing(function () use (&$uploadAttempt, $uploadedAttachment): array {
                    if ($uploadAttempt++ === 0) {
                        return $uploadedAttachment;
                    }

                    throw new RuntimeException('R2 unavailable');
                });
            $mock->shouldReceive('deleteUploads')->once()->with([$uploadedAttachment]);
        });

        $this->withoutExceptionHandling();

        try {
            $this->actingAs($mentor)
                ->post(route('mentor.sessions.complete', $session), [
                    'achievement' => 'Completed the lesson.',
                    'attachments' => [
                        UploadedFile::fake()->create('notes.pdf', 10, 'application/pdf'),
                        UploadedFile::fake()->create('worksheet.pdf', 10, 'application/pdf'),
                    ],
                    'improvement_area' => 'Review the lesson.',
                    'next_improvement_plan' => 'Continue next time.',
                ]);
            $this->fail('Expected the storage exception to be thrown.');
        } catch (RuntimeException $exception) {
            $this->assertSame('R2 unavailable', $exception->getMessage());
        }

        $this->assertDatabaseMissing('mentor_journals', ['schedule_id' => $session->id]);
        $this->assertSame('assigned', $session->fresh()->status);
    }

    public function test_mentor_cannot_complete_session_before_it_ends(): void
    {
        $mentor = User::factory()->mentor()->create();
        $session = Schedule::factory()->create([
            'duration' => 60,
            'mentor_id' => $mentor->id,
            'scheduled_at' => now()->addMinutes(10),
            'status' => 'assigned',
        ]);

        $this->actingAs($mentor)
            ->post(route('mentor.sessions.complete', $session), [
                'achievement' => 'Completed the lesson.',
                'improvement_area' => 'Review the lesson.',
                'next_improvement_plan' => 'Continue next time.',
            ])
            ->assertSessionHasErrors('schedule');

        $this->assertDatabaseMissing('mentor_journals', [
            'schedule_id' => $session->id,
        ]);
    }

    public function test_admin_can_view_journal_list_and_detail_from_database(): void
    {
        $admin = User::factory()->admin()->create();
        $mentor = User::factory()->mentor()->create([
            'name' => 'Nadia Putri',
        ]);
        $student = User::factory()->student()->create([
            'name' => 'Alya Safira',
        ]);
        $subject = Subject::factory()->create([
            'name' => 'IELTS Writing',
        ]);
        $session = Schedule::factory()->create([
            'duration' => 90,
            'mentor_id' => $mentor->id,
            'scheduled_at' => '2026-06-09 10:00:00',
            'status' => 'completed',
            'subject_id' => $subject->id,
            'user_id' => $student->id,
        ]);
        $journal = MentorJournal::factory()->create([
            'achievement' => 'Clearer paragraph flow.',
            'improvement_area' => 'Needs stronger examples.',
            'mentor_id' => $mentor->id,
            'next_improvement_plan' => 'Practice evidence mapping.',
            'schedule_id' => $session->id,
            'slug' => 'ielts-writing-alya-safira',
            'student_id' => $student->id,
            'subject_id' => $subject->id,
        ]);
        $attachment = MentorJournalAttachment::factory()->create([
            'mentor_journal_id' => $journal->id,
            'original_name' => 'Learning Map.pdf',
            'uploaded_by' => $mentor->id,
        ]);

        $this->actingAs($admin)
            ->get(route('monitoring.mentor-journals'))
            ->assertOk()
            ->assertInertia(fn (Assert $page): Assert => $page
                ->component('admin/monitoring/mentor-journals/index')
                ->where('journals.0.scheduleCode', $session->code)
                ->where('journals.0.mentor', 'Nadia Putri')
                ->where('journals.0.student', 'Alya Safira')
                ->where('journals.0.subject', 'IELTS Writing')
                ->where('journals.0.sessionStartAt', $session->scheduled_at->toJSON())
                ->where('journals.0.sessionEndAt', $session->scheduled_at->copy()->addMinutes(90)->toJSON())
                ->where('journals.0.completedAt', $journal->created_at->toJSON())
                ->missing('journals.0.note')
                ->missing('journals.0.duration')
            );

        $this->actingAs($admin)
            ->get(route('monitoring.mentor-journals.show', $journal))
            ->assertOk()
            ->assertInertia(fn (Assert $page): Assert => $page
                ->component('admin/monitoring/mentor-journals/show')
                ->where('breadcrumbs.2.title', $session->code)
                ->where('journal.achievement', 'Clearer paragraph flow.')
                ->where('journal.scheduleCode', $session->code)
                ->where('journal.completedAt', $journal->created_at->toJSON())
                ->where('journal.nextImprovementPlan', 'Practice evidence mapping.')
                ->where('journal.attachments.0.name', 'Learning Map.pdf')
                ->where('journal.attachments.0.url', route('mentor-journal-attachments.show', $attachment, absolute: false))
                ->missing('journal.note')
            );
    }

    public function test_mentor_can_view_own_journal_page(): void
    {
        $mentor = User::factory()->mentor()->create();
        $otherMentor = User::factory()->mentor()->create();
        $student = User::factory()->student()->create([
            'name' => 'Alya Safira',
        ]);
        $subject = Subject::factory()->create([
            'name' => 'IELTS Writing',
        ]);
        $session = Schedule::factory()->create([
            'duration' => 90,
            'mentor_id' => $mentor->id,
            'scheduled_at' => '2026-06-09 10:00:00',
            'status' => 'completed',
            'subject_id' => $subject->id,
            'user_id' => $student->id,
        ]);
        $journal = MentorJournal::factory()->create([
            'mentor_id' => $mentor->id,
            'next_improvement_plan' => 'Practice evidence mapping.',
            'schedule_id' => $session->id,
            'student_id' => $student->id,
            'subject_id' => $subject->id,
        ]);
        MentorJournal::factory()->create([
            'mentor_id' => $otherMentor->id,
        ]);

        $this->actingAs($mentor)
            ->get(route('mentor.journals'))
            ->assertOk()
            ->assertInertia(fn (Assert $page): Assert => $page
                ->component('mentor/journals/index')
                ->has('journals', 1)
                ->where('journals.0.id', (string) $journal->id)
                ->where('journals.0.slug', $session->code)
                ->where('journals.0.student', 'Alya Safira')
                ->where('journals.0.subject', 'IELTS Writing')
                ->where('journals.0.sessionStartAt', $session->scheduled_at->toJSON())
                ->where('journals.0.completedAt', $journal->created_at->toJSON())
                ->where('journals.0.nextImprovementPlan', 'Practice evidence mapping.')
                ->missing('journals.0.note')
                ->missing('journals.0.duration')
            );
    }

    public function test_mentor_can_view_own_journal_detail(): void
    {
        $mentor = User::factory()->mentor()->create();
        $student = User::factory()->student()->create([
            'name' => 'Alya Safira',
        ]);
        $subject = Subject::factory()->create([
            'name' => 'IELTS Writing',
        ]);
        $session = Schedule::factory()->create([
            'duration' => 90,
            'mentor_id' => $mentor->id,
            'scheduled_at' => '2026-06-09 10:00:00',
            'status' => 'completed',
            'subject_id' => $subject->id,
            'user_id' => $student->id,
        ]);
        $journal = MentorJournal::factory()->create([
            'achievement' => 'Clearer paragraph flow.',
            'improvement_area' => 'Needs stronger examples.',
            'mentor_id' => $mentor->id,
            'next_improvement_plan' => 'Practice evidence mapping.',
            'schedule_id' => $session->id,
            'slug' => 'ielts-writing-alya-safira',
            'student_id' => $student->id,
            'subject_id' => $subject->id,
        ]);
        $attachment = MentorJournalAttachment::factory()->create([
            'mentor_journal_id' => $journal->id,
            'original_name' => 'Practice Sheet.pdf',
            'uploaded_by' => $mentor->id,
        ]);

        $this->assertSame(
            url("/journals/{$session->code}"),
            route('mentor.journals.show', $journal),
        );

        $this->actingAs($mentor)
            ->get(route('mentor.journals.show', $journal))
            ->assertOk()
            ->assertInertia(fn (Assert $page): Assert => $page
                ->component('mentor/journals/show')
                ->where('breadcrumbs.1.title', $session->code)
                ->where('journal.scheduleCode', $session->code)
                ->where('journal.student', 'Alya Safira')
                ->where('journal.subject', 'IELTS Writing')
                ->where('journal.sessionStartAt', $session->scheduled_at->toJSON())
                ->where('journal.sessionEndAt', $session->scheduled_at->copy()->addMinutes(90)->toJSON())
                ->where('journal.completedAt', $journal->created_at->toJSON())
                ->where('journal.achievement', 'Clearer paragraph flow.')
                ->where('journal.nextImprovementPlan', 'Practice evidence mapping.')
                ->where('journal.attachments.0.name', 'Practice Sheet.pdf')
                ->where('journal.attachments.0.url', route('mentor-journal-attachments.show', $attachment, absolute: false))
                ->missing('journal.note')
                ->missing('journal.duration')
            );
    }

    public function test_student_schedule_detail_payload_contains_journal_attachments(): void
    {
        $mentor = User::factory()->mentor()->create();
        $student = User::factory()->student()->create();
        $schedule = Schedule::factory()->create([
            'mentor_id' => $mentor->id,
            'status' => 'completed',
            'user_id' => $student->id,
        ]);
        $journal = MentorJournal::factory()->create([
            'mentor_id' => $mentor->id,
            'schedule_id' => $schedule->id,
            'student_id' => $student->id,
            'subject_id' => $schedule->subject_id,
        ]);
        $attachment = MentorJournalAttachment::factory()->create([
            'mentor_journal_id' => $journal->id,
            'original_name' => 'Session Summary.pdf',
            'uploaded_by' => $mentor->id,
        ]);

        $this->actingAs($student)
            ->get(route('mentor.schedules'))
            ->assertOk()
            ->assertInertia(fn (Assert $page): Assert => $page
                ->component('student/schedules/index')
                ->where('sessions.0.attachments.0.name', 'Session Summary.pdf')
                ->where('sessions.0.attachments.0.url', route('mentor-journal-attachments.show', $attachment, absolute: false))
            );
    }

    public function test_journal_attachment_access_is_limited_to_related_users_and_authorized_internal_users(): void
    {
        $mentor = User::factory()->mentor()->create();
        $student = User::factory()->student()->create();
        $admin = User::factory()->admin()->create();
        $unrelatedMentor = User::factory()->mentor()->create();
        $unrelatedStudent = User::factory()->student()->create();
        $schedule = Schedule::factory()->create([
            'mentor_id' => $mentor->id,
            'status' => 'completed',
            'user_id' => $student->id,
        ]);
        $journal = MentorJournal::factory()->create([
            'mentor_id' => $mentor->id,
            'schedule_id' => $schedule->id,
            'student_id' => $student->id,
            'subject_id' => $schedule->subject_id,
        ]);
        $attachment = MentorJournalAttachment::factory()->create([
            'mentor_journal_id' => $journal->id,
            'uploaded_by' => $mentor->id,
        ]);

        $this->mock(MentorJournalAttachmentStorage::class, function (MockInterface $mock): void {
            $mock->shouldReceive('temporaryUrl')
                ->times(3)
                ->andReturn('https://r2.example.test/temporary-file');
        });

        foreach ([$mentor, $student, $admin] as $authorizedUser) {
            $this->actingAs($authorizedUser)
                ->get(route('mentor-journal-attachments.show', $attachment))
                ->assertRedirect('https://r2.example.test/temporary-file');
        }

        foreach ([$unrelatedMentor, $unrelatedStudent] as $unauthorizedUser) {
            $this->actingAs($unauthorizedUser)
                ->get(route('mentor-journal-attachments.show', $attachment))
                ->assertNotFound();
        }
    }

    public function test_mentor_cannot_view_another_mentor_journal_detail(): void
    {
        $mentor = User::factory()->mentor()->create();
        $otherMentor = User::factory()->mentor()->create();
        $journal = MentorJournal::factory()->create([
            'mentor_id' => $otherMentor->id,
        ]);

        $this->actingAs($mentor)
            ->get(route('mentor.journals.show', $journal))
            ->assertNotFound();
    }

    public function test_students_cannot_visit_mentor_journal_page(): void
    {
        $student = User::factory()->student()->create();

        $this->actingAs($student)
            ->get(route('mentor.journals'))
            ->assertForbidden();
    }

    public function test_old_mentor_journal_url_redirects_to_short_url(): void
    {
        $mentor = User::factory()->mentor()->create();

        $this->actingAs($mentor)
            ->get('/mentor/journals')
            ->assertRedirect('/journals');
    }

    public function test_dashboard_shows_next_session_after_pending_session_is_completed(): void
    {
        $mentor = User::factory()->mentor()->create();
        $student = User::factory()->student()->create();
        $subject = Subject::factory()->create([
            'name' => 'Speaking',
        ]);
        $pendingSession = Schedule::factory()->create([
            'duration' => 60,
            'mentor_id' => $mentor->id,
            'scheduled_at' => now()->subMinutes(61),
            'status' => 'assigned',
            'subject_id' => $subject->id,
            'user_id' => $student->id,
        ]);
        Schedule::factory()->create([
            'mentor_id' => $mentor->id,
            'scheduled_at' => now()->addHour(),
            'status' => 'assigned',
            'subject_id' => $subject->id,
            'user_id' => $student->id,
        ]);

        $this->actingAs($mentor)
            ->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn (Assert $page): Assert => $page
                ->component('mentor/dashboard/index')
                ->where('pendingJournals.0.id', (string) $pendingSession->id)
                ->where('nextSessions.0.title', 'Speaking')
            );

        $this->actingAs($mentor)
            ->post(route('mentor.sessions.complete', $pendingSession), [
                'achievement' => 'Student completed speaking drill.',
                'improvement_area' => 'Needs clearer pacing.',
                'next_improvement_plan' => 'Practice two timed prompts.',
            ])
            ->assertRedirect();

        $this->actingAs($mentor)
            ->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn (Assert $page): Assert => $page
                ->component('mentor/dashboard/index')
                ->has('pendingJournals', 0)
                ->where('nextSessions.0.title', 'Speaking')
                ->where('nextSessions.0.improvementPlan', 'Practice two timed prompts.')
            );
    }
}
