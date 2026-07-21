<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\ImportTryOutDocumentRequest;
use App\Models\Subject;
use App\Models\TryOut;
use App\Models\TryOutAttempt;
use App\Models\TryOutGroup;
use App\Models\TryOutQuestion;
use App\Services\TryOutAssetStorage;
use App\Services\TryOutDocumentImporter;
use App\Services\TryOutDocumentTemplate;
use App\Services\TryOutScoringService;
use App\TryOutQuestionType;
use App\TryOutScoringMode;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Throwable;

class TryOutController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('admin/academics/try-outs/index', [
            'tryOuts' => TryOut::query()
                ->with('questions:id,try_out_id,subject_name')
                ->withCount('questions')
                ->latest()
                ->get()
                ->map(fn (TryOut $tryOut): array => $this->tryOutData($tryOut))
                ->all(),
        ]);
    }

    public function importPage(): Response
    {
        return Inertia::render('admin/academics/try-outs/import', [
            'breadcrumbs' => [
                [
                    'title' => 'Academics',
                    'href' => '/academics/fields',
                ],
                [
                    'title' => 'Try Out',
                    'href' => route('admin.try-outs'),
                ],
                [
                    'title' => 'Import',
                    'href' => route('admin.try-outs.import.page'),
                ],
            ],
        ]);
    }

    public function preview(
        ImportTryOutDocumentRequest $request,
        TryOutDocumentImporter $importer,
        TryOutAssetStorage $assetStorage,
    ): RedirectResponse {
        $document = $request->file('document');
        $token = (string) Str::uuid();

        try {
            $questions = $importer->parse(
                $document->getRealPath(),
                $request->user(),
                $token,
                TryOutScoringMode::from($request->validated('scoring_mode')),
            );
        } catch (Throwable $exception) {
            $assetStorage->cleanupPreview($token, $request->user());
            throw $exception;
        }

        if ($questions === []) {
            $assetStorage->cleanupPreview($token, $request->user());

            throw ValidationException::withMessages([
                'document' => 'No questions were found in this document.',
            ]);
        }

        $attributes = [
            'duration_minutes' => $request->integer('duration_minutes') ?: null,
            'scoring_mode' => $request->validated('scoring_mode'),
            'correct_points' => $request->validated('correct_points'),
            'wrong_points' => $request->validated('wrong_points'),
            'unanswered_points' => $request->validated('unanswered_points'),
            'status' => $request->validated('status'),
            'title' => $request->validated('title'),
        ];
        $sourceFileName = $document->getClientOriginalName();
        Cache::put("try-out-import-preview:{$token}", [
            'attributes' => $attributes,
            'questions' => $questions,
            'source_file_name' => $sourceFileName,
        ], now()->addHour());

        return redirect()
            ->route('admin.try-outs.import.page')
            ->with('tryOutImportPreview', [
                'durationMinutes' => $attributes['duration_minutes'],
                'questionCount' => count($questions),
                'questions' => $questions,
                'scoringMode' => $attributes['scoring_mode'],
                'correctPoints' => $attributes['correct_points'],
                'wrongPoints' => $attributes['wrong_points'],
                'unansweredPoints' => $attributes['unanswered_points'],
                'status' => str($attributes['status'])->headline()->toString(),
                'subjects' => collect($questions)
                    ->pluck('subject_name')
                    ->filter()
                    ->unique()
                    ->values()
                    ->all(),
                'title' => filled($attributes['title'])
                    ? $attributes['title']
                    : pathinfo($sourceFileName, PATHINFO_FILENAME),
                'token' => $token,
            ]);
    }

    public function import(TryOutDocumentImporter $importer): RedirectResponse
    {
        $validated = request()->validate([
            'questions' => ['nullable', 'json'],
            'token' => ['required', 'string'],
        ]);

        $preview = Cache::get("try-out-import-preview:{$validated['token']}");

        if (! is_array($preview)) {
            throw ValidationException::withMessages([
                'token' => 'The import preview has expired. Please upload the document again.',
            ]);
        }

        $questions = $preview['questions'];

        if (filled($validated['questions'] ?? null)) {
            $questions = json_decode($validated['questions'], true, 512, JSON_THROW_ON_ERROR);
        }

        $tryOut = $importer->importParsed(
            $questions,
            $preview['source_file_name'],
            $preview['attributes'],
            $validated['token'],
            request()->user(),
        );

        Cache::forget("try-out-import-preview:{$validated['token']}");

        return redirect()
            ->route('admin.try-outs.show', $tryOut)
            ->with('success', "{$tryOut->title} imported successfully.");
    }

    public function show(TryOut $tryOut): Response
    {
        $tryOut->load(['groups.accesses', 'questions']);

        return Inertia::render('admin/academics/try-outs/show', [
            'tryOut' => [
                'duration' => $tryOut->duration_minutes ? (string) $tryOut->duration_minutes : '-',
                'groups' => $tryOut->groups
                    ->sortByDesc('created_at')
                    ->values()
                    ->map(fn (TryOutGroup $group): array => $this->tryOutGroupData($group))
                    ->all(),
                'scoringMode' => ($tryOut->scoring_mode ?? TryOutScoringMode::RawScore)->value,
                'correctPoints' => $tryOut->correct_points,
                'wrongPoints' => $tryOut->wrong_points,
                'unansweredPoints' => $tryOut->unanswered_points,
                'id' => (string) $tryOut->id,
                'questionsCount' => $tryOut->questions->count(),
                'leaderboard' => $this->leaderboardSummary($tryOut),
                'readiness' => $this->tryOutReadiness($tryOut),
                'recentAttempts' => $this->recentAttempts($tryOut),
                'slug' => $tryOut->slug,
                'status' => str($tryOut->status)->headline()->toString(),
                'subjects' => $tryOut->questions
                    ->pluck('subject_name')
                    ->filter()
                    ->unique()
                    ->values()
                    ->all(),
                'title' => $tryOut->title,
            ],
            'breadcrumbs' => [
                [
                    'title' => 'Academics',
                    'href' => '/academics/fields',
                ],
                [
                    'title' => 'Try Out',
                    'href' => route('admin.try-outs'),
                ],
                [
                    'title' => $tryOut->title,
                    'href' => route('admin.try-outs.show', $tryOut),
                ],
            ],
        ]);
    }

    public function questions(TryOut $tryOut): Response
    {
        $tryOut->load('questions');

        return Inertia::render('admin/academics/try-outs/questions', [
            'tryOut' => [
                'id' => (string) $tryOut->id,
                'questions' => $tryOut->questions
                    ->sortBy('number')
                    ->values()
                    ->map(fn (TryOutQuestion $question): array => $this->tryOutQuestionData($question))
                    ->all(),
                'questionsCount' => $tryOut->questions->count(),
                'scoringMode' => ($tryOut->scoring_mode ?? TryOutScoringMode::RawScore)->value,
                'slug' => $tryOut->slug,
                'status' => str($tryOut->status)->headline()->toString(),
                'subjects' => $tryOut->questions
                    ->pluck('subject_name')
                    ->filter()
                    ->unique()
                    ->values()
                    ->all(),
                'title' => $tryOut->title,
            ],
            'breadcrumbs' => [
                [
                    'title' => 'Academics',
                    'href' => '/academics/fields',
                ],
                [
                    'title' => 'Try Out',
                    'href' => route('admin.try-outs'),
                ],
                [
                    'title' => $tryOut->title,
                    'href' => route('admin.try-outs.show', $tryOut),
                ],
                [
                    'title' => 'Questions',
                    'href' => route('admin.try-outs.questions', $tryOut),
                ],
            ],
        ]);
    }

    public function storeGroup(Request $request, TryOut $tryOut): RedirectResponse
    {
        abort_unless($tryOut->status === 'private', 404);

        $validated = $request->validate([
            'attempt_quota' => ['required', 'integer', 'min:1', 'max:1000'],
            'available_from' => ['required', 'date'],
            'available_until' => ['required', 'date', 'after_or_equal:available_from'],
            'max_participants' => ['nullable', 'integer', 'min:1', 'max:100000'],
            'name' => ['required', 'string', 'max:255'],
            'status' => ['required', 'in:active,inactive'],
        ]);

        $tryOut->groups()->create($validated);

        return back()->with('success', 'Try out group created successfully.');
    }

    public function deactivateGroup(TryOut $tryOut, TryOutGroup $tryOutGroup): RedirectResponse
    {
        abort_unless($tryOutGroup->try_out_id === $tryOut->id, 404);

        $tryOutGroup->update(['status' => 'inactive']);

        return back()->with('success', 'Try out group deactivated successfully.');
    }

    public function leaderboard(TryOut $tryOut): Response
    {
        $leaderboardRows = $this->leaderboardRows($tryOut);

        return Inertia::render('admin/academics/try-outs/leaderboard', [
            'tryOut' => [
                'averageScore' => $leaderboardRows->isEmpty() ? null : round($leaderboardRows->avg('percentageScore'), 2),
                'highestScore' => $leaderboardRows->max('percentageScore'),
                'id' => (string) $tryOut->id,
                'leaderboard' => $leaderboardRows->values()->all(),
                'participantsCount' => $leaderboardRows->count(),
                'slug' => $tryOut->slug,
                'title' => $tryOut->title,
                'totalAttempts' => $tryOut->attempts()->count(),
            ],
            'breadcrumbs' => [
                [
                    'title' => 'Academics',
                    'href' => '/academics/fields',
                ],
                [
                    'title' => 'Try Out',
                    'href' => route('admin.try-outs'),
                ],
                [
                    'title' => $tryOut->title,
                    'href' => route('admin.try-outs.show', $tryOut),
                ],
                [
                    'title' => 'Leaderboard',
                    'href' => route('admin.try-outs.leaderboard', $tryOut),
                ],
            ],
        ]);
    }

    public function update(TryOut $tryOut, TryOutScoringService $scoring): RedirectResponse
    {
        request()->merge([
            'scoring_mode' => request()->input('scoring_mode', ($tryOut->scoring_mode ?? TryOutScoringMode::RawScore)->value),
        ]);

        $validated = request()->validate([
            'correct_points' => ['nullable', 'required_if:scoring_mode,negative_marking', 'numeric', 'gt:0'],
            'duration_minutes' => ['nullable', 'integer', 'min:1', 'max:1000'],
            'scoring_mode' => ['required', 'in:raw_score,negative_marking'],
            'status' => ['required', 'in:draft,public,private'],
            'title' => ['required', 'string', 'max:255'],
            'unanswered_points' => ['nullable', 'required_if:scoring_mode,negative_marking', 'numeric', 'lt:correct_points'],
            'wrong_points' => ['nullable', 'required_if:scoring_mode,negative_marking', 'numeric', 'lt:correct_points'],
        ]);

        $newMode = TryOutScoringMode::from($validated['scoring_mode']);
        DB::transaction(function () use ($newMode, $scoring, $tryOut, $validated): void {
            $tryOut->update([
                'correct_points' => $newMode === TryOutScoringMode::NegativeMarking ? $validated['correct_points'] : null,
                'duration_minutes' => $validated['duration_minutes'] ?? null,
                'scoring_mode' => $newMode,
                'status' => $validated['status'],
                'title' => $validated['title'],
                'unanswered_points' => $newMode === TryOutScoringMode::NegativeMarking ? $validated['unanswered_points'] : null,
                'wrong_points' => $newMode === TryOutScoringMode::NegativeMarking ? $validated['wrong_points'] : null,
            ]);

            if ($tryOut->status !== 'draft') {
                $scoring->validateReadyForPublication($tryOut->refresh());
            }
        });

        return back()->with('success', "{$tryOut->title} updated successfully.");
    }

    public function updateQuestion(
        TryOut $tryOut,
        TryOutQuestion $question,
        TryOutAssetStorage $assetStorage,
    ): RedirectResponse {
        abort_unless($question->try_out_id === $tryOut->id, 404);

        $validated = request()->validate([
            'answer' => ['nullable', 'string', 'max:255'],
            'correct_answers' => ['nullable', 'array', 'min:1'],
            'correct_answers.*' => ['required', 'distinct', 'in:A,B,C,D,E'],
            'options' => ['nullable', 'array'],
            'options.*' => ['nullable', 'string'],
            'options_html' => ['nullable', 'array'],
            'options_html.*' => ['nullable', 'string'],
            'question_html' => ['nullable', 'string'],
            'question_text' => ['required', 'string'],
            'question_type' => ['nullable', 'in:single_choice,multiple_answer,numeric_answer'],
            'points' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'sub_category_name' => ['nullable', 'string', 'max:255'],
            'subject_name' => ['nullable', 'string', 'max:255'],
        ]);

        $submittedOptions = collect($validated['options'] ?? [])
            ->only(['A', 'B', 'C', 'D', 'E'])
            ->map(fn (string $option): string => trim($option))
            ->all();

        $optionsHtml = collect($submittedOptions)
            ->map(function (string $option, string $key) use ($assetStorage, $question, $tryOut, $validated): string {
                if (filled($validated['options_html'][$key] ?? null)) {
                    return $assetStorage->sanitizeEditorHtml($validated['options_html'][$key], $tryOut);
                }

                return ($question->options[$key] ?? null) === $option
                    ? ($question->options_html[$key] ?? e($option))
                    : e($option);
            })
            ->all();
        $questionHtml = filled($validated['question_html'] ?? null)
            ? $assetStorage->sanitizeEditorHtml($validated['question_html'], $tryOut)
            : ($question->question_text === $validated['question_text']
                ? ($question->question_html ?? e($validated['question_text']))
                : e($validated['question_text']));
        $questionText = $assetStorage->plainText($questionHtml);
        $options = collect($optionsHtml)
            ->map(fn (string $optionHtml): string => $assetStorage->plainText($optionHtml))
            ->all();

        $questionType = TryOutQuestionType::tryFrom($validated['question_type'] ?? '') ?? $question->question_type ?? TryOutQuestionType::SingleChoice;
        $submittedAnswers = match ($questionType) {
            TryOutQuestionType::MultipleAnswer => collect($validated['correct_answers'] ?? [])->unique()->sort()->values()->all(),
            TryOutQuestionType::NumericAnswer => [app(TryOutScoringService::class)->normalizeNumericAnswer($validated['answer'] ?? null)],
            default => [($validated['answer'] ?? null) === 'none' ? null : ($validated['answer'] ?? null)],
        };
        $submittedAnswers = array_values(array_filter($submittedAnswers));

        if ($submittedAnswers === []) {
            throw ValidationException::withMessages(['answer' => 'An answer key is required.']);
        }

        if ($questionType === TryOutQuestionType::SingleChoice && ! in_array($submittedAnswers[0], ['A', 'B', 'C', 'D', 'E'], true)) {
            throw ValidationException::withMessages(['answer' => 'Select an answer from A through E.']);
        }

        $question->update([
            'answer' => $submittedAnswers[0] ?? null,
            'correct_answers' => $submittedAnswers,
            'options' => $questionType === TryOutQuestionType::NumericAnswer ? [] : $options,
            'options_html' => $questionType === TryOutQuestionType::NumericAnswer ? [] : $optionsHtml,
            'points' => $validated['points'] ?? $question->points ?? 1,
            'question_type' => $questionType,
            'question_html' => $questionHtml,
            'question_text' => $questionText,
            'sub_category_name' => filled($validated['sub_category_name'] ?? null) ? $validated['sub_category_name'] : null,
            'subject_id' => $this->matchingSubjectId($validated['subject_name'] ?? null),
            'subject_name' => filled($validated['subject_name'] ?? null) ? $validated['subject_name'] : null,
        ]);

        $assetStorage->finalizeReferencedAssets(
            $tryOut,
            request()->user(),
            $questionHtml,
            ...array_values($optionsHtml),
        );
        $tryOut->touch();

        return back()->with('success', "Question {$question->number} updated successfully.");
    }

    public function template(TryOutDocumentTemplate $template): BinaryFileResponse
    {
        return response()
            ->download(
                $template->create(),
                'averose-try-out-import-template.docx',
                ['Content-Type' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
            )
            ->deleteFileAfterSend();
    }

    public function unpublish(TryOut $tryOut): RedirectResponse
    {
        $tryOut->update(['status' => 'draft']);

        return back()->with('success', "{$tryOut->title} unpublished successfully.");
    }

    public function publish(TryOut $tryOut, TryOutScoringService $scoring): RedirectResponse
    {
        $scoring->validateReadyForPublication($tryOut);

        $tryOut->update([
            'status' => 'public',
        ]);

        return back()->with('success', "{$tryOut->title} published successfully.");
    }

    private function tryOutData(TryOut $tryOut): array
    {
        return [
            'duration' => $tryOut->duration_minutes ? "{$tryOut->duration_minutes} min" : '-',
            'durationMinutes' => $tryOut->duration_minutes,
            'scoringMode' => ($tryOut->scoring_mode ?? TryOutScoringMode::RawScore)->value,
            'correctPoints' => $tryOut->correct_points,
            'wrongPoints' => $tryOut->wrong_points,
            'unansweredPoints' => $tryOut->unanswered_points,
            'id' => (string) $tryOut->id,
            'questions' => $tryOut->questions_count,
            'slug' => $tryOut->slug,
            'status' => str($tryOut->status)->headline()->toString(),
            'statusValue' => $tryOut->status,
            'subjects' => $tryOut->questions
                ->pluck('subject_name')
                ->filter()
                ->unique()
                ->values()
                ->all(),
            'title' => $tryOut->title,
        ];
    }

    private function tryOutGroupData(TryOutGroup $group): array
    {
        return [
            'attemptQuota' => $group->attempt_quota,
            'availableFrom' => $group->available_from->format('M d, Y'),
            'availableUntil' => $group->available_until->format('M d, Y'),
            'id' => (string) $group->id,
            'maxParticipants' => $group->max_participants,
            'name' => $group->name,
            'redeemedCount' => $group->accesses->count(),
            'status' => str($group->status)->headline()->toString(),
            'statusValue' => $group->status,
            'token' => $group->token,
        ];
    }

    private function tryOutQuestionData(TryOutQuestion $question): array
    {
        return [
            'answer' => $question->answer,
            'correctAnswers' => app(TryOutScoringService::class)->correctAnswers($question),
            'id' => (string) $question->id,
            'number' => $question->number,
            'options' => $question->options ?? [],
            'optionsHtml' => $question->options_html ?? [],
            'points' => $question->points,
            'questionHtml' => $question->question_html,
            'questionText' => $question->question_text,
            'questionType' => ($question->question_type ?? TryOutQuestionType::SingleChoice)->value,
            'subCategoryName' => $question->sub_category_name,
            'subjectName' => $question->subject_name,
        ];
    }

    /**
     * @return Collection<int, array{id: string, rank: int, student: array{name: string, email: string}, score: float, correctCount: int, questionCount: int, submittedAt: string|null}>
     */
    private function leaderboardRows(TryOut $tryOut): Collection
    {
        return $this->bestAttemptsByStudent($tryOut)
            ->values()
            ->map(fn (TryOutAttempt $attempt, int $index): array => $this->leaderboardRow($attempt, $index + 1));
    }

    private function leaderboardSummary(TryOut $tryOut): array
    {
        $leaderboardRows = $this->leaderboardRows($tryOut);

        return [
            'averageScore' => $leaderboardRows->isEmpty() ? null : round($leaderboardRows->avg('percentageScore'), 2),
            'highestScore' => $leaderboardRows->max('percentageScore'),
            'participantsCount' => $leaderboardRows->count(),
            'preview' => $leaderboardRows->take(3)->values()->all(),
            'totalAttempts' => $tryOut->attempts()->count(),
        ];
    }

    private function recentAttempts(TryOut $tryOut): array
    {
        return $tryOut->attempts()
            ->with('user:id,name,email')
            ->latest('submitted_at')
            ->latest('id')
            ->take(5)
            ->get()
            ->map(fn (TryOutAttempt $attempt): array => [
                'correctCount' => $attempt->correct_count,
                'id' => (string) $attempt->id,
                'maxScore' => $attempt->max_score ?? 100,
                'percentageScore' => $this->percentageScore($attempt),
                'questionCount' => $attempt->question_count,
                'score' => $attempt->score,
                'student' => [
                    'email' => $attempt->user?->email ?? '-',
                    'name' => $attempt->user?->name ?? 'Unknown Student',
                ],
                'submittedAt' => $attempt->submitted_at?->format('d M Y, H:i'),
            ])
            ->all();
    }

    private function tryOutReadiness(TryOut $tryOut): array
    {
        $questions = $tryOut->questions;
        $hasQuestions = $questions->isNotEmpty();
        $hasAnswerKeys = $hasQuestions && $questions->every(
            fn (TryOutQuestion $question): bool => filled($question->answer) || filled($question->correct_answers),
        );
        $hasSubjects = $hasQuestions && $questions
            ->pluck('subject_name')
            ->filter()
            ->isNotEmpty();
        $scoringConfigured = ($tryOut->scoring_mode ?? TryOutScoringMode::RawScore) === TryOutScoringMode::RawScore
            || (filled($tryOut->correct_points) && $tryOut->wrong_points !== null && $tryOut->unanswered_points !== null);

        $items = [
            [
                'key' => 'questions',
                'label' => 'Questions available',
                'ready' => $hasQuestions,
            ],
            [
                'key' => 'answers',
                'label' => 'Answer keys complete',
                'ready' => $hasAnswerKeys,
            ],
            [
                'key' => 'subjects',
                'label' => 'Subjects detected',
                'ready' => $hasSubjects,
            ],
            [
                'key' => 'scoring',
                'label' => 'Scoring configured',
                'ready' => $scoringConfigured,
            ],
        ];

        return [
            'items' => $items,
            'readyCount' => collect($items)->where('ready', true)->count(),
            'totalCount' => count($items),
        ];
    }

    /**
     * @return Collection<int, TryOutAttempt>
     */
    private function bestAttemptsByStudent(TryOut $tryOut): Collection
    {
        return $tryOut->attempts()
            ->with('user:id,name,email')
            ->get()
            ->sort(function (TryOutAttempt $first, TryOutAttempt $second): int {
                $scoreComparison = $this->percentageScore($second) <=> $this->percentageScore($first);

                if ($scoreComparison !== 0) {
                    return $scoreComparison;
                }

                $submittedComparison = $first->submitted_at->getTimestamp() <=> $second->submitted_at->getTimestamp();

                if ($submittedComparison !== 0) {
                    return $submittedComparison;
                }

                return $first->id <=> $second->id;
            })
            ->groupBy('user_id')
            ->map(fn (Collection $attempts): TryOutAttempt => $attempts->first())
            ->values()
            ->sort(function (TryOutAttempt $first, TryOutAttempt $second): int {
                $scoreComparison = $this->percentageScore($second) <=> $this->percentageScore($first);

                if ($scoreComparison !== 0) {
                    return $scoreComparison;
                }

                $submittedComparison = $first->submitted_at->getTimestamp() <=> $second->submitted_at->getTimestamp();

                if ($submittedComparison !== 0) {
                    return $submittedComparison;
                }

                return $first->id <=> $second->id;
            })
            ->values();
    }

    private function leaderboardRow(TryOutAttempt $attempt, int $rank): array
    {
        return [
            'correctCount' => $attempt->correct_count,
            'id' => (string) $attempt->id,
            'questionCount' => $attempt->question_count,
            'rank' => $rank,
            'score' => $attempt->score,
            'maxScore' => $attempt->max_score ?? 100,
            'percentageScore' => $this->percentageScore($attempt),
            'student' => [
                'email' => $attempt->user?->email ?? '-',
                'name' => $attempt->user?->name ?? 'Unknown Student',
            ],
            'submittedAt' => $attempt->submitted_at?->format('d M Y, H:i'),
        ];
    }

    private function matchingSubjectId(?string $subjectName): ?int
    {
        if (blank($subjectName)) {
            return null;
        }

        return Subject::query()
            ->whereRaw('lower(name) = ?', [Str::lower($subjectName)])
            ->value('id');
    }

    private function percentageScore(TryOutAttempt $attempt): float
    {
        return (float) ($attempt->percentage_score ?? $attempt->score);
    }
}
