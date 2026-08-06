<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Http\Requests\SubmitTryOutAttemptRequest;
use App\Models\TryOut;
use App\Models\TryOutAccess;
use App\Models\TryOutAttempt;
use App\Models\TryOutGroup;
use App\Models\User;
use App\Services\TryOutAssetStorage;
use App\Services\TryOutScoringService;
use App\TryOutQuestionType;
use App\TryOutScoringMode;
use Illuminate\Contracts\Cache\LockTimeoutException;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class TryOutController extends Controller
{
    public function index(): Response
    {
        /** @var User $user */
        $user = Auth::user();
        $today = now()->toDateString();
        $attempts = TryOutAttempt::query()->whereBelongsTo($user);
        $bestScore = (clone $attempts)
            ->selectRaw('MAX(COALESCE(percentage_score, score)) as best_score')
            ->value('best_score');

        return Inertia::render('student/try-outs/index', [
            'summary' => [
                'bestScore' => $bestScore === null ? null : (float) $bestScore,
                'completed' => (clone $attempts)->count(),
            ],
            'tryOuts' => TryOut::query()
                ->withCount('questions')
                ->with(['accesses' => fn ($query) => $query
                    ->whereBelongsTo($user)
                    ->where('status', 'active')
                    ->whereDate('available_from', '<=', $today)
                    ->whereDate('available_until', '>=', $today)
                    ->whereColumn('attempts_used', '<', 'attempt_quota')
                    ->orderBy('available_until')
                    ->orderBy('id')])
                ->where(function (Builder $query) use ($today, $user): void {
                    $query
                        ->where('status', 'public')
                        ->orWhere(function (Builder $query) use ($today, $user): void {
                            $query
                                ->where('status', 'private')
                                ->whereHas('accesses', fn (Builder $query) => $query
                                    ->whereBelongsTo($user)
                                    ->where('status', 'active')
                                    ->whereDate('available_from', '<=', $today)
                                    ->whereDate('available_until', '>=', $today)
                                    ->whereColumn('attempts_used', '<', 'attempt_quota'));
                        });
                })
                ->latest()
                ->get()
                ->map(fn (TryOut $tryOut): array => $this->tryOutCardData($tryOut))
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

        return Inertia::render('student/try-outs/results/index', [
            'attempts' => $attempts
                ->map(fn (TryOutAttempt $attempt): array => [
                    'correctCount' => $attempt->correct_count,
                    'id' => (string) $attempt->id,
                    'questionCount' => $attempt->question_count,
                    'score' => $attempt->score,
                    'maxScore' => $attempt->max_score ?? 100,
                    'percentageScore' => $this->percentageScore($attempt),
                    'submittedAt' => $attempt->submitted_at?->toJSON(),
                    'tryOut' => [
                        'slug' => $attempt->tryOut->slug,
                        'title' => $attempt->tryOut->title,
                    ],
                ])
                ->all(),
        ]);
    }

    public function redeem(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'token' => ['required', 'string', 'max:32'],
        ]);

        /** @var User $user */
        $user = $request->user();
        $token = Str::upper(preg_replace('/\s+/', '', $validated['token']));

        $message = DB::transaction(function () use ($token, $user): string {
            $group = TryOutGroup::query()
                ->with('tryOut')
                ->where('token', $token)
                ->lockForUpdate()
                ->first();

            if (! $group || $group->status !== 'active' || $group->tryOut?->status !== 'private') {
                throw ValidationException::withMessages([
                    'token' => 'Token try out tidak valid.',
                ]);
            }

            if ($group->available_until->copy()->endOfDay()->isPast()) {
                throw ValidationException::withMessages([
                    'token' => 'Token try out sudah kedaluwarsa.',
                ]);
            }

            $existingAccess = TryOutAccess::query()
                ->whereBelongsTo($user)
                ->where('try_out_group_id', $group->id)
                ->first();

            if ($existingAccess) {
                if ($existingAccess->isActiveFor()) {
                    return 'Token try out sudah pernah digunakan.';
                }

                throw ValidationException::withMessages([
                    'token' => 'Akses dari token ini sudah tidak aktif atau attempt sudah habis.',
                ]);
            }

            if ($group->max_participants !== null && $group->accesses()->count() >= $group->max_participants) {
                throw ValidationException::withMessages([
                    'token' => 'Kuota peserta token try out sudah penuh.',
                ]);
            }

            $user->tryOutAccesses()->create([
                'attempt_quota' => $group->attempt_quota,
                'available_from' => $group->available_from,
                'available_until' => $group->available_until,
                'status' => 'active',
                'try_out_group_id' => $group->id,
                'try_out_id' => $group->try_out_id,
            ]);

            return 'Token try out berhasil digunakan.';
        }, 3);

        return back()->with('success', $message);
    }

    public function show(TryOut $tryOut, TryOutAssetStorage $assetStorage): Response
    {
        abort_unless($this->activeAccessFor($tryOut, Auth::user()) !== false, 404);

        return Inertia::render('student/try-outs/session', [
            'tryOut' => $this->tryOutSessionData($tryOut, $assetStorage),
        ]);
    }

    public function result(TryOut $tryOut, TryOutAttempt $tryOutAttempt, TryOutAssetStorage $assetStorage): Response
    {
        abort_unless($tryOutAttempt->try_out_id === $tryOut->id, 404);
        abort_unless($tryOutAttempt->user_id === Auth::id(), 403);

        $tryOut->load('questions');
        $snapshotQuestions = $tryOutAttempt->question_snapshot;
        $questions = is_array($snapshotQuestions) && $snapshotQuestions !== []
            ? $snapshotQuestions
            : $tryOut->questions->map(fn ($question): array => [
                'answer' => $question->answer,
                'correctAnswers' => app(TryOutScoringService::class)->correctAnswers($question),
                'id' => (string) $question->id,
                'number' => $question->number,
                'options' => $question->options,
                'optionsHtml' => $question->options_html ?? $question->options,
                'points' => $question->points,
                'questionHtml' => $question->question_html ?? e($question->question_text),
                'questionText' => $question->question_text,
                'questionType' => ($question->question_type ?? TryOutQuestionType::SingleChoice)->value,
                'subCategoryName' => $question->sub_category_name,
                'subjectName' => $question->subject_name,
            ])->values()->all();
        $questions = $this->resolveSessionAssetUrls($tryOut, $assetStorage, ['questions' => $questions])['questions'];

        return Inertia::render('student/try-outs/results/show', [
            'attempt' => [
                'answers' => collect($tryOutAttempt->answers ?? [])
                    ->mapWithKeys(fn ($answer, string|int $questionId): array => [(string) $questionId => $answer])
                    ->all(),
                'correctCount' => $tryOutAttempt->correct_count,
                'partialCount' => $tryOutAttempt->partial_count ?? 0,
                'wrongCount' => $tryOutAttempt->wrong_count ?? max(0, $tryOutAttempt->question_count - $tryOutAttempt->correct_count),
                'unansweredCount' => $tryOutAttempt->unanswered_count ?? 0,
                'id' => (string) $tryOutAttempt->id,
                'questionCount' => $tryOutAttempt->question_count,
                'score' => $tryOutAttempt->score,
                'maxScore' => $tryOutAttempt->max_score ?? 100,
                'percentageScore' => $this->percentageScore($tryOutAttempt),
                'scoreBreakdown' => $tryOutAttempt->score_breakdown ?? [],
                'scoringMode' => ($tryOutAttempt->scoring_mode ?? TryOutScoringMode::RawScore)->value,
                'submittedAt' => $tryOutAttempt->submitted_at?->toJSON(),
            ],
            'tryOut' => [
                'id' => (string) $tryOut->id,
                'questions' => $questions,
                'slug' => $tryOut->slug,
                'title' => $tryOut->title,
            ],
        ]);
    }

    public function submit(
        SubmitTryOutAttemptRequest $request,
        TryOut $tryOut,
        TryOutScoringService $scoring,
    ): RedirectResponse {
        try {
            $attempt = Cache::lock("try-out-submit:{$tryOut->id}:{$request->user()->id}", 30)
                ->block(10, fn (): TryOutAttempt => DB::transaction(function () use ($request, $scoring, $tryOut): TryOutAttempt {
                    $access = $this->activeAccessFor($tryOut, $request->user(), true);
                    abort_unless($access !== false, 404);

                    $questions = $tryOut->questions()->get();
                    $result = $scoring->score($tryOut, $questions, $request->validated('answers'));
                    $attempt = TryOutAttempt::query()->create([
                        ...$result,
                        'question_count' => $questions->count(),
                        'submitted_at' => now(),
                        'try_out_id' => $tryOut->id,
                        'try_out_access_id' => $access?->id,
                        'user_id' => $request->user()->id,
                        'scoring_mode' => ($tryOut->scoring_mode ?? TryOutScoringMode::RawScore)->value,
                    ]);

                    if ($access instanceof TryOutAccess) {
                        $access->increment('attempts_used');
                    }

                    return $attempt;
                }, 3));
        } catch (LockTimeoutException) {
            throw ValidationException::withMessages([
                'answers' => 'Your previous submission is still being processed. Please wait a moment.',
            ]);
        }

        return redirect()
            ->route('try-outs.results.show', [$tryOut, $attempt])
            ->with('success', 'Try out submitted.');
    }

    private function activeAccessFor(TryOut $tryOut, ?User $user, bool $lock = false): TryOutAccess|bool|null
    {
        if ($tryOut->status === 'public') {
            return null;
        }

        if ($tryOut->status !== 'private' || $user === null) {
            return false;
        }

        $today = now()->toDateString();

        return TryOutAccess::query()
            ->whereBelongsTo($tryOut)
            ->whereBelongsTo($user)
            ->where('status', 'active')
            ->whereDate('available_from', '<=', $today)
            ->whereDate('available_until', '>=', $today)
            ->whereColumn('attempts_used', '<', 'attempt_quota')
            ->orderBy('available_until')
            ->orderBy('id')
            ->when($lock, fn (Builder $query) => $query->lockForUpdate())
            ->first() ?? false;
    }

    private function percentageScore(TryOutAttempt $attempt): float
    {
        return (float) ($attempt->percentage_score ?? $attempt->score);
    }

    private function tryOutCardData(TryOut $tryOut): array
    {
        /** @var TryOutAccess|null $access */
        $access = $tryOut->accesses->first();

        return [
            'accessEndsAt' => $access?->available_until?->format('d M Y'),
            'accessStartsAt' => $access?->available_from?->format('d M Y'),
            'duration' => $tryOut->duration_minutes ? "{$tryOut->duration_minutes} min" : '-',
            'durationMinutes' => $tryOut->duration_minutes,
            'id' => (string) $tryOut->id,
            'questions' => $tryOut->questions_count,
            'remainingAttempts' => $access?->remainingAttempts(),
            'scoringMode' => ($tryOut->scoring_mode ?? TryOutScoringMode::RawScore)->value,
            'slug' => $tryOut->slug,
            'status' => $tryOut->status === 'private' ? 'Private' : 'Public',
            'title' => $tryOut->title,
        ];
    }

    private function tryOutSessionData(TryOut $tryOut, TryOutAssetStorage $assetStorage): array
    {
        $data = Cache::remember(
            "try-out-session:{$tryOut->id}:{$tryOut->updated_at?->timestamp}",
            now()->addMinutes(30),
            function () use ($tryOut): array {
                $tryOut->loadMissing('questions');

                return [
                    'durationMinutes' => $tryOut->duration_minutes,
                    'id' => (string) $tryOut->id,
                    'scoringMode' => ($tryOut->scoring_mode ?? TryOutScoringMode::RawScore)->value,
                    'questions' => $tryOut->questions->map(fn ($question): array => [
                        'id' => (string) $question->id,
                        'number' => $question->number,
                        'options' => $question->options,
                        'optionsHtml' => $question->options_html ?? $question->options,
                        'questionHtml' => $question->question_html ?? e($question->question_text),
                        'questionText' => $question->question_text,
                        'questionType' => ($question->question_type ?? TryOutQuestionType::SingleChoice)->value,
                        'subCategoryName' => $question->sub_category_name,
                        'subjectName' => $question->subject_name,
                    ])->values()->all(),
                    'slug' => $tryOut->slug,
                    'title' => $tryOut->title,
                ];
            },
        );

        return $this->resolveSessionAssetUrls($tryOut, $assetStorage, $data);
    }

    private function resolveSessionAssetUrls(TryOut $tryOut, TryOutAssetStorage $assetStorage, array $data): array
    {
        $htmlValues = [];
        $locations = [];

        foreach ($data['questions'] ?? [] as $questionIndex => $question) {
            if (isset($question['questionHtml']) && is_string($question['questionHtml'])) {
                $locations[] = [$questionIndex, 'questionHtml', null];
                $htmlValues[] = $question['questionHtml'];
            }

            foreach (($question['optionsHtml'] ?? []) as $optionKey => $optionHtml) {
                if (! is_string($optionHtml)) {
                    continue;
                }

                $locations[] = [$questionIndex, 'optionsHtml', $optionKey];
                $htmlValues[] = $optionHtml;
            }
        }

        if ($htmlValues === []) {
            return $data;
        }

        $resolvedValues = $assetStorage->resolveTryOutAssetUrls($tryOut, $htmlValues);

        foreach ($locations as $index => [$questionIndex, $field, $optionKey]) {
            if ($optionKey === null) {
                $data['questions'][$questionIndex][$field] = $resolvedValues[$index];

                continue;
            }

            $data['questions'][$questionIndex][$field][$optionKey] = $resolvedValues[$index];
        }

        return $data;
    }
}
