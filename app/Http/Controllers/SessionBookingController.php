<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreSessionBookingRequest;
use App\Models\ProgramEnrollment;
use App\Models\SessionBooking;
use Carbon\CarbonImmutable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SessionBookingController extends Controller
{
    public function store(StoreSessionBookingRequest $request): RedirectResponse
    {
        $data = $request->validated();

        DB::transaction(function () use ($data, $request): void {
            $enrollment = ProgramEnrollment::query()
                ->with(['program.subjects:id', 'variant:id,session,duration'])
                ->whereKey($data['program_enrollment_id'])
                ->where('user_id', $request->user()->id)
                ->lockForUpdate()
                ->firstOrFail();

            if (! $enrollment->program?->subjects->contains('id', (int) $data['subject_id'])) {
                throw ValidationException::withMessages([
                    'subject_id' => 'The selected subject is not available for this enrollment.',
                ]);
            }

            if ($enrollment->sessionsRemaining() < 1) {
                throw ValidationException::withMessages([
                    'subject_id' => 'There are no remaining sessions for this enrollment.',
                ]);
            }

            $scheduledAt = CarbonImmutable::parse(
                "{$data['date']} {$data['time']}",
                config('app.timezone'),
            );

            SessionBooking::query()->create([
                'user_id' => $request->user()->id,
                'program_enrollment_id' => $enrollment->id,
                'subject_id' => $data['subject_id'],
                'scheduled_at' => $scheduledAt,
                'duration' => $enrollment->variant?->duration ?? 60,
                'status' => 'pending',
            ]);

            $enrollment->increment('sessions_used');
        });

        return back()->with('success', 'Session booked.');
    }
}
