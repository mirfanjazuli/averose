import { Form, Head, usePage } from '@inertiajs/react';
import { FileText, LoaderCircle, Pencil, Upload } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import InputError from '@/components/input-error';
import { Alert, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { clearTypesetMath, hasMathSource, typesetMath } from '@/lib/mathjax';
import { normalizeTryOutContentHtml } from '@/lib/try-out-content';
import { cn } from '@/lib/utils';
import { TryOutImportDialog } from '@/pages/admin/academics/try-outs/components/try-out-import-dialog';

type PreviewQuestion = {
    answer: string | null;
    correct_answers: string[];
    number: number;
    options: Record<string, string>;
    options_html: Record<string, string>;
    question_html: string;
    question_text: string;
    points: number | null;
    question_type: QuestionType;
    sub_category_name: string | null;
    subject_name: string | null;
};

type ImportPreview = {
    correctPoints: number | null;
    durationMinutes: number | null;
    questionCount: number;
    questions: PreviewQuestion[];
    scoringMode: 'raw_score' | 'negative_marking';
    status: string;
    subjects: string[];
    title: string;
    token: string;
    unansweredPoints: number | null;
    wrongPoints: number | null;
};

type EditingQuestion = {
    answer: string;
    correct_answers: string[];
    number: number;
    options: Record<string, string>;
    original_options: Record<string, string>;
    original_question_text: string;
    points: number | null;
    question_type: QuestionType;
    question_text: string;
    sub_category_name: string;
    subject_name: string;
};

type QuestionType = 'single_choice' | 'multiple_answer' | 'numeric_answer';

const optionKeys = ['A', 'B', 'C', 'D', 'E'] as const;
const initialVisibleQuestionCount = 10;
const visibleQuestionBatchSize = 10;

function escapeHtml(value: string): string {
    return value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;')
        .replaceAll('\n', '<br>');
}

function RichContent({
    className,
    html,
}: {
    className?: string;
    html: string;
}) {
    const contentRef = useRef<HTMLDivElement>(null);
    const containsMath = hasMathSource(html);

    useEffect(() => {
        const element = contentRef.current;

        if (!element) {
            return;
        }

        if (!containsMath) {
            return;
        }

        void typesetMath(element).catch(() => {});

        return () => {
            clearTypesetMath(element);
        };
    }, [containsMath, html]);

    return (
        <div
            ref={contentRef}
            data-try-out-rich-content
            className={className}
            dangerouslySetInnerHTML={{
                __html: normalizeTryOutContentHtml(html),
            }}
        />
    );
}

export default function AdminTryOutImport() {
    const page = usePage<{
        flash?: {
            success?: string;
            tryOutImportPreview?: ImportPreview;
        };
    }>();
    const flashPreview = page.props.flash?.tryOutImportPreview ?? null;
    const [preview, setPreview] = useState<ImportPreview | null>(flashPreview);
    const [questions, setQuestions] = useState<PreviewQuestion[]>(
        () => flashPreview?.questions ?? [],
    );
    const [importOpen, setImportOpen] = useState(false);
    const [editingQuestion, setEditingQuestion] =
        useState<EditingQuestion | null>(null);
    const [visibleQuestionCount, setVisibleQuestionCount] = useState(
        initialVisibleQuestionCount,
    );

    useEffect(() => {
        if (!flashPreview) {
            return;
        }

        let isCurrent = true;

        queueMicrotask(() => {
            if (!isCurrent) {
                return;
            }

            setPreview(flashPreview);
            setQuestions(flashPreview.questions);
            setVisibleQuestionCount(
                Math.min(
                    initialVisibleQuestionCount,
                    flashPreview.questions.length,
                ),
            );
        });

        return () => {
            isCurrent = false;
        };
    }, [flashPreview]);

    useEffect(() => {
        if (visibleQuestionCount >= questions.length) {
            return;
        }

        let timeoutId: ReturnType<typeof setTimeout> | undefined;
        let idleId: number | undefined;
        let isCurrent = true;

        const revealNextBatch = () => {
            if (!isCurrent) {
                return;
            }

            setVisibleQuestionCount((current) =>
                Math.min(current + visibleQuestionBatchSize, questions.length),
            );
        };

        const browserWindow = typeof window === 'undefined' ? null : window;

        if (!browserWindow) {
            return () => {
                isCurrent = false;
            };
        }

        if ('requestIdleCallback' in browserWindow) {
            idleId = browserWindow.requestIdleCallback(revealNextBatch, {
                timeout: 600,
            });
        } else {
            timeoutId = setTimeout(revealNextBatch, 80);
        }

        return () => {
            isCurrent = false;

            if (idleId !== undefined) {
                browserWindow.cancelIdleCallback(idleId);
            }

            if (timeoutId !== undefined) {
                clearTimeout(timeoutId);
            }
        };
    }, [questions.length, visibleQuestionCount]);

    const openEditQuestion = (question: PreviewQuestion) => {
        setEditingQuestion({
            answer: question.answer ?? 'none',
            correct_answers:
                question.correct_answers ??
                (question.answer ? [question.answer] : []),
            number: question.number,
            options: { ...question.options },
            original_options: { ...question.options },
            original_question_text: question.question_text,
            points: question.points,
            question_type: question.question_type ?? 'single_choice',
            question_text: question.question_text,
            sub_category_name: question.sub_category_name ?? '',
            subject_name: question.subject_name ?? '',
        });
    };

    const saveEditingQuestion = () => {
        if (!editingQuestion) {
            return;
        }

        setQuestions((currentQuestions) =>
            currentQuestions.map((question) => {
                if (question.number !== editingQuestion.number) {
                    return question;
                }

                const options = Object.fromEntries(
                    optionKeys.map((key) => [
                        key,
                        editingQuestion.options[key] ?? '',
                    ]),
                );

                return {
                    ...question,
                    answer:
                        editingQuestion.question_type === 'multiple_answer'
                            ? (editingQuestion.correct_answers[0] ?? null)
                            : editingQuestion.answer === 'none'
                              ? null
                              : editingQuestion.answer,
                    correct_answers:
                        editingQuestion.question_type === 'multiple_answer'
                            ? [...editingQuestion.correct_answers].sort()
                            : editingQuestion.answer === 'none'
                              ? []
                              : [editingQuestion.answer],
                    options:
                        editingQuestion.question_type === 'numeric_answer'
                            ? {}
                            : options,
                    options_html:
                        editingQuestion.question_type === 'numeric_answer'
                            ? {}
                            : Object.fromEntries(
                                  optionKeys.map((key) => [
                                      key,
                                      editingQuestion.original_options[key] ===
                                      options[key]
                                          ? (question.options_html[key] ??
                                            escapeHtml(options[key] ?? ''))
                                          : escapeHtml(options[key] ?? ''),
                                  ]),
                              ),
                    question_html:
                        editingQuestion.original_question_text ===
                        editingQuestion.question_text
                            ? question.question_html
                            : escapeHtml(editingQuestion.question_text),
                    question_text: editingQuestion.question_text,
                    points: editingQuestion.points,
                    question_type: editingQuestion.question_type,
                    sub_category_name:
                        editingQuestion.sub_category_name.trim() || null,
                    subject_name: editingQuestion.subject_name.trim() || null,
                };
            }),
        );
        setEditingQuestion(null);
    };

    return (
        <>
            <Head title="Import Try Out" />
            <div className="flex h-full min-w-0 max-w-full flex-1 flex-col gap-6 overflow-hidden p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="font-heading text-2xl font-semibold">
                            Import
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Import try out questions and answers.
                        </p>
                    </div>
                    {preview && (
                        <div className="flex flex-wrap gap-2">
                            <TryOutImportDialog
                                open={importOpen}
                                onOpenChange={setImportOpen}
                                trigger={
                                    <Button type="button" variant="outline">
                                        Upload another
                                    </Button>
                                }
                            />
                            <Form
                                action="/academics/try-outs/import"
                                method="post"
                                onError={() => {
                                    toast.error(
                                        'Failed to save try out. Please regenerate the preview if it has expired.',
                                    );
                                }}
                            >
                                {({ errors, processing }) => (
                                    <div className="space-y-2">
                                        <input
                                            type="hidden"
                                            name="token"
                                            value={preview.token}
                                        />
                                        <input
                                            type="hidden"
                                            name="questions"
                                            value={JSON.stringify(questions)}
                                        />
                                        <InputError
                                            message={errors.token}
                                            className="text-right"
                                        />
                                        <InputError
                                            message={errors.questions}
                                            className="max-w-md text-right"
                                        />
                                        <Button
                                            type="submit"
                                            disabled={processing}
                                            className="gap-2"
                                        >
                                            {processing ? (
                                                <LoaderCircle className="size-4 animate-spin" />
                                            ) : (
                                                <Upload className="size-4" />
                                            )}
                                            {processing
                                                ? 'Saving...'
                                                : 'Confirm import'}
                                        </Button>
                                    </div>
                                )}
                            </Form>
                        </div>
                    )}
                </div>

                {!preview ? (
                    <Alert>
                        <FileText className="size-4" />
                        <AlertTitle>No preview yet</AlertTitle>
                    </Alert>
                ) : (
                    <div className="space-y-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <p className="text-sm font-medium">
                                    Review generated questions
                                </p>
                            </div>
                        </div>

                        <div className="grid gap-3 rounded-xl bg-muted/35 p-4 text-sm md:grid-cols-4">
                            <div>
                                <p className="text-muted-foreground">Title</p>
                                <p className="font-medium">{preview.title}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Status</p>
                                <p className="font-medium">{preview.status}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">
                                    Duration
                                </p>
                                <p className="font-medium">
                                    {preview.durationMinutes
                                        ? `${preview.durationMinutes} minutes`
                                        : '-'}
                                </p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">
                                    Questions
                                </p>
                                <p className="font-medium">
                                    {questions.length}
                                </p>
                            </div>
                        </div>

                        <div className="mx-auto max-w-3xl space-y-12 py-4">
                            {questions
                                .slice(0, visibleQuestionCount)
                                .map((question) => (
                                    <section
                                        key={question.number}
                                        className="grid gap-6 md:grid-cols-[minmax(0,1fr)_3rem]"
                                    >
                                        <div className="min-w-0 space-y-6">
                                            <p className="font-semibold text-foreground/90">
                                                Kategori:{' '}
                                                {question.subject_name ??
                                                    'General'}
                                            </p>
                                            {question.sub_category_name && (
                                                <p className="-mt-4 text-sm font-medium text-muted-foreground">
                                                    Sub kategori:{' '}
                                                    {
                                                        question.sub_category_name
                                                    }
                                                </p>
                                            )}

                                            <RichContent
                                                className="block text-lg leading-8 whitespace-pre-wrap text-foreground/90"
                                                html={
                                                    question.question_html ||
                                                    question.question_text
                                                }
                                            />

                                            {question.question_type ===
                                                'numeric_answer' && (
                                                <div className="text-sm">
                                                    <p className="text-muted-foreground">
                                                        Answer
                                                    </p>
                                                    <p className="mt-1 text-lg leading-8 font-semibold text-emerald-600">
                                                        {question.answer ?? '-'}
                                                    </p>
                                                </div>
                                            )}

                                            {question.question_type !==
                                                'numeric_answer' && (
                                                <div className="space-y-4">
                                                    {Object.entries(
                                                        question.options,
                                                    ).map(([key, value]) => {
                                                        const answerKey =
                                                            question.correct_answers?.includes(
                                                                key,
                                                            ) ??
                                                            question.answer ===
                                                                key;

                                                        return (
                                                            <div
                                                                key={key}
                                                                className="grid grid-cols-[3rem_minmax(0,1fr)] items-start gap-4"
                                                            >
                                                                <span
                                                                    className={cn(
                                                                        'flex size-12 items-center justify-center rounded-lg border-2 text-sm font-semibold',
                                                                        answerKey
                                                                            ? 'border-emerald-400 text-emerald-600'
                                                                            : 'border-border text-foreground/80',
                                                                    )}
                                                                >
                                                                    {key}
                                                                </span>
                                                                <RichContent
                                                                    className="block pt-3 text-base leading-7 text-foreground/85"
                                                                    html={
                                                                        question
                                                                            .options_html[
                                                                            key
                                                                        ] ??
                                                                        value
                                                                    }
                                                                />
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>

                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            className="order-first flex size-12 items-center justify-center rounded-lg border-2 text-sm font-semibold md:order-none"
                                            onClick={() =>
                                                openEditQuestion(question)
                                            }
                                        >
                                            <Pencil className="size-4" />
                                            <span className="sr-only">
                                                Edit question {question.number}
                                            </span>
                                        </Button>
                                    </section>
                                ))}
                            {visibleQuestionCount < questions.length && (
                                <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                                    Rendering {visibleQuestionCount} of{' '}
                                    {questions.length} questions...
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <Dialog
                    open={!!editingQuestion}
                    onOpenChange={(open) => {
                        if (!open) {
                            setEditingQuestion(null);
                        }
                    }}
                >
                    <DialogContent className="scrollbar-stable max-h-[90vh] overflow-y-auto sm:max-w-3xl">
                        <DialogHeader>
                            <DialogTitle>
                                Edit question {editingQuestion?.number}
                            </DialogTitle>
                            <DialogDescription>
                                Update the generated question before importing.
                            </DialogDescription>
                        </DialogHeader>
                        {editingQuestion && (
                            <div className="space-y-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-subject">
                                        Subject
                                    </Label>
                                    <Input
                                        id="edit-subject"
                                        value={editingQuestion.subject_name}
                                        onChange={(event) =>
                                            setEditingQuestion((current) =>
                                                current
                                                    ? {
                                                          ...current,
                                                          subject_name:
                                                              event.target
                                                                  .value,
                                                      }
                                                    : current,
                                            )
                                        }
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-sub-category">
                                        Sub Category
                                    </Label>
                                    <Input
                                        id="edit-sub-category"
                                        value={
                                            editingQuestion.sub_category_name
                                        }
                                        onChange={(event) =>
                                            setEditingQuestion((current) =>
                                                current
                                                    ? {
                                                          ...current,
                                                          sub_category_name:
                                                              event.target
                                                                  .value,
                                                      }
                                                    : current,
                                            )
                                        }
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="edit-question">
                                        Question
                                    </Label>
                                    <Textarea
                                        id="edit-question"
                                        value={editingQuestion.question_text}
                                        onChange={(event) =>
                                            setEditingQuestion((current) =>
                                                current
                                                    ? {
                                                          ...current,
                                                          question_text:
                                                              event.target
                                                                  .value,
                                                      }
                                                    : current,
                                            )
                                        }
                                        rows={5}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="edit-question-type">
                                        Type
                                    </Label>
                                    <Select
                                        value={editingQuestion.question_type}
                                        onValueChange={(questionType) =>
                                            setEditingQuestion((current) =>
                                                current
                                                    ? {
                                                          ...current,
                                                          question_type:
                                                              questionType as QuestionType,
                                                      }
                                                    : current,
                                            )
                                        }
                                    >
                                        <SelectTrigger
                                            id="edit-question-type"
                                            className="w-full"
                                        >
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="single_choice">
                                                Single choice
                                            </SelectItem>
                                            <SelectItem value="multiple_answer">
                                                Multiple answer
                                            </SelectItem>
                                            <SelectItem value="numeric_answer">
                                                Numeric answer
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {['single_choice', 'multiple_answer'].includes(
                                    editingQuestion.question_type,
                                ) && (
                                    <div className="grid gap-3">
                                        {optionKeys.map((optionKey) => (
                                            <div
                                                key={optionKey}
                                                className="grid gap-2"
                                            >
                                                <Label
                                                    htmlFor={`edit-option-${optionKey}`}
                                                >
                                                    Option {optionKey}
                                                </Label>
                                                <Textarea
                                                    id={`edit-option-${optionKey}`}
                                                    value={
                                                        editingQuestion.options[
                                                            optionKey
                                                        ] ?? ''
                                                    }
                                                    onChange={(event) =>
                                                        setEditingQuestion(
                                                            (current) =>
                                                                current
                                                                    ? {
                                                                          ...current,
                                                                          options:
                                                                              {
                                                                                  ...current.options,
                                                                                  [optionKey]:
                                                                                      event
                                                                                          .target
                                                                                          .value,
                                                                              },
                                                                      }
                                                                    : current,
                                                        )
                                                    }
                                                    rows={2}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {editingQuestion.question_type ===
                                'multiple_answer' ? (
                                    <div className="grid gap-3">
                                        <Label>Correct answers</Label>
                                        <div className="flex flex-wrap gap-4">
                                            {optionKeys.map((optionKey) => (
                                                <Label
                                                    key={optionKey}
                                                    className="flex items-center gap-2 font-normal"
                                                >
                                                    <Checkbox
                                                        checked={editingQuestion.correct_answers.includes(
                                                            optionKey,
                                                        )}
                                                        onCheckedChange={(
                                                            checked,
                                                        ) =>
                                                            setEditingQuestion(
                                                                (current) =>
                                                                    current
                                                                        ? {
                                                                              ...current,
                                                                              correct_answers:
                                                                                  checked
                                                                                      ? [
                                                                                            ...current.correct_answers,
                                                                                            optionKey,
                                                                                        ]
                                                                                      : current.correct_answers.filter(
                                                                                            (
                                                                                                answer,
                                                                                            ) =>
                                                                                                answer !==
                                                                                                optionKey,
                                                                                        ),
                                                                          }
                                                                        : current,
                                                            )
                                                        }
                                                    />
                                                    {optionKey}
                                                </Label>
                                            ))}
                                        </div>
                                    </div>
                                ) : editingQuestion.question_type ===
                                  'single_choice' ? (
                                    <div className="grid gap-2">
                                        <Label htmlFor="edit-answer">
                                            Answer
                                        </Label>
                                        <Select
                                            value={editingQuestion.answer}
                                            onValueChange={(answer) =>
                                                setEditingQuestion((current) =>
                                                    current
                                                        ? { ...current, answer }
                                                        : current,
                                                )
                                            }
                                        >
                                            <SelectTrigger
                                                id="edit-answer"
                                                className="w-full"
                                            >
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">
                                                    None
                                                </SelectItem>
                                                {optionKeys.map((optionKey) => (
                                                    <SelectItem
                                                        key={optionKey}
                                                        value={optionKey}
                                                    >
                                                        {optionKey}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                ) : (
                                    <div className="grid gap-2">
                                        <Label htmlFor="edit-numeric-answer">
                                            Numeric answer
                                        </Label>
                                        <Input
                                            id="edit-numeric-answer"
                                            inputMode="decimal"
                                            value={editingQuestion.answer}
                                            onChange={(event) =>
                                                setEditingQuestion((current) =>
                                                    current
                                                        ? {
                                                              ...current,
                                                              answer: event
                                                                  .target.value,
                                                          }
                                                        : current,
                                                )
                                            }
                                        />
                                    </div>
                                )}

                                {preview?.scoringMode === 'raw_score' && (
                                    <div className="grid gap-2">
                                        <Label htmlFor="edit-points">
                                            Score
                                        </Label>
                                        <Input
                                            id="edit-points"
                                            type="number"
                                            min="0"
                                            max="100"
                                            step="0.0001"
                                            value={editingQuestion.points ?? ''}
                                            onChange={(event) =>
                                                setEditingQuestion((current) =>
                                                    current
                                                        ? {
                                                              ...current,
                                                              points:
                                                                  event.target
                                                                      .value ===
                                                                  ''
                                                                      ? null
                                                                      : Number(
                                                                            event
                                                                                .target
                                                                                .value,
                                                                        ),
                                                          }
                                                        : current,
                                                )
                                            }
                                        />
                                    </div>
                                )}

                                <DialogFooter className="pt-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setEditingQuestion(null)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={saveEditingQuestion}
                                    >
                                        Save changes
                                    </Button>
                                </DialogFooter>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}
