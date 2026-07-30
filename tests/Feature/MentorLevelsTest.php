<?php

namespace Tests\Feature;

use App\Models\MentorLevel;
use App\Models\User;
use App\UserRole;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class MentorLevelsTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_view_create_update_and_deactivate_mentor_levels(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)
            ->get(route('mentor-levels'))
            ->assertOk()
            ->assertInertia(fn (Assert $page): Assert => $page
                ->component('admin/users/mentor-levels/index')
                ->has('levels', 3)
            );

        $this->actingAs($admin)
            ->post(route('mentor-levels.store'), [
                'hourly_rate' => 175000,
                'name' => 'Expert',
            ])
            ->assertRedirect();

        $expert = MentorLevel::query()->where('slug', 'expert')->firstOrFail();

        $this->assertFalse($expert->is_default);

        $this->actingAs($admin)
            ->put(route('mentor-levels.update', $expert), [
                'hourly_rate' => 200000,
                'name' => 'Expert Plus',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('mentor_levels', [
            'id' => $expert->id,
            'hourly_rate' => 200000,
            'is_default' => false,
            'name' => 'Expert Plus',
        ]);

        $this->actingAs($admin)
            ->delete(route('mentor-levels.destroy', $expert))
            ->assertRedirect();

        $this->assertDatabaseHas('mentor_levels', [
            'id' => $expert->id,
            'status' => 'inactive',
        ]);
    }

    public function test_default_level_payload_is_ignored(): void
    {
        $admin = User::factory()->admin()->create();
        $senior = MentorLevel::query()->where('slug', 'senior')->firstOrFail();

        $this->actingAs($admin)
            ->put(route('mentor-levels.update', $senior), [
                'hourly_rate' => 0,
                'is_default' => '1',
                'name' => 'Senior',
            ])
            ->assertRedirect();

        $this->assertFalse($senior->refresh()->is_default);
    }

    public function test_mentor_requires_a_level_when_created(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)
            ->post(route('mentors.store'), [
                'email' => 'mentor-without-level@example.com',
                'name' => 'Mentor Without Level',
            ])
            ->assertSessionHasErrors('mentor_level_id');

        $this->assertDatabaseMissing('users', [
            'email' => 'mentor-without-level@example.com',
        ]);
    }

    public function test_mentor_create_update_and_detail_use_mentor_level(): void
    {
        $admin = User::factory()->admin()->create();
        $middle = MentorLevel::query()->where('slug', 'middle')->firstOrFail();
        $senior = MentorLevel::query()->where('slug', 'senior')->firstOrFail();

        $this->actingAs($admin)
            ->post(route('mentors.store'), [
                'email' => 'mentor-level@example.com',
                'mentor_level_id' => $middle->id,
                'name' => 'Mentor Level',
            ])
            ->assertRedirect();

        $mentor = User::query()->where('email', 'mentor-level@example.com')->firstOrFail();

        $this->assertSame($middle->id, $mentor->mentorProfile?->mentor_level_id);

        $this->actingAs($admin)
            ->put(route('users.update', $mentor), [
                'email' => 'mentor-level@example.com',
                'mentor_level_id' => $senior->id,
                'name' => 'Mentor Level',
            ])
            ->assertRedirect();

        $this->assertSame($senior->id, $mentor->refresh()->mentorProfile?->mentor_level_id);

        $this->actingAs($admin)
            ->get(route('mentors.show', $mentor))
            ->assertOk()
            ->assertInertia(fn (Assert $page): Assert => $page
                ->component('admin/users/mentors/show')
                ->where('resolvedMentorLevel.name', 'Senior')
            );
    }

    public function test_admin_can_view_mentor_level_detail_with_assigned_mentors(): void
    {
        $admin = User::factory()->admin()->create();
        $senior = MentorLevel::query()->where('slug', 'senior')->firstOrFail();
        $mentor = User::factory()->create([
            'email' => 'senior.mentor@example.com',
            'name' => 'Senior Mentor',
            'role' => UserRole::Mentor,
        ]);
        $mentor->mentorProfile()->updateOrCreate([], [
            'mentor_level_id' => $senior->id,
        ]);

        $this->actingAs($admin)
            ->get(route('mentor-levels.show', $senior))
            ->assertOk()
            ->assertInertia(fn (Assert $page): Assert => $page
                ->component('admin/users/mentor-levels/show')
                ->where('level.name', 'Senior')
                ->where('level.mentorsCount', 1)
                ->where('mentors.0.name', 'Senior Mentor')
                ->where('mentors.0.email', 'senior.mentor@example.com')
            );
    }

    public function test_mentor_without_level_does_not_resolve_to_default_level(): void
    {
        $mentor = User::factory()->create([
            'role' => UserRole::Mentor,
        ]);

        $this->assertNull($mentor->resolvedMentorLevel());
    }

    public function test_inactive_levels_are_not_sent_to_mentor_form_options(): void
    {
        $admin = User::factory()->admin()->create();
        $inactiveLevel = MentorLevel::factory()->inactive()->create([
            'name' => 'Archived Level',
        ]);

        $this->actingAs($admin)
            ->get(route('mentors'))
            ->assertOk()
            ->assertInertia(fn (Assert $page): Assert => $page
                ->where('mentorLevelOptions', fn ($levels): bool => collect($levels)
                    ->doesntContain('id', (string) $inactiveLevel->id))
            );
    }
}
