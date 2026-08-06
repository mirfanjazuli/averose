<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreProgramEnrollmentRequest;
use App\Models\MentorLevel;
use App\Models\Program;
use App\Models\ProgramEnrollment;
use App\Models\Role;
use App\Models\Subject;
use App\Models\TryOut;
use App\Models\TryOutAccess;
use App\Models\User;
use App\UserRole;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class UserManagementController extends Controller
{
    public function internal(): Response
    {
        return $this->index(UserRole::Admin, 'admin/users/internal/index', [
            'roleOptions' => $this->roleOptions(),
        ]);
    }

    public function students(): Response
    {
        return $this->index(UserRole::Student, 'admin/users/students/index', [
            'programOptions' => $this->programEnrollmentOptions(),
        ]);
    }

    public function mentors(): Response
    {
        return $this->index(UserRole::Mentor, 'admin/users/mentors/index', [
            'mentorLevelOptions' => $this->mentorLevelOptions(),
            'subjectOptions' => $this->subjectOptions(),
        ]);
    }

    public function showStudent(User $user): Response
    {
        abort_unless($user->isStudent(), 404);

        $user->load([
            'programEnrollments.schedules:id,program_enrollment_id,scheduled_at,status',
            'programEnrollments.field:id,name',
            'programEnrollments.program:id,name,max_reschedule',
            'programEnrollments.variant:id,name,session,duration,price',
            'tryOutAccesses.tryOut:id,title,slug,status',
        ]);

        return $this->show($user, 'admin/users/students/show', 'Students', route('students'), [
            'enrollments' => $user->programEnrollments
                ->sortByDesc('created_at')
                ->values()
                ->map(fn (ProgramEnrollment $enrollment): array => [
                    'id' => $enrollment->id,
                    'program' => $enrollment->programNameAtEnrollment(),
                    'field' => $enrollment->fieldNameAtEnrollment(),
                    'variant' => $enrollment->variantNameAtEnrollment(),
                    'startDate' => $enrollment->start_date?->format('M d, Y'),
                    'sessionsRemaining' => $enrollment->sessionsRemaining(),
                    'lastSessionDate' => $this->lastCompletedEnrollmentSessionDate($enrollment),
                    'maxReschedule' => $enrollment->max_reschedule ?? $enrollment->program?->max_reschedule,
                    'isMaxRescheduleOverwritten' => filled($enrollment->max_reschedule),
                    'status' => $enrollment->status,
                ]),
            'programOptions' => $this->programEnrollmentOptions(),
            'tryOutAccesses' => $user->tryOutAccesses
                ->sortByDesc('created_at')
                ->values()
                ->map(fn (TryOutAccess $access): array => [
                    'attemptQuota' => $access->attempt_quota,
                    'attemptsUsed' => $access->attempts_used,
                    'availableFrom' => $access->available_from->format('M d, Y'),
                    'availableUntil' => $access->available_until->format('M d, Y'),
                    'id' => $access->id,
                    'remainingAttempts' => $access->remainingAttempts(),
                    'status' => $this->tryOutAccessStatus($access),
                    'statusValue' => $access->status,
                    'tryOut' => [
                        'slug' => $access->tryOut->slug,
                        'title' => $access->tryOut->title,
                    ],
                ]),
            'tryOutOptions' => $this->tryOutAccessOptions(),
        ]);
    }

    public function showMentor(User $user): Response
    {
        abort_unless($user->isMentor(), 404);
        $user->loadMissing('mentorProfile.mentorLevel');

        return $this->show($user, 'admin/users/mentors/show', 'Mentors', route('mentors'), [
            'expertiseSubjects' => $this->mentorExpertiseSubjects($user),
            'resolvedMentorLevel' => $this->serializeMentorLevel($this->resolvedMentorLevel($user)),
            'teachingJournals' => $this->teachingJournals($user),
        ]);
    }

    public function storeStudent(Request $request): RedirectResponse
    {
        return $this->store($request, UserRole::Student);
    }

    public function storeMentor(Request $request): RedirectResponse
    {
        return $this->store($request, UserRole::Mentor);
    }

    public function storeInternal(Request $request): RedirectResponse
    {
        return $this->store($request, UserRole::Admin);
    }

    public function storeStudentEnrollment(StoreProgramEnrollmentRequest $request, User $user): RedirectResponse
    {
        abort_unless($user->isStudent(), 404);
        abort_unless($request->user()?->hasPermission('students.manage_enrollments'), 403);

        $user->programEnrollments()->create($request->validated());

        return back();
    }

    public function storeStudentTryOutAccess(Request $request, User $user): RedirectResponse
    {
        abort_unless($user->isStudent(), 404);
        abort_unless($request->user()?->hasPermission('students.manage_try_out_access'), 403);

        $validated = $request->validate([
            'attempt_quota' => ['required', 'integer', 'min:1', 'max:1000'],
            'available_from' => ['required', 'date'],
            'available_until' => ['required', 'date', 'after_or_equal:available_from'],
            'status' => ['required', Rule::in(['active', 'inactive'])],
            'try_out_id' => ['required', Rule::exists('try_outs', 'id')->where('status', 'private')],
        ]);

        $user->tryOutAccesses()->create($validated);

        return back()->with('success', 'Try out access added successfully.');
    }

    public function destroyStudentTryOutAccess(User $user, TryOutAccess $tryOutAccess): RedirectResponse
    {
        abort_unless($user->isStudent(), 404);
        abort_unless(request()->user()?->hasPermission('students.manage_try_out_access'), 403);
        abort_unless($tryOutAccess->user_id === $user->id, 404);

        $tryOutAccess->update(['status' => 'inactive']);

        return back()->with('success', 'Try out access removed successfully.');
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        abort_unless($request->user()?->hasPermission($this->userPermissionKey($user, 'update')), 403);
        $user->loadMissing('mentorProfile');

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user)],
            'mentor_level_id' => [
                $user->isMentor() ? 'required' : 'nullable',
                Rule::exists('mentor_levels', 'id')->where(fn ($query) => $query
                    ->where('status', 'active')
                    ->when($user->mentorProfile?->mentor_level_id, fn ($query) => $query->orWhere('id', $user->mentorProfile?->mentor_level_id))),
            ],
            'expertise' => ['nullable', 'array'],
            'expertise.*' => ['nullable', Rule::exists('subjects', 'id')->where('status', 'active')],
            'role_id' => ['nullable', Rule::exists('roles', 'id')->where('status', 'active')],
        ]);

        $user->update([
            'email' => $validated['email'],
            'name' => $validated['name'],
            'role_id' => $user->isAdmin() ? (($validated['role_id'] ?? null) ?: null) : null,
        ]);

        $this->syncRoleProfile($user, $validated);

        return back();
    }

    public function destroy(User $user): RedirectResponse
    {
        abort_unless(request()->user()?->hasPermission($this->userPermissionKey($user, 'delete')), 403);
        abort_if(request()->user()?->is($user), 422, 'You cannot deactivate your own account.');

        $user->update(['status' => 'inactive']);

        return back();
    }

    private function index(UserRole $role, string $component, array $props = []): Response
    {
        return Inertia::render($component, [
            'users' => User::query()
                ->with(['internalRole:id,name', 'mentorProfile.mentorLevel:id,name,hourly_rate,status'])
                ->where('role', $role)
                ->latest()
                ->get(['id', 'name', 'nickname', 'slug', 'email', 'role', 'role_id', 'status', 'created_at'])
                ->map(fn (User $user): array => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'nickname' => $user->nickname,
                    'slug' => $user->slug,
                    'email' => $user->email,
                    'expertise' => $this->serializeMentorExpertise($user),
                    'internalRole' => $user->internalRole?->name,
                    'mentorLevel' => $this->serializeMentorLevel($this->resolvedMentorLevel($user)),
                    'mentorLevelId' => $user->mentorProfile?->mentor_level_id,
                    'roleId' => $user->role_id,
                    'status' => $user->status,
                    'createdAt' => $user->created_at?->toJSON(),
                ]),
            ...$props,
        ]);
    }

    private function store(Request $request, UserRole $role): RedirectResponse
    {
        $validated = $request->validate([
            'add_program_access' => ['nullable', 'boolean'],
            'add_try_out_access' => ['nullable', 'boolean'],
            'attempt_quota' => ['nullable', 'integer', 'min:1', 'max:1000'],
            'available_from' => ['nullable', 'date'],
            'available_until' => ['nullable', 'date', 'after_or_equal:available_from'],
            'enrollments' => ['nullable', 'array'],
            'enrollments.*' => ['array'],
            'enrollments.*.field_id' => ['nullable', 'integer', 'exists:fields,id'],
            'enrollments.*.max_reschedule' => ['nullable', 'integer', 'min:0', 'max:255'],
            'enrollments.*.program_id' => ['nullable', 'integer', 'exists:programs,id'],
            'enrollments.*.program_variant_id' => ['nullable', 'integer', 'exists:program_variants,id'],
            'enrollments.*.start_date' => ['nullable', 'date'],
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')],
            'field_id' => ['nullable', 'integer', 'exists:fields,id'],
            'max_reschedule' => ['nullable', 'integer', 'min:0', 'max:255'],
            'mentor_level_id' => [
                $role === UserRole::Mentor ? 'required' : 'nullable',
                Rule::exists('mentor_levels', 'id')->where('status', 'active'),
            ],
            'expertise' => ['nullable', 'array'],
            'expertise.*' => ['nullable', Rule::exists('subjects', 'id')->where('status', 'active')],
            'program_id' => ['nullable', 'integer', 'exists:programs,id'],
            'program_variant_id' => ['nullable', 'integer', 'exists:program_variants,id'],
            'role_id' => ['nullable', Rule::exists('roles', 'id')->where('status', 'active')],
            'start_date' => ['nullable', 'date'],
            'status' => ['nullable', Rule::in(['active', 'inactive'])],
            'try_out_accesses' => ['nullable', 'array'],
            'try_out_accesses.*' => ['array'],
            'try_out_accesses.*.attempt_quota' => ['nullable', 'integer', 'min:1', 'max:1000'],
            'try_out_accesses.*.available_from' => ['nullable', 'date'],
            'try_out_accesses.*.available_until' => ['nullable', 'date'],
            'try_out_accesses.*.try_out_id' => ['nullable', Rule::exists('try_outs', 'id')->where('status', 'private')],
            'try_out_id' => ['nullable', Rule::exists('try_outs', 'id')->where('status', 'private')],
        ]);

        $this->validateStudentAccessData($role, $validated);

        $user = DB::transaction(function () use ($role, $validated): User {
            $user = User::query()->create([
                'email' => $validated['email'],
                'name' => $validated['name'],
                'password' => 'averose123',
                'role' => $role,
                'role_id' => $role === UserRole::Admin ? (($validated['role_id'] ?? null) ?: null) : null,
                'status' => 'active',
            ]);

            $this->syncRoleProfile($user, $validated);
            $this->syncInitialStudentAccess($user, $validated);

            return $user;
        });

        if ($role === UserRole::Student) {
            return to_route('students.show', $user)->with('success', 'Student added.');
        }

        return back();
    }

    private function show(User $user, string $component, string $sectionTitle, string $sectionHref, array $props = []): Response
    {
        return Inertia::render($component, [
            'breadcrumbs' => [
                [
                    'title' => 'Users',
                    'href' => route('students'),
                ],
                [
                    'title' => $sectionTitle,
                    'href' => $sectionHref,
                ],
                [
                    'title' => $user->name,
                    'href' => $sectionHref.'/'.$user->slug,
                ],
            ],
            'user' => $this->serializeUser($user),
            ...$props,
        ]);
    }

    private function lastCompletedEnrollmentSessionDate(ProgramEnrollment $enrollment): ?string
    {
        if ($enrollment->sessionsRemaining() > 0) {
            return null;
        }

        return $enrollment->schedules
            ->where('status', 'completed')
            ->sortByDesc('scheduled_at')
            ->first()
            ?->scheduled_at
            ?->toJSON();
    }

    private function teachingJournals(User $mentor): array
    {
        return $mentor->mentorSchedules()
            ->with(['subject:id,name', 'user:id,name', 'enrollment.program:id,name'])
            ->latest('scheduled_at')
            ->limit(10)
            ->get()
            ->map(function ($booking): array {
                return [
                    'endAt' => $booking->scheduled_at->copy()->addMinutes($booking->duration)->toJSON(),
                    'id' => (string) $booking->id,
                    'duration' => "{$booking->duration} minutes",
                    'program' => $booking->enrollment?->program?->name ?? '-',
                    'status' => $booking->status,
                    'student' => $booking->user?->name ?? '-',
                    'startAt' => $booking->scheduled_at->toJSON(),
                    'subject' => $booking->subject?->name ?? 'Session',
                ];
            })
            ->all();
    }

    /**
     * @return array{id: int, name: string, nickname: string|null, slug: string, email: string, status: string, createdAt: string|null, updatedAt: string|null}
     */
    private function serializeUser(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'nickname' => $user->nickname,
            'slug' => $user->slug,
            'email' => $user->email,
            'expertise' => $this->serializeMentorExpertise($user),
            'mentorLevel' => $this->serializeMentorLevel($user->resolvedMentorLevel()),
            'mentorLevelId' => $user->mentorProfile?->mentor_level_id,
            'roleId' => $user->role_id,
            'status' => $user->status,
            'createdAt' => $user->created_at?->toJSON(),
            'updatedAt' => $user->updated_at?->toJSON(),
        ];
    }

    private function userPermissionKey(User $user, string $action): string
    {
        return match ($user->role) {
            UserRole::Admin => "internal.{$action}",
            UserRole::Mentor => "mentors.{$action}",
            UserRole::Student => "students.{$action}",
        };
    }

    private function roleOptions(): array
    {
        return Role::query()
            ->where('status', 'active')
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn (Role $role): array => [
                'id' => (string) $role->id,
                'label' => $role->name,
            ])
            ->all();
    }

    private function mentorLevelOptions(): array
    {
        return MentorLevel::query()
            ->where('status', 'active')
            ->orderBy('name')
            ->get(['id', 'name', 'hourly_rate'])
            ->map(fn (MentorLevel $level): array => [
                'hourlyRate' => $level->hourly_rate,
                'id' => (string) $level->id,
                'label' => $level->name,
            ])
            ->all();
    }

    private function subjectOptions(): array
    {
        return Subject::query()
            ->where('status', 'active')
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn (Subject $subject): array => [
                'id' => (string) $subject->id,
                'label' => $subject->name,
            ])
            ->all();
    }

    private function serializeMentorLevel(?MentorLevel $level): ?array
    {
        if (! $level) {
            return null;
        }

        return [
            'hourlyRate' => $level->hourly_rate,
            'id' => $level->id,
            'name' => $level->name,
            'status' => $level->status,
        ];
    }

    private function resolvedMentorLevel(User $user): ?MentorLevel
    {
        if (! $user->isMentor()) {
            return null;
        }

        return $user->mentorProfile?->mentorLevel;
    }

    private function serializeMentorExpertise(User $user): array
    {
        if (! $user->isMentor()) {
            return [];
        }

        return collect($user->mentorProfile?->expertise ?? [])
            ->filter()
            ->map(fn ($id): string => (string) $id)
            ->values()
            ->all();
    }

    private function mentorExpertiseSubjects(User $user): array
    {
        $expertiseIds = $this->serializeMentorExpertise($user);

        if ($expertiseIds === []) {
            return [];
        }

        return Subject::query()
            ->whereIn('id', $expertiseIds)
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn (Subject $subject): array => [
                'id' => (string) $subject->id,
                'name' => $subject->name,
            ])
            ->all();
    }

    /**
     * @param  array<string, mixed>  $validated
     */
    private function syncRoleProfile(User $user, array $validated): void
    {
        $user->ensureRoleProfile();

        if (! $user->isMentor()) {
            return;
        }

        $user->mentorProfile()->updateOrCreate([], [
            'expertise' => collect($validated['expertise'] ?? [])
                ->filter()
                ->map(fn ($id): string => (string) $id)
                ->values()
                ->all(),
            'mentor_level_id' => ($validated['mentor_level_id'] ?? null) ?: null,
        ]);
    }

    /**
     * @param  array<string, mixed>  $validated
     */
    private function validateStudentAccessData(UserRole $role, array $validated): void
    {
        if ($role !== UserRole::Student) {
            return;
        }

        if ($validated['add_program_access'] ?? false) {
            foreach ($this->initialEnrollmentRows($validated) as $index => $enrollment) {
                foreach (['program_id', 'field_id', 'program_variant_id', 'start_date'] as $field) {
                    if (blank($enrollment[$field] ?? null)) {
                        throw ValidationException::withMessages([
                            $this->enrollmentErrorKey($field, $index) => 'This field is required when adding program access.',
                        ]);
                    }
                }

                $program = Program::query()
                    ->with(['fields:id', 'variants:id,field_id'])
                    ->find($enrollment['program_id']);
                $variant = $program
                    ? $program->variants->firstWhere('id', (int) $enrollment['program_variant_id'])
                    : null;

                if (! $program?->fields->contains('id', (int) $enrollment['field_id'])) {
                    throw ValidationException::withMessages([
                        $this->enrollmentErrorKey('field_id', $index) => 'The selected field is not available for this program.',
                    ]);
                }

                if (! $variant || $variant->field_id !== (int) $enrollment['field_id']) {
                    throw ValidationException::withMessages([
                        $this->enrollmentErrorKey('program_variant_id', $index) => 'The selected variant is not available for this field.',
                    ]);
                }
            }

            if ($this->initialEnrollmentRows($validated) === []) {
                throw ValidationException::withMessages([
                    'enrollments' => 'Add at least one program enrollment.',
                ]);
            }
        }

        if ($validated['add_try_out_access'] ?? false) {
            foreach ($this->initialTryOutAccessRows($validated) as $index => $access) {
                foreach (['try_out_id', 'available_from', 'available_until', 'attempt_quota'] as $field) {
                    if (blank($access[$field] ?? null)) {
                        throw ValidationException::withMessages([
                            $this->tryOutAccessErrorKey($field, $index) => 'This field is required when adding try out access.',
                        ]);
                    }
                }

                if (filled($access['available_from'] ?? null) && filled($access['available_until'] ?? null) && $access['available_until'] < $access['available_from']) {
                    throw ValidationException::withMessages([
                        $this->tryOutAccessErrorKey('available_until', $index) => 'The end date must be after or equal to the start date.',
                    ]);
                }
            }

            if ($this->initialTryOutAccessRows($validated) === []) {
                throw ValidationException::withMessages([
                    'try_out_accesses' => 'Add at least one try out access.',
                ]);
            }
        }
    }

    /**
     * @param  array<string, mixed>  $validated
     */
    private function syncInitialStudentAccess(User $user, array $validated): void
    {
        if (! $user->isStudent()) {
            return;
        }

        if ($validated['add_program_access'] ?? false) {
            foreach ($this->initialEnrollmentRows($validated) as $enrollment) {
                $user->programEnrollments()->create([
                    'field_id' => $enrollment['field_id'],
                    'max_reschedule' => ($enrollment['max_reschedule'] ?? null) ?: null,
                    'program_id' => $enrollment['program_id'],
                    'program_variant_id' => $enrollment['program_variant_id'],
                    'start_date' => $enrollment['start_date'],
                    'status' => 'active',
                ]);
            }
        }

        if ($validated['add_try_out_access'] ?? false) {
            foreach ($this->initialTryOutAccessRows($validated) as $access) {
                $user->tryOutAccesses()->create([
                    'attempt_quota' => $access['attempt_quota'],
                    'available_from' => $access['available_from'],
                    'available_until' => $access['available_until'],
                    'status' => 'active',
                    'try_out_id' => $access['try_out_id'],
                ]);
            }
        }
    }

    /**
     * @param  array<string, mixed>  $validated
     * @return array<int, array<string, mixed>>
     */
    private function initialEnrollmentRows(array $validated): array
    {
        if (filled($validated['enrollments'] ?? null)) {
            return array_values(array_filter(
                $validated['enrollments'],
                fn (array $enrollment): bool => collect(['program_id', 'field_id', 'program_variant_id', 'start_date'])
                    ->contains(fn (string $field): bool => filled($enrollment[$field] ?? null)),
            ));
        }

        if (collect(['program_id', 'field_id', 'program_variant_id', 'start_date'])
            ->contains(fn (string $field): bool => filled($validated[$field] ?? null))) {
            return [[
                'field_id' => $validated['field_id'] ?? null,
                'max_reschedule' => $validated['max_reschedule'] ?? null,
                'program_id' => $validated['program_id'] ?? null,
                'program_variant_id' => $validated['program_variant_id'] ?? null,
                'start_date' => $validated['start_date'] ?? null,
            ]];
        }

        return [];
    }

    private function enrollmentErrorKey(string $field, int $index): string
    {
        return "enrollments.{$index}.{$field}";
    }

    /**
     * @param  array<string, mixed>  $validated
     * @return array<int, array<string, mixed>>
     */
    private function initialTryOutAccessRows(array $validated): array
    {
        if (filled($validated['try_out_accesses'] ?? null)) {
            return array_values(array_filter(
                $validated['try_out_accesses'],
                fn (array $access): bool => collect(['try_out_id', 'available_from', 'available_until', 'attempt_quota'])
                    ->contains(fn (string $field): bool => filled($access[$field] ?? null)),
            ));
        }

        if (collect(['try_out_id', 'available_from', 'available_until', 'attempt_quota'])
            ->contains(fn (string $field): bool => filled($validated[$field] ?? null))) {
            return [[
                'attempt_quota' => $validated['attempt_quota'] ?? null,
                'available_from' => $validated['available_from'] ?? null,
                'available_until' => $validated['available_until'] ?? null,
                'try_out_id' => $validated['try_out_id'] ?? null,
            ]];
        }

        return [];
    }

    private function tryOutAccessErrorKey(string $field, int $index): string
    {
        return "try_out_accesses.{$index}.{$field}";
    }

    private function programEnrollmentOptions(): array
    {
        return Program::query()
            ->where('status', 'active')
            ->with([
                'fields' => fn ($query) => $query->where('status', 'active')->select('fields.id', 'fields.name'),
                'variants' => fn ($query) => $query->where('status', 'active')->select('id', 'field_id', 'name', 'session', 'duration', 'price', 'status'),
            ])
            ->orderBy('name')
            ->get(['id', 'name', 'max_reschedule'])
            ->map(fn (Program $program): array => [
                'id' => (string) $program->id,
                'label' => $program->name,
                'maxReschedule' => $program->max_reschedule,
                'fields' => $program->fields->map(fn ($field): array => [
                    'id' => (string) $field->id,
                    'label' => $field->name,
                ])->values(),
                'variants' => $program->variants->map(fn ($variant): array => [
                    'id' => (string) $variant->id,
                    'fieldId' => (string) $variant->field_id,
                    'label' => $variant->name,
                    'session' => $variant->session,
                    'duration' => $variant->duration,
                    'price' => $variant->price,
                    'status' => $variant->status,
                ])->values(),
            ])
            ->all();
    }

    private function tryOutAccessOptions(): array
    {
        return TryOut::query()
            ->where('status', 'private')
            ->orderBy('title')
            ->get(['id', 'title'])
            ->map(fn (TryOut $tryOut): array => [
                'id' => (string) $tryOut->id,
                'title' => $tryOut->title,
            ])
            ->all();
    }

    private function tryOutAccessStatus(TryOutAccess $access): string
    {
        if ($access->status !== 'active') {
            return 'Inactive';
        }

        if ($access->available_until->copy()->endOfDay()->isPast()) {
            return 'Expired';
        }

        if ($access->remainingAttempts() === 0) {
            return 'Exhausted';
        }

        if ($access->available_from->copy()->startOfDay()->isFuture()) {
            return 'Scheduled';
        }

        return 'Active';
    }
}
