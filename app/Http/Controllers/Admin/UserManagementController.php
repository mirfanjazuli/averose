<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreProgramEnrollmentRequest;
use App\Models\Program;
use App\Models\ProgramEnrollment;
use App\Models\User;
use App\UserRole;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class UserManagementController extends Controller
{
    public function students(): Response
    {
        return $this->index(UserRole::Student, 'admin/users/students');
    }

    public function mentors(): Response
    {
        return $this->index(UserRole::Mentor, 'admin/users/mentors');
    }

    public function showStudent(User $user): Response
    {
        abort_unless($user->isStudent(), 404);

        $user->load([
            'programEnrollments.bookings:id,program_enrollment_id,scheduled_at,status',
            'programEnrollments.field:id,name',
            'programEnrollments.program:id,name,max_reschedule',
            'programEnrollments.variant:id,name,session,duration,price',
        ]);

        return $this->show($user, 'admin/users/student-detail', 'Students', route('students'), [
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
        ]);
    }

    public function showMentor(User $user): Response
    {
        abort_unless($user->isMentor(), 404);

        return $this->show($user, 'admin/users/mentor-detail', 'Mentors', route('mentors'), [
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

    public function storeStudentEnrollment(StoreProgramEnrollmentRequest $request, User $user): RedirectResponse
    {
        abort_unless($user->isStudent(), 404);

        $user->programEnrollments()->create($request->validated());

        return back();
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user)],
        ]);

        $user->update($validated);

        return back();
    }

    public function destroy(User $user): RedirectResponse
    {
        $user->delete();

        return back();
    }

    private function index(UserRole $role, string $component): Response
    {
        return Inertia::render($component, [
            'users' => User::query()
                ->where('role', $role)
                ->latest()
                ->get(['id', 'name', 'nickname', 'slug', 'email', 'status', 'created_at'])
                ->map(fn (User $user): array => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'nickname' => $user->nickname,
                    'slug' => $user->slug,
                    'email' => $user->email,
                    'status' => $user->status,
                    'createdAt' => $user->created_at?->format('M d, Y'),
                ]),
        ]);
    }

    private function store(Request $request, UserRole $role): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')],
        ]);

        User::query()->create([
            ...$validated,
            'password' => 'averose123',
            'role' => $role,
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

        return $enrollment->bookings
            ->where('status', 'completed')
            ->sortByDesc('scheduled_at')
            ->first()
            ?->scheduled_at
            ?->format('M d, Y');
    }

    private function teachingJournals(User $mentor): array
    {
        return $mentor->mentorBookings()
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
            'status' => $user->status,
            'createdAt' => $user->created_at?->format('M d, Y'),
            'updatedAt' => $user->updated_at?->format('M d, Y'),
        ];
    }

    private function programEnrollmentOptions(): array
    {
        return Program::query()
            ->with(['fields:id,name', 'variants:id,field_id,name,session,duration,price,status'])
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
}
