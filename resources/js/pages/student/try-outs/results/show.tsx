import { Head, Link } from '@inertiajs/react';
import { X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { clearTypesetMath, hasMathSource, typesetMath } from '@/lib/mathjax';
import { normalizeTryOutContentHtml } from '@/lib/try-out-content';
import { cn } from '@/lib/utils';

type Question = {
    answer: string | null;
    correctAnswers: string[];
    id: string;
    number: number;
    options: Record<string, string>;
    optionsHtml: Record<string, string>;
    points: number | null;
    questionHtml: string;
    questionText: string;
    questionType: 'single_choice' | 'multiple_answer' | 'numeric_answer';
    subjectName: string | null;
};

type TryOut = {
    id: string;
    questions: Question[];
    slug: string;
    title: string;
};

type Attempt = {
    answers: Record<string, string | string[] | null>;
    correctCount: number;
    id: string;
    maxScore: number;
    partialCount: number;
    percentageScore: number;
    questionCount: number;
    score: number;
    scoreBreakdown: Record<
        string,
        {
            credit: number;
            points: number;
            status: 'correct' | 'partial' | 'wrong' | 'unanswered';
        }
    >;
    scoringMode: 'raw_score' | 'negative_marking';
    submittedAt: string | null;
    unansweredCount: number;
    wrongCount: number;
};

function RichContent({
    className,
    html,
    typeset = true,
}: {
    className?: string;
    html: string;
    typeset?: boolean;
}) {
    const contentRef = useRef<HTMLSpanElement>(null);
    const containsMath = hasMathSource(html);

    useEffect(() => {
        const element = contentRef.current;

        if (!element) {
            return;
        }

        let isCurrent = true;

        if (!containsMath || !typeset) {
            return () => {
                isCurrent = false;
            };
        }

        void typesetMath(element)
            .then(() => {
                return isCurrent;
            })
            .catch(() => {
                return isCurrent;
            });

        return () => {
            isCurrent = false;
            clearTypesetMath(element);
        };
    }, [containsMath, html, typeset]);

    return (
        <span
            key={html}
            ref={contentRef}
            data-try-out-rich-content
            className={className}
            dangerouslySetInnerHTML={{
                __html: normalizeTryOutContentHtml(html),
            }}
        />
    );
}

export default function StudentTryOutResultDetail({
    attempt,
    tryOut,
}: {
    attempt: Attempt;
    tryOut: TryOut;
}) {
    const answerReviewRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const element = answerReviewRef.current;

        if (!element || !hasMathSource(element.innerHTML)) {
            return;
        }

        void typesetMath(element).catch((error: unknown) => {
            console.error('MathJax failed to render try out result.', error);
        });

        return () => {
            clearTypesetMath(element);
        };
    }, [tryOut.questions]);

    return (
        <>
            <Head title={`${tryOut.title} Result`} />
            <div className="flex h-dvh flex-col overflow-hidden bg-background text-foreground">
                <header className="flex h-16 shrink-0 items-center justify-between border-b px-6 md:px-8">
                    <h1 className="font-heading text-lg font-semibold">
                        {`Hasil ${tryOut.title}`}
                    </h1>
                    <Link
                        href="/try-outs/results"
                        className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        aria-label="Tutup hasil exam"
                    >
                        <X className="size-6" />
                    </Link>
                </header>

                <div className="grid min-h-0 flex-1 md:grid-cols-[24rem_minmax(0,1fr)]">
                    <aside className="border-b p-6 md:border-r md:border-b-0 md:p-8">
                        <p className="text-sm leading-7 text-muted-foreground">
                            <span className="font-semibold text-foreground">
                                Tanggal Ujian:
                            </span>{' '}
                            {attempt.submittedAt ?? '-'}
                        </p>

                        <div className="mt-12 grid grid-cols-2 gap-8 text-center">
                            <div>
                                <p className="text-sm font-semibold text-muted-foreground">
                                    Total soal
                                </p>
                                <p className="mt-3 font-heading text-6xl font-light text-muted-foreground">
                                    {attempt.questionCount}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-emerald-500">
                                    Score
                                </p>
                                <p className="mt-3 font-heading text-6xl font-light text-emerald-500">
                                    {attempt.score}
                                </p>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    of {attempt.maxScore}
                                </p>
                            </div>
                        </div>

                        <div className="mt-9 grid grid-cols-4 gap-3 text-center">
                            <div>
                                <p className="text-xl font-semibold text-emerald-600">
                                    {attempt.correctCount}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Correct
                                </p>
                            </div>
                            <div>
                                <p className="text-xl font-semibold text-amber-600">
                                    {attempt.partialCount}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Partial
                                </p>
                            </div>
                            <div>
                                <p className="text-xl font-semibold text-rose-600">
                                    {attempt.wrongCount}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Wrong
                                </p>
                            </div>
                            <div>
                                <p className="text-xl font-semibold">
                                    {attempt.unansweredCount}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Empty
                                </p>
                            </div>
                        </div>
                    </aside>

                    <main
                        ref={answerReviewRef}
                        className="scrollbar-stable min-h-0 overflow-y-auto px-6 py-8 md:px-16 lg:px-28"
                    >
                        <div className="mx-auto max-w-3xl space-y-12">
                            {tryOut.questions.map((question) => {
                                const studentAnswer =
                                    attempt.answers[question.id];
                                const studentAnswers = Array.isArray(
                                    studentAnswer,
                                )
                                    ? studentAnswer
                                    : typeof studentAnswer === 'string'
                                      ? [studentAnswer]
                                      : [];
                                const correctAnswers =
                                    question.correctAnswers ??
                                    (question.answer ? [question.answer] : []);
                                const breakdown =
                                    attempt.scoreBreakdown[question.id];
                                const isCorrect =
                                    breakdown?.status === 'correct';
                                const isPartial =
                                    breakdown?.status === 'partial';

                                return (
                                    <section
                                        key={question.id}
                                        className="grid gap-6 md:grid-cols-[minmax(0,1fr)_3rem]"
                                    >
                                        <div className="min-w-0 space-y-6">
                                            <p className="font-semibold text-foreground/90">
                                                Kategori:{' '}
                                                {question.subjectName ??
                                                    'General'}
                                            </p>

                                            <RichContent
                                                className="block text-lg leading-8 whitespace-pre-wrap text-foreground/90"
                                                html={
                                                    question.questionHtml ||
                                                    question.questionText
                                                }
                                                typeset={false}
                                            />

                                            {question.questionType ===
                                            'numeric_answer' ? (
                                                <div className="grid gap-4 text-sm sm:grid-cols-2">
                                                    <div>
                                                        <p className="text-muted-foreground">
                                                            Your answer
                                                        </p>
                                                        <p className="mt-1 text-lg leading-8 font-semibold">
                                                            {typeof studentAnswer ===
                                                            'string'
                                                                ? studentAnswer
                                                                : 'Not answered'}
                                                        </p>
                                                    </div>
                                                    {!isCorrect && (
                                                        <div>
                                                            <p className="text-muted-foreground">
                                                                Correct answer
                                                            </p>
                                                            <p className="mt-1 text-lg leading-8 font-semibold text-emerald-600">
                                                                {correctAnswers[0] ??
                                                                    '-'}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="space-y-4">
                                                    {Object.entries(
                                                        question.options,
                                                    ).map(([key, value]) => {
                                                        const selected =
                                                            studentAnswers.includes(
                                                                key,
                                                            );
                                                        const answerKey =
                                                            correctAnswers.includes(
                                                                key,
                                                            );

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
                                                                            : selected
                                                                              ? 'border-rose-400 text-rose-600'
                                                                              : 'border-border text-foreground/80',
                                                                    )}
                                                                >
                                                                    {key}
                                                                </span>
                                                                <RichContent
                                                                    className="block pt-3 text-base leading-7 text-foreground/85"
                                                                    html={
                                                                        question
                                                                            .optionsHtml[
                                                                            key
                                                                        ] ??
                                                                        value
                                                                    }
                                                                    typeset={
                                                                        false
                                                                    }
                                                                />
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>

                                        <div className="order-first flex items-start justify-center md:order-none">
                                            <div
                                                className={cn(
                                                    'flex h-12 min-w-12 items-center justify-center rounded-lg border-2 px-2 text-sm font-semibold',
                                                    studentAnswers.length > 0
                                                        ? isCorrect
                                                            ? 'border-emerald-400 text-emerald-600'
                                                            : isPartial
                                                              ? 'border-amber-400 text-amber-600'
                                                              : 'border-rose-400 text-rose-600'
                                                        : 'border-border text-muted-foreground',
                                                )}
                                            >
                                                {breakdown?.points ?? 0}
                                            </div>
                                        </div>
                                    </section>
                                );
                            })}
                        </div>
                    </main>
                </div>
            </div>
        </>
    );
}
