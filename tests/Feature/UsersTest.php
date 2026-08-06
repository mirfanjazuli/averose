<?php

namespace Tests\Feature;

use App\Models\AcademicField;
use App\Models\MentorLevel;
use App\Models\Program;
use App\Models\ProgramVariant;
use App\Models\Schedule;
use App\Models\Subject;
use App\Models\TryOut;
use App\Models\User;
use App\UserRole;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

class UsersTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_to_the_login_page_from_students(): void
    {
        $response = $this->get(route('students'));

        $response->assertRedirect(route('login'));
    }

    public function test_admin_users_can_visit_the_students_page(): void
    {
        $user = User::factory()->admin()->create();

        $this->actingAs($user);

        $response = $this->get(route('students'));

        $response->assertOk();
    }

    public function test_guests_are_redirected_to_the_login_page_from_mentors(): void
    {
        $response = $this->get(route('mentors'));

        $response->assertRedirect(route('login'));
    }

    public function test_admin_users_can_visit_the_mentors_page(): void
    {
        $user = User::factory()->admin()->create();

        $this->actingAs($user);

        $response = $this->get(route('mentors'));

        $response->assertOk();
    }

    public function test_admin_can_create_student_with_generated_profile_fields(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin)
            ->post(route('students.store'), [
                'name' => 'Alya Prameswari',
                'email' => 'alya@example.com',
            ]);

        $student = User::query()->where('email', 'alya@example.com')->firstOrFail();

        $response
            ->assertRedirect(route('students.show', $student))
            ->assertSessionHas('success', 'Student added.');

        $this->assertSame(UserRole::Student, $student->role);
        $this->assertSame('Alya', $student->nickname);
        $this->assertSame('alya-prameswari', $student->slug);
        $this->assertSame('active', $student->status);
        $this->assertNotNull($student->studentProfile);
        $this->assertTrue(Hash::check('averose123', $student->password));
    }

    public function test_admin_can_create_student_with_initial_program_and_try_out_access(): void
    {
        $admin = User::factory()->admin()->create();
        $field = AcademicField::factory()->create();
        $secondField = AcademicField::factory()->create();
        $program = Program::factory()->create([
            'max_reschedule' => 2,
        ]);
        $variant = ProgramVariant::factory()->create([
            'field_id' => $field->id,
            'session' => 8,
        ]);
        $secondVariant = ProgramVariant::factory()->create([
            'field_id' => $secondField->id,
            'session' => 6,
        ]);
        $tryOut = TryOut::factory()->create([
            'status' => 'private',
        ]);
        $secondTryOut = TryOut::factory()->create([
            'status' => 'private',
        ]);

        $program->fields()->attach($field);
        $program->fields()->attach($secondField);
        $program->variants()->attach($variant);
        $program->variants()->attach($secondVariant);

        $response = $this->actingAs($admin)
            ->post(route('students.store'), [
                'add_program_access' => '1',
                'add_try_out_access' => '1',
                'email' => 'student.access@example.com',
                'enrollments' => [
                    [
                        'field_id' => $field->id,
                        'program_id' => $program->id,
                        'program_variant_id' => $variant->id,
                        'start_date' => '2026-08-01',
                    ],
                    [
                        'field_id' => $secondField->id,
                        'program_id' => $program->id,
                        'program_variant_id' => $secondVariant->id,
                        'start_date' => '2026-08-02',
                    ],
                ],
                'name' => 'Student Access',
                'try_out_accesses' => [
                    [
                        'attempt_quota' => 2,
                        'available_from' => '2026-08-01',
                        'available_until' => '2026-08-31',
                        'try_out_id' => $tryOut->id,
                    ],
                    [
                        'attempt_quota' => 1,
                        'available_from' => '2026-09-01',
                        'available_until' => '2026-09-30',
                        'try_out_id' => $secondTryOut->id,
                    ],
                ],
            ]);

        $student = User::query()->where('email', 'student.access@example.com')->firstOrFail();

        $response->assertRedirect(route('students.show', $student));

        $this->assertDatabaseHas('program_enrollments', [
            'field_id' => $field->id,
            'program_id' => $program->id,
            'program_variant_id' => $variant->id,
            'start_date' => '2026-08-01 00:00:00',
            'status' => 'active',
            'user_id' => $student->id,
        ]);
        $this->assertDatabaseHas('program_enrollments', [
            'field_id' => $secondField->id,
            'program_id' => $program->id,
            'program_variant_id' => $secondVariant->id,
            'start_date' => '2026-08-02 00:00:00',
            'status' => 'active',
            'user_id' => $student->id,
        ]);
        $this->assertDatabaseHas('try_out_accesses', [
            'attempt_quota' => 2,
            'available_from' => '2026-08-01 00:00:00',
            'available_until' => '2026-08-31 00:00:00',
            'status' => 'active',
            'try_out_id' => $tryOut->id,
            'user_id' => $student->id,
        ]);
        $this->assertDatabaseHas('try_out_accesses', [
            'attempt_quota' => 1,
            'available_from' => '2026-09-01 00:00:00',
            'available_until' => '2026-09-30 00:00:00',
            'status' => 'active',
            'try_out_id' => $secondTryOut->id,
            'user_id' => $student->id,
        ]);
    }

    public function test_admin_can_view_student_detail(): void
    {
        $admin = User::factory()->admin()->create();
        $field = AcademicField::factory()->create([
            'name' => 'Design',
        ]);
        $program = Program::factory()->create([
            'name' => 'UI Design',
            'max_reschedule' => 2,
        ]);
        $variant = ProgramVariant::factory()->create([
            'field_id' => $field->id,
            'name' => '6 x 90 Minutes',
            'session' => 6,
        ]);
        $subject = Subject::factory()->create([
            'name' => 'Design Critique',
        ]);
        $student = User::factory()->create([
            'name' => 'Alya Prameswari',
            'email' => 'alya.detail@example.com',
            'role' => UserRole::Student,
        ]);

        $program->fields()->attach($field);
        $program->variants()->attach($variant);
        $enrollment = $student->programEnrollments()->create([
            'program_id' => $program->id,
            'field_id' => $field->id,
            'program_variant_id' => $variant->id,
            'start_date' => '2026-07-01',
            'max_reschedule' => 4,
            'sessions_used' => 6,
            'status' => 'active',
        ]);
        Schedule::factory()->create([
            'program_enrollment_id' => $enrollment->id,
            'scheduled_at' => '2026-08-01 09:00:00',
            'status' => 'completed',
            'subject_id' => $subject->id,
            'user_id' => $student->id,
        ]);

        $this->actingAs($admin)
            ->get(route('students.show', $student))
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page): AssertableInertia => $page
                ->component('admin/users/students/show')
                ->where('user.name', 'Alya Prameswari')
                ->where('user.nickname', 'Alya')
                ->where('programOptions.0.label', 'UI Design')
                ->where('programOptions.0.fields.0.label', 'Design')
                ->where('programOptions.0.variants.0.label', '6 x 90 Minutes')
                ->where('enrollments.0.program', 'UI Design')
                ->where('enrollments.0.maxReschedule', 4)
                ->where('enrollments.0.sessionsRemaining', 0)
                ->where('enrollments.0.lastSessionDate', '2026-08-01T09:00:00.000000Z')
            );
    }

    public function test_admin_can_enroll_student_to_program(): void
    {
        $admin = User::factory()->admin()->create();
        $student = User::factory()->create([
            'role' => UserRole::Student,
        ]);
        $field = AcademicField::factory()->create();
        $program = Program::factory()->create();
        $variant = ProgramVariant::factory()->create([
            'field_id' => $field->id,
        ]);

        $program->fields()->attach($field);
        $program->variants()->attach($variant);

        $this->actingAs($admin)
            ->post(route('students.enrollments.store', $student), [
                'program_id' => $program->id,
                'field_id' => $field->id,
                'program_variant_id' => $variant->id,
                'start_date' => '2026-07-01',
                'max_reschedule' => 5,
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('program_enrollments', [
            'user_id' => $student->id,
            'program_id' => $program->id,
            'field_id' => $field->id,
            'program_variant_id' => $variant->id,
            'start_date' => '2026-07-01 00:00:00',
            'max_reschedule' => 5,
        ]);
    }

    public function test_admin_can_create_update_and_deactivate_mentor(): void
    {
        $admin = User::factory()->admin()->create();
        $middle = MentorLevel::query()->where('slug', 'middle')->firstOrFail();
        $senior = MentorLevel::query()->where('slug', 'senior')->firstOrFail();
        $biology = Subject::factory()->create(['name' => 'Biology']);
        $chemistry = Subject::factory()->create(['name' => 'Chemistry']);

        $this->actingAs($admin)
            ->post(route('mentors.store'), [
                'name' => 'Megan Norton',
                'email' => 'megan@example.com',
                'expertise' => [$biology->id],
                'mentor_level_id' => $middle->id,
            ])
            ->assertRedirect();

        $mentor = User::query()->where('email', 'megan@example.com')->firstOrFail();

        $this->assertSame(UserRole::Mentor, $mentor->role);
        $this->assertSame('Megan', $mentor->nickname);
        $this->assertSame($middle->id, $mentor->mentorProfile?->mentor_level_id);
        $this->assertSame([(string) $biology->id], $mentor->mentorProfile?->expertise);

        $this->actingAs($admin)
            ->put(route('users.update', $mentor), [
                'name' => 'Megan Rivera',
                'email' => 'megan.rivera@example.com',
                'expertise' => [$biology->id, $chemistry->id],
                'mentor_level_id' => $senior->id,
            ])
            ->assertRedirect();

        $mentor->refresh();

        $this->assertSame('Megan', $mentor->nickname);
        $this->assertSame('megan-rivera', $mentor->slug);
        $this->assertSame($senior->id, $mentor->mentorProfile?->mentor_level_id);
        $this->assertSame([(string) $biology->id, (string) $chemistry->id], $mentor->mentorProfile?->expertise);

        $this->actingAs($admin)
            ->delete(route('users.destroy', $mentor))
            ->assertRedirect();

        $this->assertDatabaseHas('users', [
            'id' => $mentor->id,
            'status' => 'inactive',
        ]);
    }

    public function test_internal_user_create_generates_internal_profile(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)
            ->post(route('internal.store'), [
                'email' => 'operator@example.com',
                'name' => 'Operator AveRose',
            ])
            ->assertRedirect();

        $internal = User::query()->where('email', 'operator@example.com')->firstOrFail();

        $this->assertNotNull($internal->internalProfile);
    }

    public function test_admin_can_view_mentor_detail(): void
    {
        $admin = User::factory()->admin()->create();
        $student = User::factory()->student()->create([
            'name' => 'Alya Prameswari',
        ]);
        $mentor = User::factory()->create([
            'name' => 'Megan Norton',
            'email' => 'megan.detail@example.com',
            'role' => UserRole::Mentor,
        ]);
        $level = MentorLevel::query()->where('slug', 'senior')->firstOrFail();
        $expertise = Subject::factory()->create([
            'name' => 'Biology',
        ]);
        $mentor->mentorProfile()->updateOrCreate([], [
            'expertise' => [(string) $expertise->id],
            'mentor_level_id' => $level->id,
        ]);
        $subject = Subject::factory()->create([
            'name' => 'Speaking Review',
        ]);
        Schedule::factory()->create([
            'duration' => 90,
            'mentor_id' => $mentor->id,
            'scheduled_at' => '2026-08-01 09:00:00',
            'status' => 'completed',
            'subject_id' => $subject->id,
            'user_id' => $student->id,
        ]);

        $this->actingAs($admin)
            ->get(route('mentors.show', $mentor))
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page): AssertableInertia => $page
                ->component('admin/users/mentors/show')
                ->where('user.name', 'Megan Norton')
                ->where('user.nickname', 'Megan')
                ->where('expertiseSubjects.0.name', 'Biology')
                ->where('resolvedMentorLevel.name', 'Senior')
                ->where('teachingJournals.0.subject', 'Speaking Review')
                ->where('teachingJournals.0.student', 'Alya Prameswari')
                ->where('teachingJournals.0.duration', '90 minutes')
            );
    }
}
