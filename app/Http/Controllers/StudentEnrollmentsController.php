<?php

namespace App\Http\Controllers;

use App\Models\ProgramEnrollment;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StudentEnrollmentsController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request): Response
    {
        return Inertia::render('student/enrollments', [
            'enrollments' => $request->user()
                ->programEnrollments()
                ->with(['field:id,name', 'program:id,name,max_reschedule,status', 'variant:id,name,session,duration,price'])
                ->latest()
                ->get()
                ->map(fn (ProgramEnrollment $enrollment): array => [
                    'id' => $enrollment->id,
                    'program' => $enrollment->program?->name,
                    'field' => $enrollment->field?->name,
                    'variant' => $enrollment->variant?->name,
                    'sessions' => $enrollment->variant?->session,
                    'sessionsUsed' => $enrollment->sessions_used,
                    'sessionsRemaining' => $enrollment->sessionsRemaining(),
                    'duration' => $enrollment->variant?->duration,
                    'startDate' => $enrollment->start_date?->format('M d, Y'),
                    'maxReschedule' => $enrollment->max_reschedule ?? $enrollment->program?->max_reschedule,
                    'status' => $enrollment->status,
                ]),
        ]);
    }
}
