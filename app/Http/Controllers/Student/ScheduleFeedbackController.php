<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\Schedule;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class ScheduleFeedbackController extends Controller
{
    public function store(Request $request, Schedule $schedule): RedirectResponse
    {
        abort_unless($schedule->user_id === $request->user()->id, 403);

        $endAt = $schedule->scheduled_at->copy()->addMinutes($schedule->duration);

        if ($schedule->status !== 'completed' && $endAt->isFuture()) {
            throw ValidationException::withMessages([
                'feedback' => 'Feedback can only be submitted after the session has ended.',
            ]);
        }

        if ($schedule->feedback()->exists()) {
            throw ValidationException::withMessages([
                'feedback' => 'Feedback for this session has already been submitted.',
            ]);
        }

        $validated = $request->validate([
            'audio_quality_rating' => ['required', 'integer', 'min:1', 'max:5'],
            'comment' => ['nullable', 'string', 'max:1000'],
            'interactivity_rating' => ['required', 'integer', 'min:1', 'max:5'],
            'material_clarity_rating' => ['required', 'integer', 'min:1', 'max:5'],
            'visual_quality_rating' => ['required', 'integer', 'min:1', 'max:5'],
        ]);

        $feedback = $schedule->feedback()->create([
            ...$validated,
            'mentor_id' => $schedule->mentor_id,
            'user_id' => $request->user()->id,
        ]);
        $schedule->recordHistory('feedback_submitted', "Feedback sesi dikirim oleh {$request->user()->name}.", $request->user(), [
            'feedback_id' => $feedback->id,
            'rating_average' => round(collect([
                $validated['audio_quality_rating'],
                $validated['interactivity_rating'],
                $validated['material_clarity_rating'],
                $validated['visual_quality_rating'],
            ])->average(), 1),
        ], $request->ip());

        return back()->with('success', 'Feedback sesi berhasil dikirim.');
    }
}
