<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreProgramEnrollmentRequest;
use App\Models\Program;
use App\Models\ProgramEnrollment;
use App\Models\Role;
use App\Models\TryOut;
use App\Models\TryOutAccess;
use App\Models\User;
use App\UserRole;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
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
        return $this->index(UserRole::Student, 'admin/users/students/index');
    }

    public function mentors(): Response
    {
        return $this->index(UserRole::Mentor, 'admin/users/mentors/index');
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
                    'program' => $enrollment->program?->name,
                    'field' => $enrollment->field?->name,
                    'variant' => $enrollment->variant?->name,
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

        return $this->show($user, 'admin/users/mentors/show', 'Mentors', route('mentors'), [
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

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user)],
            'role_id' => ['nullable', Rule::exists('roles', 'id')->where('status', 'active')],
        ]);

        $user->update([
            ...$validated,
            'role_id' => $user->isAdmin() ? (($validated['role_id'] ?? null) ?: null) : null,
        ]);

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
                ->with('internalRole:id,name')
                ->where('role', $role)
                ->latest()
                ->get(['id', 'name', 'nickname', 'slug', 'email', 'role', 'role_id', 'status', 'created_at'])
                ->map(fn (User $user): array => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'nickname' => $user->nickname,
                    'slug' => $user->slug,
                    'email' => $user->email,
                    'internalRole' => $user->internalRole?->name,
                    'roleId' => $user->role_id,
                    'status' => $user->status,
                    'createdAt' => $user->created_at?->format('M d, Y'),
                ]),
            ...$props,
        ]);
    }

    private function store(Request $request, UserRole $role): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')],
            'role_id' => ['nullable', Rule::exists('roles', 'id')->where('status', 'active')],
        ]);

        User::query()->create([
            ...$validated,
            'password' => 'averose123',
            'role' => $role,
            'role_id' => $role === UserRole::Admin ? (($validated['role_id'] ?? null) ?: null) : null,
            'status' => 'active',
        ]);

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
            ?->format('M d, Y');
    }

    private function teachingJournals(User $mentor): array
    {
        return $mentor->mentorSchedules()
            ->with(['subject:id,name', 'user:id,name', 'enrollment.program:id,name'])
            ->latest('scheduled_at')
            ->limit(10)
            ->get()
            ->map(function ($booking): array {
                $endAt = $booking->scheduled_at->copy()->addMinutes($booking->duration);

                return [
                    'id' => (string) $booking->id,
                    'date' => $booking->scheduled_at->format('M d, Y'),
                    'duration' => "{$booking->duration} minutes",
                    'program' => $booking->enrollment?->program?->name ?? '-',
                    'status' => $booking->status,
                    'student' => $booking->user?->name ?? '-',
                    'subject' => $booking->subject?->name ?? 'Session',
                    'time' => "{$booking->scheduled_at->format('H:i')} - {$endAt->format('H:i')}",
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
            'roleId' => $user->role_id,
            'status' => $user->status,
            'createdAt' => $user->created_at?->format('M d, Y'),
            'updatedAt' => $user->updated_at?->format('M d, Y'),
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
