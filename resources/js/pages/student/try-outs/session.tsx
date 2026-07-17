import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    CheckCircle2,
    Clock3,
    Flag,
    Loader2,
    Send,
} from 'lucide-react';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { clearTypesetMath, hasMathSource, typesetMath } from '@/lib/mathjax';
import { normalizeTryOutContentHtml } from '@/lib/try-out-content';
import { cn } from '@/lib/utils';

type Question = {
    id: string;
    number: number;
    options: Record<string, string>;
    optionsHtml: Record<string, string>;
    questionHtml: string;
    questionText: string;
    questionType: 'single_choice' | 'multiple_answer' | 'numeric_answer';
    subjectName: string | null;
};

type AnswerValue = string | string[];

function isAnswerList(value: AnswerValue | undefined): value is string[] {
    return Array.isArray(value);
}

type TryOut = {
    durationMinutes: number | null;
    id: string;
    questions: Question[];
    scoringMode: 'raw_score' | 'negative_marking';
    slug: string;
    title: string;
};

type SavedTryOutProgress = {
    activeIndex?: number;
    answers?: Record<string, AnswerValue>;
    flaggedQuestions?: Record<string, boolean>;
    startedAt?: number;
    scoringMode?: TryOut['scoringMode'];
};

const progressStorageKey = (tryOutId: string) => `try-out-progress:${tryOutId}`;

const readSavedProgress = (tryOutId: string): SavedTryOutProgress => {
    if (typeof window === 'undefined') {
        return {};
    }

    const savedProgress = window.localStorage.getItem(
        progressStorageKey(tryOutId),
    );

    if (!savedProgress) {
        return {};
    }

    try {
        return JSON.parse(savedProgress) as SavedTryOutProgress;
    } catch {
        return {};
    }
};

const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds
        .toString()
        .padStart(2, '0')}`;
};

function RichContent({
    className,
    html,
}: {
    className?: string;
    html: string;
}) {
    return (
        <span
            data-try-out-rich-content
            className={className}
            dangerouslySetInnerHTML={{
                __html: normalizeTryOutContentHtml(html),
            }}
        />
    );
}

const CountdownBadge = memo(function CountdownBadge({
    durationSeconds,
    onExpired,
    startedAt,
}: {
    durationSeconds: number;
    onExpired: () => void;
    startedAt: number | null;
}) {
    const [remainingSeconds, setRemainingSeconds] = useState(durationSeconds);
    const hasExpiredRef = useRef(false);

    useEffect(() => {
        if (!durationSeconds || startedAt === null) {
            return;
        }

        hasExpiredRef.current = false;

        const updateRemainingSeconds = () => {
            const nextRemainingSeconds = Math.max(
                0,
                durationSeconds - Math.floor((Date.now() - startedAt) / 1000),
            );

            setRemainingSeconds(nextRemainingSeconds);

            if (nextRemainingSeconds === 0 && !hasExpiredRef.current) {
                hasExpiredRef.current = true;
                onExpired();
            }
        };

        updateRemainingSeconds();

        const interval = window.setInterval(updateRemainingSeconds, 1000);

        return () => window.clearInterval(interval);
    }, [durationSeconds, onExpired, startedAt]);

    return (
        <Badge
            variant="secondary"
            className="gap-1.5 px-4 py-2 text-base font-semibold text-destructive"
        >
            <Clock3 className="size-4" />
            {durationSeconds ? formatTime(remainingSeconds) : 'No timer'}
        </Badge>
    );
});

export default function StudentTryOutSession({ tryOut }: { tryOut: TryOut }) {
    const durationSeconds = (tryOut.durationMinutes ?? 0) * 60;
    const [isProgressHydrated, setIsProgressHydrated] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
    const [flaggedQuestions, setFlaggedQuestions] = useState<
        Record<string, boolean>
    >({});
    const [startedAt, setStartedAt] = useState<number | null>(null);
    const [submitConfirmOpen, setSubmitConfirmOpen] = useState(false);
    const [timeExpiredOpen, setTimeExpiredOpen] = useState(false);
    const [submitProcessing, setSubmitProcessing] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const questionContentRef = useRef<HTMLDivElement>(null);
    const hasTimeExpiredAlertOpenedRef = useRef(false);
    const activeQuestion = tryOut.questions[activeIndex];
    const answeredCount = Object.values(answers).filter((answer) =>
        typeof answer === 'string'
            ? Boolean(answer)
            : Object.keys(answer).length > 0,
    ).length;
    const flaggedCount = Object.values(flaggedQuestions).filter(Boolean).length;
    const unansweredCount = Math.max(
        0,
        tryOut.questions.length - answeredCount,
    );
    const completionPercentage =
        tryOut.questions.length > 0
            ? Math.round((answeredCount / tryOut.questions.length) * 100)
            : 0;

    const subjectTabs = useMemo(
        () =>
            [
                ...new Set(
                    tryOut.questions.map((question) => question.subjectName),
                ),
            ]
                .filter(Boolean)
                .join(' / '),
        [tryOut.questions],
    );

    useEffect(() => {
        let isCurrent = true;

        queueMicrotask(() => {
            if (!isCurrent) {
                return;
            }

            const savedProgress = readSavedProgress(tryOut.id);
            const hydratedStartedAt = savedProgress.startedAt ?? Date.now();
            const hydratedActiveIndex = Math.max(
                0,
                Math.min(
                    savedProgress.activeIndex ?? 0,
                    tryOut.questions.length - 1,
                ),
            );

            setActiveIndex(hydratedActiveIndex);
            const savedAnswers =
                savedProgress.scoringMode &&
                savedProgress.scoringMode !== tryOut.scoringMode
                    ? {}
                    : tryOut.questions.reduce<Record<string, AnswerValue>>(
                          (normalizedAnswers, question) => {
                              const answer =
                                  savedProgress.answers?.[question.id];

                              if (question.questionType === 'multiple_answer') {
                                  const selectedAnswers = Array.isArray(answer)
                                      ? answer
                                      : typeof answer === 'string'
                                        ? [answer]
                                        : [];

                                  if (selectedAnswers.length > 0) {
                                      normalizedAnswers[question.id] =
                                          selectedAnswers;
                                  }

                                  return normalizedAnswers;
                              }

                              const selectedAnswer =
                                  typeof answer === 'string'
                                      ? answer
                                      : Array.isArray(answer) &&
                                          answer.length === 1
                                        ? answer[0]
                                        : null;

                              if (selectedAnswer) {
                                  normalizedAnswers[question.id] =
                                      selectedAnswer;
                              }

                              return normalizedAnswers;
                          },
                          {},
                      );

            setAnswers(savedAnswers);
            setFlaggedQuestions(savedProgress.flaggedQuestions ?? {});
            setStartedAt(hydratedStartedAt);
            setIsProgressHydrated(true);
        });

        return () => {
            isCurrent = false;
        };
    }, [durationSeconds, tryOut.id, tryOut.questions, tryOut.scoringMode]);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        if (!isProgressHydrated || startedAt === null) {
            return;
        }

        window.localStorage.setItem(
            progressStorageKey(tryOut.id),
            JSON.stringify({
                activeIndex,
                answers,
                flaggedQuestions,
                scoringMode: tryOut.scoringMode,
                startedAt,
            }),
        );
    }, [
        activeIndex,
        answers,
        flaggedQuestions,
        isProgressHydrated,
        startedAt,
        tryOut.id,
        tryOut.scoringMode,
    ]);

    useEffect(() => {
        const element = questionContentRef.current;

        if (!isProgressHydrated) {
            return;
        }

        if (!activeQuestion || !element || !hasMathSource(element.innerHTML)) {
            return;
        }

        void typesetMath(element).catch((error: unknown) => {
            console.error('MathJax failed to render try out question.', error);
        });

        return () => {
            clearTypesetMath(element);
        };
    }, [activeQuestion, isProgressHydrated]);

    const selectAnswer = (question: Question, answer: string) => {
        setAnswers((current) => {
            if (question.questionType !== 'multiple_answer') {
                return { ...current, [question.id]: answer };
            }

            const currentAnswer = current[question.id];
            const selectedAnswers = isAnswerList(currentAnswer)
                ? currentAnswer
                : [];
            const nextAnswers = selectedAnswers.includes(answer)
                ? selectedAnswers.filter((value) => value !== answer)
                : [...selectedAnswers, answer].sort();

            return { ...current, [question.id]: nextAnswers };
        });
    };

    const toggleFlaggedQuestion = (questionId: string) => {
        setFlaggedQuestions((current) => ({
            ...current,
            [questionId]: !current[questionId],
        }));
    };

    const showQuestion = (index: number) => {
        const nextIndex = Math.max(
            0,
            Math.min(index, tryOut.questions.length - 1),
        );

        setActiveIndex(nextIndex);
    };

    const submitTryOut = useCallback(() => {
        if (submitProcessing) {
            return;
        }

        const submittedAnswers = Object.fromEntries(
            tryOut.questions.map((question) => [
                question.id,
                answers[question.id] ?? null,
            ]),
        );

        setSubmitProcessing(true);
        setSubmitError(null);

        router.post(
            `/try-outs/${tryOut.slug}/submit`,
            { answers: submittedAnswers },
            {
                onSuccess: () => {
                    window.localStorage.removeItem(
                        progressStorageKey(tryOut.id),
                    );
                    setSubmitConfirmOpen(false);
                },
                onError: () => {
                    setSubmitError('Failed to submit try out.');
                    toast.error('Failed to submit try out.');
                },
                onFinish: () => {
                    setSubmitProcessing(false);
                },
            },
        );
    }, [answers, submitProcessing, tryOut.id, tryOut.questions, tryOut.slug]);

    const handleTimeExpired = useCallback(() => {
        if (
            !isProgressHydrated ||
            !tryOut.durationMinutes ||
            startedAt === null ||
            hasTimeExpiredAlertOpenedRef.current
        ) {
            return;
        }

        hasTimeExpiredAlertOpenedRef.current = true;
        setSubmitConfirmOpen(false);
        setTimeExpiredOpen(true);
    }, [isProgressHydrated, startedAt, tryOut.durationMinutes]);

    const isSessionReady = isProgressHydrated;

    if (!isSessionReady) {
        return (
            <>
                <Head title={tryOut.title} />
                <div className="flex h-dvh items-center justify-center bg-background p-4">
                    <Card className="w-full max-w-md">
                        <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
                            <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                                <Loader2 className="size-6 animate-spin" />
                            </div>
                            <div>
                                <h1 className="font-heading text-lg font-semibold">
                                    Preparing try out
                                </h1>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Restoring your progress...
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </>
        );
    }

    return (
        <>
            <Head title={tryOut.title} />
            <div className="flex h-dvh flex-col overflow-hidden bg-background text-foreground">
                <header className="flex h-16 shrink-0 items-center justify-between border-b bg-background px-5">
                    <div className="flex min-w-0 items-center gap-3">
                        <Button
                            asChild
                            variant="ghost"
                            size="icon"
                            className="size-9 shrink-0"
                        >
                            <Link href="/try-outs" aria-label="Back">
                                <ArrowLeft className="size-4" />
                            </Link>
                        </Button>
                        <div className="min-w-0">
                            <h1 className="truncate text-sm font-semibold md:text-base">
                                {tryOut.title}
                            </h1>
                            <p className="truncate text-xs text-muted-foreground">
                                {answeredCount}/{tryOut.questions.length}{' '}
                                answered · {flaggedCount} doubtful
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge
                            variant="outline"
                            className="hidden gap-1.5 px-3 py-1.5 md:flex"
                        >
                            <CheckCircle2 className="size-4" />
                            {completionPercentage}% complete
                        </Badge>
                        <CountdownBadge
                            durationSeconds={durationSeconds}
                            onExpired={handleTimeExpired}
                            startedAt={startedAt}
                        />
                    </div>
                </header>

                <div className="grid min-h-0 flex-1 md:grid-cols-[20rem_minmax(0,1fr)]">
                    <aside className="flex min-h-0 flex-col border-b bg-muted/20 md:border-r md:border-b-0">
                        <div className="shrink-0 border-b px-5 py-4">
                            <p className="text-sm font-semibold">
                                Soal kategori:{' '}
                                {activeQuestion?.subjectName ||
                                    subjectTabs ||
                                    'General'}
                            </p>
                        </div>
                        <div className="scrollbar-stable min-h-0 flex-1 overflow-y-auto p-5">
                            <div className="grid grid-cols-5 gap-3 md:grid-cols-4">
                                {tryOut.questions.map((question, index) => {
                                    const answered = Boolean(
                                        Array.isArray(answers[question.id])
                                            ? answers[question.id].length
                                            : answers[question.id],
                                    );
                                    const flagged = Boolean(
                                        flaggedQuestions[question.id],
                                    );
                                    const active = index === activeIndex;

                                    return (
                                        <Button
                                            key={question.id}
                                            type="button"
                                            variant={
                                                active
                                                    ? 'default'
                                                    : answered
                                                      ? 'secondary'
                                                      : 'outline'
                                            }
                                            className={cn(
                                                'relative size-10 rounded-sm font-semibold',
                                                flagged &&
                                                    !active &&
                                                    'border-amber-500 text-amber-700 dark:text-amber-300',
                                            )}
                                            onClick={() => showQuestion(index)}
                                        >
                                            {question.number}
                                            {answered && (
                                                <span className="absolute -top-1 -right-1 size-2.5 rounded-full bg-emerald-500 ring-2 ring-background" />
                                            )}
                                            {flagged && (
                                                <Flag className="absolute -right-1 -bottom-1 size-3.5 fill-amber-500 text-amber-500" />
                                            )}
                                        </Button>
                                    );
                                })}
                            </div>
                            <div className="mt-5 grid gap-2 text-xs text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <span className="size-2.5 rounded-full bg-emerald-500" />
                                    Answered
                                </div>
                                <div className="flex items-center gap-2">
                                    <Flag className="size-3.5 fill-amber-500 text-amber-500" />
                                    Ragu-ragu
                                </div>
                            </div>
                        </div>
                    </aside>

                    <main className="relative min-h-0 overflow-hidden">
                        {activeQuestion ? (
                            <div
                                ref={questionContentRef}
                                className="flex h-full flex-col"
                            >
                                <div className="scrollbar-stable min-h-0 flex-1 overflow-y-auto px-6 py-8 md:px-16 lg:px-32">
                                    <div className="mx-auto max-w-4xl space-y-8">
                                        <div className="flex flex-wrap items-center justify-between gap-3">
                                            <Badge variant="outline">
                                                Question {activeQuestion.number}
                                            </Badge>
                                            <Button
                                                type="button"
                                                variant={
                                                    flaggedQuestions[
                                                        activeQuestion.id
                                                    ]
                                                        ? 'secondary'
                                                        : 'outline'
                                                }
                                                size="sm"
                                                className="gap-2"
                                                onClick={() =>
                                                    toggleFlaggedQuestion(
                                                        activeQuestion.id,
                                                    )
                                                }
                                            >
                                                <Flag
                                                    className={cn(
                                                        'size-4',
                                                        flaggedQuestions[
                                                            activeQuestion.id
                                                        ] && 'fill-current',
                                                    )}
                                                />
                                                Ragu-ragu
                                            </Button>
                                        </div>
                                        <RichContent
                                            className="block text-base leading-8 whitespace-pre-wrap md:text-lg"
                                            html={
                                                activeQuestion.questionHtml ||
                                                activeQuestion.questionText
                                            }
                                        />
                                        <div className="grid gap-4">
                                            {activeQuestion.questionType ===
                                            'numeric_answer' ? (
                                                <div className="grid max-w-sm gap-2">
                                                    <Label htmlFor={`numeric-answer-${activeQuestion.id}`}>
                                                        Your answer
                                                    </Label>
                                                    <Input
                                                        id={`numeric-answer-${activeQuestion.id}`}
                                                        inputMode="decimal"
                                                        placeholder="Enter a number"
                                                        value={
                                                            typeof answers[
                                                                activeQuestion.id
                                                            ] === 'string'
                                                                ? answers[
                                                                      activeQuestion.id
                                                                  ]
                                                                : ''
                                                        }
                                                        onChange={(event) =>
                                                            selectAnswer(
                                                                activeQuestion,
                                                                event.target
                                                                    .value,
                                                            )
                                                        }
                                                    />
                                                </div>
                                            ) : (
                                                Object.entries(
                                                    activeQuestion.options,
                                                ).map(([key, value]) => {
                                                      const currentAnswer =
                                                          answers[
                                                              activeQuestion.id
                                                          ];
                                                      const selected =
                                                          isAnswerList(
                                                              currentAnswer,
                                                          )
                                                              ? currentAnswer.includes(
                                                                    key,
                                                                )
                                                              : currentAnswer ===
                                                                key;

                                                      return (
                                                          <button
                                                              key={key}
                                                              type="button"
                                                              onClick={() =>
                                                                  selectAnswer(
                                                                      activeQuestion,
                                                                      key,
                                                                  )
                                                              }
                                                              className="flex items-start gap-4 rounded-md px-3 py-2 text-left transition hover:bg-muted/60"
                                                          >
                                                              <span
                                                                  className={cn(
                                                                      'mt-1 flex size-5 shrink-0 items-center justify-center border-2 border-muted-foreground/70',
                                                                      activeQuestion.questionType ===
                                                                          'multiple_answer'
                                                                          ? 'rounded-sm'
                                                                          : 'rounded-full',
                                                                      selected &&
                                                                          'border-primary',
                                                                  )}
                                                              >
                                                                  {selected && (
                                                                      <span
                                                                          className={cn(
                                                                              'size-2.5 bg-primary',
                                                                              activeQuestion.questionType ===
                                                                                  'multiple_answer'
                                                                                  ? 'rounded-[2px]'
                                                                                  : 'rounded-full',
                                                                          )}
                                                                      />
                                                                  )}
                                                              </span>
                                                              <RichContent
                                                                  className="text-base leading-7"
                                                                  html={
                                                                      activeQuestion
                                                                          .optionsHtml[
                                                                          key
                                                                      ] ?? value
                                                                  }
                                                              />
                                                          </button>
                                                      );
                                                })
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="shrink-0 border-t bg-background px-6 py-5 md:px-16 lg:px-32">
                                    <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            disabled={activeIndex === 0}
                                            className="gap-2 text-muted-foreground"
                                            onClick={() =>
                                                showQuestion(activeIndex - 1)
                                            }
                                        >
                                            <ArrowLeft className="size-4" />
                                            Sebelumnya
                                        </Button>
                                        {submitError && (
                                            <p className="text-sm text-destructive">
                                                {submitError}
                                            </p>
                                        )}
                                        {activeIndex >=
                                        tryOut.questions.length - 1 ? (
                                            <Button
                                                type="button"
                                                disabled={submitProcessing}
                                                className="gap-2"
                                                onClick={() =>
                                                    setSubmitConfirmOpen(true)
                                                }
                                            >
                                                <Send className="size-4" />
                                                {submitProcessing
                                                    ? 'Submitting...'
                                                    : 'Submit'}
                                            </Button>
                                        ) : (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                className="gap-2 text-muted-foreground"
                                                onClick={() =>
                                                    showQuestion(
                                                        activeIndex + 1,
                                                    )
                                                }
                                            >
                                                Selanjutnya
                                                <ArrowLeft className="size-4 rotate-180" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex h-full items-center justify-center p-8 text-sm text-muted-foreground">
                                No questions available.
                            </div>
                        )}
                    </main>
                </div>
            </div>

            <AlertDialog
                open={submitConfirmOpen}
                onOpenChange={setSubmitConfirmOpen}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Submit try out?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Your answers will be saved and scored. You can
                            review the result after submission.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    {(unansweredCount > 0 || flaggedCount > 0) && (
                        <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
                            {unansweredCount > 0 && (
                                <p>
                                    {unansweredCount} question
                                    {unansweredCount > 1 ? 's are' : ' is'} not
                                    answered yet.
                                </p>
                            )}
                            {flaggedCount > 0 && (
                                <p>
                                    {flaggedCount} question
                                    {flaggedCount > 1 ? 's are' : ' is'} marked
                                    ragu-ragu.
                                </p>
                            )}
                        </div>
                    )}
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={submitProcessing}>
                            Review again
                        </AlertDialogCancel>
                        <AlertDialogAction
                            disabled={submitProcessing}
                            onClick={(event) => {
                                event.preventDefault();
                                submitTryOut();
                            }}
                        >
                            {submitProcessing ? 'Submitting...' : 'Submit now'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog
                open={timeExpiredOpen}
                onOpenChange={(open) => {
                    if (open || submitProcessing) {
                        setTimeExpiredOpen(open);
                    }
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Time is up</AlertDialogTitle>
                        <AlertDialogDescription>
                            The try out time has ended. Click submit to save
                            your answers and open the result.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction
                            disabled={submitProcessing}
                            onClick={(event) => {
                                event.preventDefault();
                                submitTryOut();
                            }}
                        >
                            {submitProcessing
                                ? 'Submitting...'
                                : 'Submit result'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

StudentTryOutSession.layout = {
    breadcrumbs: [
        {
            title: 'Try Out',
            href: '/try-outs',
        },
        {
            title: 'Simulation',
            href: '/try-outs',
        },
    ],
};
