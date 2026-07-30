<?php

namespace Tests\Feature;

use App\Models\RescheduleRequest;
use App\Models\Schedule;
use App\Models\User;
use App\Models\ZoomAccount;
use App\Notifications\ScheduleNotification;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class NotificationsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config(['services.zoom.create_real_meetings' => false]);
    }

    public function test_mentor_and_student_receive_their_notification_page(): void
    {
        $mentor = User::factory()->mentor()->create();
        $student = User::factory()->student()->create();

        $this->actingAs($mentor)
            ->get(route('notifications.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page): Assert => $page
                ->component('mentor/notifications/index')
                ->where('filter', 'all')
            );

        $this->actingAs($student)
            ->get(route('notifications.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page): Assert => $page
                ->component('student/notifications/index')
                ->where('filter', 'all')
            );
    }

    public function test_notification_feed_is_limited_and_history_is_paginated(): void
    {
        $student = User::factory()->student()->create();

        foreach (range(1, 11) as $number) {
            $student->notify($this->notification($number));
        }

        $this->actingAs($student)
            ->getJson(route('notifications.feed'))
            ->assertOk()
            ->assertJsonCount(5, 'items')
            ->assertJsonPath('unreadCount', 11);

        $this->actingAs($student)
            ->get(route('notifications.index', ['filter' => 'unread']))
            ->assertOk()
            ->assertInertia(fn (Assert $page): Assert => $page
                ->where('filter', 'unread')
                ->has('notifications.data', 10)
                ->where('notifications.last_page', 2)
                ->where('notifications.total', 11)
            );
    }

    public function test_user_can_read_only_their_own_notification(): void
    {
        $student = User::factory()->student()->create();
        $otherStudent = User::factory()->student()->create();
        $student->notify($this->notification());
        $notification = $student->notifications()->firstOrFail();

        $this->actingAs($otherStudent)
            ->post(route('notifications.read', $notification->id))
            ->assertNotFound();

        $this->actingAs($student)
            ->post(route('notifications.read', $notification->id))
            ->assertRedirect('/schedules');

        $this->assertNotNull($notification->fresh()->read_at);
    }

    public function test_student_can_mark_all_notifications_as_read(): void
    {
        $student = User::factory()->student()->create();
        $student->notify($this->notification(1));
        $student->notify($this->notification(2));

        $this->actingAs($student)
            ->post(route('notifications.read-all'))
            ->assertRedirect();

        $this->assertSame(0, $student->unreadNotifications()->count());
    }

    public function test_assignment_notifies_student_and_new_mentor(): void
    {
        Notification::fake();

        $admin = User::factory()->admin()->create();
        $mentor = User::factory()->mentor()->create();
        $student = User::factory()->student()->create();
        ZoomAccount::factory()->create();
        $schedule = Schedule::factory()->create([
            'user_id' => $student->id,
        ]);

        $this->actingAs($admin)
            ->put(route('schedules.assignment.update', $schedule), [
                'mentor_id' => $mentor->id,
            ])
            ->assertRedirect();

        Notification::assertSentTo(
            $mentor,
            ScheduleNotification::class,
            fn (ScheduleNotification $notification): bool => $notification->event === 'schedule_assigned'
                && $notification->url === "/schedules/{$schedule->id}",
        );
        Notification::assertSentTo(
            $student,
            ScheduleNotification::class,
            fn (ScheduleNotification $notification): bool => $notification->event === 'mentor_assigned'
                && $notification->url === '/schedules',
        );
    }

    public function test_reschedule_request_and_approval_notify_the_relevant_users(): void
    {
        Notification::fake();
        CarbonImmutable::setTestNow('2026-07-01 09:00:00');

        $admin = User::factory()->admin()->create();
        $mentor = User::factory()->mentor()->create();
        $student = User::factory()->student()->create();
        $schedule = Schedule::factory()->create([
            'mentor_id' => $mentor->id,
            'scheduled_at' => '2026-07-10 09:00:00',
            'status' => 'assigned',
            'user_id' => $student->id,
            'zoom_account_id' => ZoomAccount::factory()->create()->id,
        ]);

        $this->actingAs($student)
            ->post(route('reschedule-requests.store', $schedule), [
                'notes' => 'Ada ujian sekolah.',
                'reason' => 'Bentrok sekolah/kampus',
                'requested_scheduled_at' => '2026-07-11 10:00:00',
            ])
            ->assertRedirect();

        $rescheduleRequest = RescheduleRequest::query()->firstOrFail();

        $this->actingAs($admin)
            ->put(route('schedules.reschedule-requests.approve', $rescheduleRequest))
            ->assertRedirect();

        Notification::assertSentTo(
            $mentor,
            ScheduleNotification::class,
            fn (ScheduleNotification $notification): bool => $notification->event === 'reschedule_requested',
        );
        Notification::assertSentTo(
            $student,
            ScheduleNotification::class,
            fn (ScheduleNotification $notification): bool => $notification->event === 'reschedule_approved',
        );

        CarbonImmutable::setTestNow();
    }

    public function test_rejected_reschedule_notifies_student_with_reason_but_keeps_it_from_mentor(): void
    {
        Notification::fake();

        $admin = User::factory()->admin()->create();
        $mentor = User::factory()->mentor()->create();
        $student = User::factory()->student()->create();
        $schedule = Schedule::factory()->create([
            'mentor_id' => $mentor->id,
            'status' => 'assigned',
            'user_id' => $student->id,
        ]);
        $rescheduleRequest = RescheduleRequest::factory()->create([
            'mentor_id' => $mentor->id,
            'schedule_id' => $schedule->id,
            'status' => 'pending',
            'user_id' => $student->id,
        ]);

        $this->actingAs($admin)
            ->put(route('schedules.reschedule-requests.reject', $rescheduleRequest), [
                'admin_note' => 'Catatan internal admin.',
            ])
            ->assertRedirect();

        Notification::assertSentTo(
            $student,
            ScheduleNotification::class,
            fn (ScheduleNotification $notification): bool => $notification->event === 'reschedule_rejected'
                && str_contains($notification->message, 'Catatan internal admin.'),
        );
        Notification::assertSentTo(
            $mentor,
            ScheduleNotification::class,
            fn (ScheduleNotification $notification): bool => $notification->event === 'reschedule_rejected'
                && ! str_contains($notification->message, 'Catatan internal admin.'),
        );
    }

    public function test_rejected_reschedule_requires_a_reason(): void
    {
        Notification::fake();

        $admin = User::factory()->admin()->create();
        $mentor = User::factory()->mentor()->create();
        $schedule = Schedule::factory()->create([
            'mentor_id' => $mentor->id,
            'status' => 'assigned',
        ]);
        $rescheduleRequest = RescheduleRequest::factory()->create([
            'mentor_id' => $mentor->id,
            'schedule_id' => $schedule->id,
            'status' => 'pending',
            'user_id' => $schedule->user_id,
        ]);

        $this->actingAs($admin)
            ->put(route('schedules.reschedule-requests.reject', $rescheduleRequest))
            ->assertSessionHasErrors('admin_note');

        $this->assertSame('pending', $rescheduleRequest->fresh()->status);
        Notification::assertNothingSent();
    }

    private function notification(int $number = 1): ScheduleNotification
    {
        return new ScheduleNotification(
            event: 'mentor_assigned',
            title: 'Mentor sudah ditetapkan',
            message: 'Mentor untuk jadwalmu sudah tersedia.',
            scheduleCode: sprintf('SCH-2026-%06d', $number),
            url: '/schedules',
        );
    }
}
