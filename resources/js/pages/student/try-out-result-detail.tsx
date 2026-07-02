import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, CheckCircle2, CircleSlash, XCircle } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { clearTypesetMath, hasMathSource, typesetMath } from '@/lib/mathjax';
import { cn } from '@/lib/utils';

type Question = {
    answer: string | null;
    id: string;
    number: number;
    options: Record<string, string>;
    optionsHtml: Record<string, string>;
    questionHtml: string;
    questionText: string;
    subjectName: string | null;
};

type TryOut = {
    id: string;
    questions: Question[];
    slug: string;
    title: string;
};

type Attempt = {
    answers: Record<string, string | null>;
    correctCount: number;
    id: string;
    questionCount: number;
    score: number;
    submittedAt: string | null;
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
            className={className}
            dangerouslySetInnerHTML={{ __html: html }}
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
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <Button
                            asChild
                            variant="ghost"
                            size="sm"
                            className="mb-2 -ml-3 gap-2"
                        >
                            <Link href="/try-outs/results">
                                <ArrowLeft className="size-4" />
                                Results
                            </Link>
                        </Button>
                        <h1 className="font-heading text-2xl font-semibold">
                            {tryOut.title}
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Submitted {attempt.submittedAt ?? '-'}
                        </p>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardContent className="px-6 py-5">
                            <p className="text-sm text-muted-foreground">
                                Score
                            </p>
                            <p className="mt-1 text-3xl font-semibold">
                                {attempt.score}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="px-6 py-5">
                            <p className="text-sm text-muted-foreground">
                                Correct
                            </p>
                            <p className="mt-1 text-3xl font-semibold">
                                {attempt.correctCount}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="px-6 py-5">
                            <p className="text-sm text-muted-foreground">
                                Questions
                            </p>
                            <p className="mt-1 text-3xl font-semibold">
                                {attempt.questionCount}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Answer Review</CardTitle>
                        <CardDescription>
                            Compare your answers with the answer key.
                        </CardDescription>
                    </CardHeader>
                    <CardContent ref={answerReviewRef} className="space-y-4">
                        {tryOut.questions.map((question) => {
                            const studentAnswer = attempt.answers[question.id];
                            const correctAnswer = question.answer;
                            const isCorrect =
                                Boolean(studentAnswer) &&
                                studentAnswer === correctAnswer;

                            return (
                                <div
                                    key={question.id}
                                    className="space-y-4 rounded-lg border p-4"
                                >
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h2 className="font-semibold">
                                                    Question {question.number}
                                                </h2>
                                                <Badge variant="outline">
                                                    {question.subjectName ??
                                                        'General'}
                                                </Badge>
                                                <Badge variant="secondary">
                                                    Answer:{' '}
                                                    {correctAnswer ?? '-'}
                                                </Badge>
                                            </div>
                                        </div>
                                        <Badge
                                            variant={
                                                isCorrect
                                                    ? 'secondary'
                                                    : 'outline'
                                            }
                                            className={cn(
                                                'gap-1.5',
                                                isCorrect
                                                    ? 'text-emerald-700 dark:text-emerald-300'
                                                    : 'text-destructive',
                                            )}
                                        >
                                            {isCorrect ? (
                                                <CheckCircle2 className="size-4" />
                                            ) : studentAnswer ? (
                                                <XCircle className="size-4" />
                                            ) : (
                                                <CircleSlash className="size-4" />
                                            )}
                                            {isCorrect
                                                ? 'Correct'
                                                : studentAnswer
                                                  ? 'Incorrect'
                                                  : 'Not answered'}
                                        </Badge>
                                    </div>

                                    <RichContent
                                        className="block text-base leading-7 whitespace-pre-wrap"
                                        html={
                                            question.questionHtml ||
                                            question.questionText
                                        }
                                        typeset={false}
                                    />

                                    <div className="grid gap-3">
                                        {Object.entries(question.options).map(
                                            ([key, value]) => {
                                                const selected =
                                                    studentAnswer === key;
                                                const answerKey =
                                                    correctAnswer === key;

                                                return (
                                                    <div
                                                        key={key}
                                                        className={cn(
                                                            'grid grid-cols-[2.25rem_minmax(0,1fr)] gap-3 rounded-lg border p-4',
                                                            answerKey &&
                                                                'border-emerald-500 bg-emerald-500/5',
                                                            selected &&
                                                                !answerKey &&
                                                                'border-destructive bg-destructive/5',
                                                        )}
                                                    >
                                                        <span
                                                            className={cn(
                                                                'flex size-9 items-center justify-center rounded-full border text-sm font-semibold',
                                                                answerKey &&
                                                                    'border-emerald-600 bg-emerald-600 text-white',
                                                                selected &&
                                                                    !answerKey &&
                                                                    'text-destructive-foreground border-destructive bg-destructive',
                                                            )}
                                                        >
                                                            {key}
                                                        </span>
                                                        <RichContent
                                                            className="block pt-1 text-sm leading-6"
                                                            html={
                                                                question
                                                                    .optionsHtml[
                                                                    key
                                                                ] ?? value
                                                            }
                                                            typeset={false}
                                                        />
                                                    </div>
                                                );
                                            },
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

StudentTryOutResultDetail.layout = {
    breadcrumbs: [
        {
            title: 'Try Out',
            href: '/try-outs',
        },
        {
            title: 'Results',
            href: '/try-outs/results',
        },
    ],
};
