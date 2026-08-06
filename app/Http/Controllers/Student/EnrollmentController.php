<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\ProgramEnrollment;
use App\Services\ProgramAssetStorage;
use App\Services\ProgramMaterialAccessService;
use App\Support\StorageUrl;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EnrollmentController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function index(Request $request): Response
    {
        return Inertia::render('student/enrollments/index', [
            'enrollments' => $request->user()
                ->programEnrollments()
                ->with(['field:id,name', 'program:id,name,max_reschedule,status', 'variant:id,name,session,duration,price'])
                ->latest()
                ->get()
                ->map(fn (ProgramEnrollment $enrollment): array => [
                    'id' => $enrollment->id,
                    'href' => route('enrollments.show', $enrollment),
                    'program' => $enrollment->programNameAtEnrollment(),
                    'field' => $enrollment->fieldNameAtEnrollment(),
                    'variant' => $enrollment->variantNameAtEnrollment(),
                    'sessions' => $enrollment->sessionsAtEnrollment(),
                    'sessionsUsed' => $enrollment->sessions_used,
                    'sessionsRemaining' => $enrollment->sessionsRemaining(),
                    'duration' => $enrollment->durationAtEnrollment(),
                    'startDate' => $enrollment->start_date?->format('M d, Y'),
                    'maxReschedule' => $enrollment->max_reschedule ?? $enrollment->program?->max_reschedule,
                    'status' => $enrollment->status,
                ]),
        ]);
    }

    public function show(
        Request $request,
        ProgramEnrollment $programEnrollment,
        ProgramMaterialAccessService $materialAccess,
    ): Response {
        abort_unless($programEnrollment->user_id === $request->user()->id, 404);

        $programEnrollment->load([
            'field:id,name',
            'program:id,name,slug,thumbnail,description,max_reschedule,status',
            'variant:id,name,session,duration,price',
        ]);

        $hasMaterialAccess = $materialAccess->hasLifetimeAccess(
            $request->user(),
            $programEnrollment->program_id,
        );
        $materials = $hasMaterialAccess
            ? $programEnrollment->program?->materials()
                ->where('status', 'active')
                ->latest()
                ->get()
            : collect();

        return Inertia::render('student/enrollments/show', [
            'enrollment' => [
                'duration' => $programEnrollment->durationAtEnrollment(),
                'field' => $programEnrollment->fieldNameAtEnrollment(),
                'hasMaterialAccess' => $hasMaterialAccess,
                'id' => $programEnrollment->id,
                'maxReschedule' => $programEnrollment->max_reschedule ?? $programEnrollment->program?->max_reschedule,
                'program' => $programEnrollment->programNameAtEnrollment(),
                'programDescription' => $programEnrollment->program?->description,
                'sessions' => $programEnrollment->sessionsAtEnrollment(),
                'sessionsRemaining' => $programEnrollment->sessionsRemaining(),
                'sessionsUsed' => $programEnrollment->sessions_used,
                'startDate' => $programEnrollment->start_date?->format('Y-m-d'),
                'status' => $programEnrollment->status,
                'thumbnailUrl' => StorageUrl::forPath(
                    $programEnrollment->program?->thumbnail,
                    ProgramAssetStorage::DISK,
                ),
                'variant' => $programEnrollment->variantNameAtEnrollment(),
            ],
            'materials' => $materials->map(fn ($material): array => [
                'description' => $material->description,
                'mimeType' => $material->mime_type,
                'name' => $material->original_name,
                'size' => $material->size,
                'title' => $material->title,
                'uploadedAt' => $material->created_at?->toISOString(),
                'url' => route('program-materials.show', $material),
                'uuid' => $material->uuid,
            ])->values(),
        ]);
    }
}
