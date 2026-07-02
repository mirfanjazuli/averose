<?php

namespace App\Http\Controllers;

use App\Http\Requests\SubmitTryOutAttemptRequest;
use App\Models\TryOut;
use App\Models\TryOutAttempt;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class TryOutsController extends Controller
{
    public function index(): Response
    {
        $attempts = TryOutAttempt::query()
            ->whereBelongsTo(Auth::user())
            ->get();

        return Inertia::render('student/try-outs', [
            'summary' => [
                'bestScore' => $attempts->max('score'),
                'completed' => $attempts->count(),
            ],
            'tryOuts' => TryOut::query()
                ->withCount('questions')
                ->where('status', 'published')
                ->latest()
                ->get()
                ->map(fn (TryOut $tryOut): array => [
                    'duration' => $tryOut->duration_minutes ? "{$tryOut->duration_minutes} min" : '-',
                    'durationMinutes' => $tryOut->duration_minutes,
                    'id' => (string) $tryOut->id,
                    'questions' => $tryOut->questions_count,
                    'slug' => $tryOut->slug,
                    'status' => 'Available',
                    'title' => $tryOut->title,
                ])
                ->all(),
        ]);
    }

    public function results(): Response
    {
        $attempts = TryOutAttempt::query()
            ->with('tryOut')
            ->whereBelongsTo(Auth::user())
            ->latest('submitted_at')
            ->get();

        return Inertia::render('student/try-out-results', [
            'attempts' => $attempts
                ->map(fn (TryOutAttempt $attempt): array => [
                    'correctCount' => $attempt->correct_count,
                    'id' => (string) $attempt->id,
                    'questionCount' => $attempt->question_count,
                    'score' => $attempt->score,
                    'submittedAt' => $attempt->submitted_at?->format('d M Y, H:i'),
                    'tryOut' => [
                        'slug' => $attempt->tryOut->slug,
                        'title' => $attempt->tryOut->title,
                    ],
                ])
                ->all(),
        ]);
    }

    public function show(TryOut $tryOut): Response
    {
        abort_unless($tryOut->status === 'published', 404);

        $tryOut->load('questions');

        return Inertia::render('student/try-out-session', [
            'tryOut' => [
                'durationMinutes' => $tryOut->duration_minutes,
                'id' => (string) $tryOut->id,
                'questions' => $tryOut->questions->map(fn ($question): array => [
                    'id' => (string) $question->id,
                    'number' => $question->number,
                    'options' => $question->options,
                    'optionsHtml' => $question->options_html ?? $question->options,
                    'questionHtml' => $question->question_html ?? e($question->question_text),
                    'questionText' => $question->question_text,
                    'subjectName' => $question->subject_name,
                ])->values()->all(),
                'slug' => $tryOut->slug,
                'title' => $tryOut->title,
            ],
        ]);
    }

    public function result(TryOut $tryOut, TryOutAttempt $tryOutAttempt): Response
    {
        abort_unless($tryOut->status === 'published', 404);
        abort_unless($tryOutAttempt->try_out_id === $tryOut->id, 404);
        abort_unless($tryOutAttempt->user_id === Auth::id(), 403);

        $tryOut->load('questions');

        return Inertia::render('student/try-out-result-detail', [
            'attempt' => [
                'answers' => collect($tryOutAttempt->answers ?? [])
                    ->mapWithKeys(fn ($answer, string|int $questionId): array => [(string) $questionId => $answer])
                    ->all(),
                'correctCount' => $tryOutAttempt->correct_count,
                'id' => (string) $tryOutAttempt->id,
                'questionCount' => $tryOutAttempt->question_count,
                'score' => $tryOutAttempt->score,
                'submittedAt' => $tryOutAttempt->submitted_at?->format('d M Y, H:i'),
            ],
            'tryOut' => [
                'id' => (string) $tryOut->id,
                'questions' => $tryOut->questions->map(fn ($question): array => [
                    'answer' => $question->answer,
                    'id' => (string) $question->id,
                    'number' => $question->number,
                    'options' => $question->options,
                    'optionsHtml' => $question->options_html ?? $question->options,
                    'questionHtml' => $question->question_html ?? e($question->question_text),
                    'questionText' => $question->question_text,
                    'subjectName' => $question->subject_name,
                ])->values()->all(),
                'slug' => $tryOut->slug,
                'title' => $tryOut->title,
            ],
        ]);
    }

    public function submit(SubmitTryOutAttemptRequest $request, TryOut $tryOut): RedirectResponse
    {
        abort_unless($tryOut->status === 'published', 404);

        $questions = $tryOut->questions()->get();
        $answers = collect($request->validated('answers'))
            ->mapWithKeys(fn ($answer, string $questionId): array => [(int) $questionId => $answer])
            ->all();
        $correctCount = $questions->filter(
            fn ($question): bool => ($answers[$question->id] ?? null) === $question->answer
        )->count();
        $questionCount = $questions->count();
        $score = $questionCount > 0 ? round(($correctCount / $questionCount) * 100, 2) : 0;

        $attempt = TryOutAttempt::query()->create([
            'answers' => $answers,
            'correct_count' => $correctCount,
            'question_count' => $questionCount,
            'score' => $score,
            'submitted_at' => now(),
            'try_out_id' => $tryOut->id,
            'user_id' => $request->user()->id,
        ]);

        return redirect()
            ->route('try-outs.results.show', [$tryOut, $attempt])
            ->with('success', 'Try out submitted.');
    }
}
