<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\ImportTryOutDocumentRequest;
use App\Http\Requests\ReimportTryOutDocumentRequest;
use App\Models\Subject;
use App\Models\TryOut;
use App\Models\TryOutQuestion;
use App\Services\TryOutDocumentImporter;
use App\Services\TryOutDocumentTemplate;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class TryOutController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('admin/try-outs', [
            'tryOuts' => TryOut::query()
                ->with('questions:id,try_out_id,subject_name')
                ->withCount('questions')
                ->latest()
                ->get()
                ->map(fn (TryOut $tryOut): array => $this->tryOutData($tryOut))
                ->all(),
        ]);
    }

    public function preview(ImportTryOutDocumentRequest $request, TryOutDocumentImporter $importer): RedirectResponse
    {
        $document = $request->file('document');
        $questions = $importer->parse($document->getRealPath());

        if ($questions === []) {
            throw ValidationException::withMessages([
                'document' => 'No questions were found in this document.',
            ]);
        }

        $attributes = [
            'duration_minutes' => $request->integer('duration_minutes') ?: null,
            'status' => $request->validated('status'),
            'title' => $request->validated('title'),
        ];
        $sourceFileName = $document->getClientOriginalName();
        $token = (string) Str::uuid();

        Cache::put("try-out-import-preview:{$token}", [
            'attributes' => $attributes,
            'questions' => $questions,
            'source_file_name' => $sourceFileName,
        ], now()->addHour());

        return back()->with('tryOutImportPreview', [
            'durationMinutes' => $attributes['duration_minutes'],
            'questionCount' => count($questions),
            'questions' => $questions,
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
            'token' => ['required', 'string'],
        ]);

        $preview = Cache::pull("try-out-import-preview:{$validated['token']}");

        if (! is_array($preview)) {
            throw ValidationException::withMessages([
                'token' => 'The import preview has expired. Please upload the document again.',
            ]);
        }

        $tryOut = $importer->importParsed(
            $preview['questions'],
            $preview['source_file_name'],
            $preview['attributes']
        );

        return back()->with('success', "{$tryOut->title} imported successfully.");
    }

    public function reimportPreview(ReimportTryOutDocumentRequest $request, TryOut $tryOut, TryOutDocumentImporter $importer): RedirectResponse
    {
        $document = $request->file('document');
        $questions = $importer->parse($document->getRealPath());

        if ($questions === []) {
            throw ValidationException::withMessages([
                'document' => 'No questions were found in this document.',
            ]);
        }

        $token = (string) Str::uuid();

        Cache::put("try-out-reimport-preview:{$token}", [
            'questions' => $questions,
            'try_out_id' => $tryOut->id,
        ], now()->addHour());

        return back()->with('tryOutReimportPreview', [
            'questionCount' => count($questions),
            'questions' => $questions,
            'subjects' => collect($questions)
                ->pluck('subject_name')
                ->filter()
                ->unique()
                ->values()
                ->all(),
            'title' => $tryOut->title,
            'token' => $token,
        ]);
    }

    public function reimport(TryOut $tryOut, TryOutDocumentImporter $importer): RedirectResponse
    {
        $validated = request()->validate([
            'token' => ['required', 'string'],
        ]);

        $preview = Cache::pull("try-out-reimport-preview:{$validated['token']}");

        if (! is_array($preview) || ($preview['try_out_id'] ?? null) !== $tryOut->id) {
            throw ValidationException::withMessages([
                'token' => 'The reimport preview has expired. Please upload the document again.',
            ]);
        }

        $importer->replaceQuestions($tryOut, $preview['questions']);

        return back()->with('success', "{$tryOut->title} questions reimported successfully.");
    }

    public function show(TryOut $tryOut): Response
    {
        $tryOut->load('questions');

        return Inertia::render('admin/try-out-detail', [
            'tryOut' => [
                'duration' => $tryOut->duration_minutes ? "{$tryOut->duration_minutes} min" : '-',
                'id' => (string) $tryOut->id,
                'questions' => $tryOut->questions->map(fn ($question): array => [
                    'answer' => $question->answer,
                    'id' => (string) $question->id,
                    'number' => $question->number,
                    'options' => $question->options ?? [],
                    'optionsHtml' => $question->options_html ?? [],
                    'questionHtml' => $question->question_html,
                    'questionText' => $question->question_text,
                    'subjectName' => $question->subject_name,
                ])->values()->all(),
                'questionsCount' => $tryOut->questions->count(),
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

    public function update(TryOut $tryOut): RedirectResponse
    {
        $validated = request()->validate([
            'duration_minutes' => ['nullable', 'integer', 'min:1', 'max:1000'],
            'title' => ['required', 'string', 'max:255'],
        ]);

        $tryOut->update([
            'duration_minutes' => $validated['duration_minutes'] ?? null,
            'title' => $validated['title'],
        ]);

        return back()->with('success', "{$tryOut->title} updated successfully.");
    }

    public function updateQuestion(TryOut $tryOut, TryOutQuestion $question): RedirectResponse
    {
        abort_unless($question->try_out_id === $tryOut->id, 404);

        $validated = request()->validate([
            'answer' => ['nullable', 'in:none,A,B,C,D,E'],
            'options' => ['required', 'array'],
            'options.A' => ['required', 'string'],
            'options.B' => ['required', 'string'],
            'options.C' => ['required', 'string'],
            'options.D' => ['required', 'string'],
            'options.E' => ['required', 'string'],
            'question_text' => ['required', 'string'],
            'subject_name' => ['nullable', 'string', 'max:255'],
        ]);

        $options = collect($validated['options'])
            ->only(['A', 'B', 'C', 'D', 'E'])
            ->map(fn (string $option): string => trim($option))
            ->all();

        $optionsHtml = collect($options)
            ->map(fn (string $option, string $key): string => ($question->options[$key] ?? null) === $option
                ? ($question->options_html[$key] ?? e($option))
                : e($option)
            )
            ->all();
        $questionHtml = $question->question_text === $validated['question_text']
            ? ($question->question_html ?? e($validated['question_text']))
            : e($validated['question_text']);

        $question->update([
            'answer' => ($validated['answer'] ?? null) === 'none' ? null : $validated['answer'] ?? null,
            'options' => $options,
            'options_html' => $optionsHtml,
            'question_html' => $questionHtml,
            'question_text' => $validated['question_text'],
            'subject_id' => $this->matchingSubjectId($validated['subject_name'] ?? null),
            'subject_name' => filled($validated['subject_name'] ?? null) ? $validated['subject_name'] : null,
        ]);

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

    public function publish(TryOut $tryOut): RedirectResponse
    {
        $tryOut->update(['status' => 'published']);

        return back()->with('success', "{$tryOut->title} published successfully.");
    }

    private function tryOutData(TryOut $tryOut): array
    {
        return [
            'duration' => $tryOut->duration_minutes ? "{$tryOut->duration_minutes} min" : '-',
            'durationMinutes' => $tryOut->duration_minutes,
            'id' => (string) $tryOut->id,
            'questions' => $tryOut->questions_count,
            'slug' => $tryOut->slug,
            'status' => str($tryOut->status)->headline()->toString(),
            'subjects' => $tryOut->questions
                ->pluck('subject_name')
                ->filter()
                ->unique()
                ->values()
                ->all(),
            'title' => $tryOut->title,
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
}
