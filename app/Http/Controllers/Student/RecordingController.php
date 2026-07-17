<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Concerns\FormatsRecordings;
use App\Http\Controllers\Controller;
use App\Models\Recording;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class RecordingController extends Controller
{
    use FormatsRecordings;

    public function index(Request $request): Response
    {
        return Inertia::render('student/recordings/index', [
            'recordings' => $this->recordings($request),
        ]);
    }

    private function recordings(Request $request): array
    {
        return Recording::query()
            ->with([
                'schedule.mentor:id,name',
                'schedule.subject:id,name',
                'schedule.enrollment.program:id,name',
                'user:id,name',
                'zoomAccount:id,name',
            ])
            ->where('user_id', $request->user()->id)
            ->where('status', 'active')
            ->latest('recorded_at')
            ->latest()
            ->get()
            ->map(fn (Recording $recording): array => $this->recordingData($recording))
            ->all();
    }
}
