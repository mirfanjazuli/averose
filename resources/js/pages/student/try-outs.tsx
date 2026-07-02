import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowUpRight,
    BookOpenCheck,
    CheckCircle2,
    ClipboardCheck,
    Clock3,
    Trophy,
} from 'lucide-react';
import { useEffect, useState } from 'react';
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
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

type TryOut = {
    duration: string;
    durationMinutes: number | null;
    id: string;
    questions: number;
    slug: string;
    status: string;
    title: string;
};

type Summary = {
    bestScore: number | null;
    completed: number;
};

type SavedTryOutProgress = {
    activeIndex?: number;
    answers?: Record<string, string>;
    flaggedQuestions?: Record<string, boolean>;
    startedAt?: number;
};

type TryOutProgressState = 'expired' | 'in_progress' | 'not_started';

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

const progressStateFor = (tryOut: TryOut): TryOutProgressState => {
    const savedProgress = readSavedProgress(tryOut.id);

    if (!savedProgress.startedAt) {
        return 'not_started';
    }

    if (!tryOut.durationMinutes) {
        return 'in_progress';
    }

    const durationSeconds = tryOut.durationMinutes * 60;
    const elapsedSeconds = Math.floor(
        (Date.now() - savedProgress.startedAt) / 1000,
    );

    return elapsedSeconds >= durationSeconds ? 'expired' : 'in_progress';
};

export default function StudentTryOuts({
    summary,
    tryOuts,
}: {
    summary: Summary;
    tryOuts: TryOut[];
}) {
    const [progressStates, setProgressStates] = useState<
        Record<string, TryOutProgressState>
    >({});
    const [selectedTryOut, setSelectedTryOut] = useState<TryOut | null>(null);
    const [selectedProgressState, setSelectedProgressState] =
        useState<TryOutProgressState>('not_started');
    const [autoSubmittingTryOutId, setAutoSubmittingTryOutId] = useState<
        string | null
    >(null);

    useEffect(() => {
        let isCurrent = true;

        queueMicrotask(() => {
            if (!isCurrent) {
                return;
            }

            const nextProgressStates = Object.fromEntries(
                tryOuts.map((tryOut) => [tryOut.id, progressStateFor(tryOut)]),
            );

            setProgressStates(nextProgressStates);

            const expiredTryOut = tryOuts.find(
                (tryOut) => nextProgressStates[tryOut.id] === 'expired',
            );

            if (!expiredTryOut) {
                return;
            }

            const savedProgress = readSavedProgress(expiredTryOut.id);

            setAutoSubmittingTryOutId(expiredTryOut.id);
            router.post(
                `/try-outs/${expiredTryOut.slug}/submit`,
                { answers: savedProgress.answers ?? {} },
                {
                    onFinish: () => {
                        window.localStorage.removeItem(
                            progressStorageKey(expiredTryOut.id),
                        );
                        setAutoSubmittingTryOutId(null);
                    },
                },
            );
        });

        return () => {
            isCurrent = false;
        };
    }, [tryOuts]);

    const startSelectedTryOut = () => {
        if (!selectedTryOut) {
            return;
        }

        router.visit(`/try-outs/${selectedTryOut.slug}`);
    };

    const openTryOutDialog = (tryOut: TryOut) => {
        const currentProgressState =
            progressStates[tryOut.id] ?? progressStateFor(tryOut);

        if (currentProgressState === 'in_progress') {
            router.visit(`/try-outs/${tryOut.slug}`);

            return;
        }

        setSelectedProgressState(currentProgressState);
        setSelectedTryOut(tryOut);
    };

    return (
        <>
            <Head title="Try Out" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="font-heading text-2xl font-semibold">
                            Try Out
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Practice with timed assessments and review your
                            latest results.
                        </p>
                    </div>
                    <Button asChild variant="outline" className="gap-2">
                        <Link href="/try-outs/results">
                            View results
                            <ArrowUpRight className="size-4" />
                        </Link>
                    </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardContent className="flex items-center gap-4 px-6 py-5">
                            <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <ClipboardCheck className="size-5" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Available tests
                                </p>
                                <p className="mt-1 text-2xl font-semibold">
                                    {tryOuts.length}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="flex items-center gap-4 px-6 py-5">
                            <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <Trophy className="size-5" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Best score
                                </p>
                                <p className="mt-1 text-2xl font-semibold">
                                    {summary.bestScore ?? '-'}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="flex items-center gap-4 px-6 py-5">
                            <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <CheckCircle2 className="size-5" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Completed
                                </p>
                                <p className="mt-1 text-2xl font-semibold">
                                    {summary.completed}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Available try outs</CardTitle>
                        <CardDescription>
                            Pick an assessment when you are ready.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {tryOuts.map((item) => (
                            <div
                                key={item.id}
                                className="grid gap-4 rounded-lg border p-4 md:grid-cols-[auto_minmax(0,1fr)_auto]"
                            >
                                <div className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                    <BookOpenCheck className="size-5" />
                                </div>
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h2 className="font-semibold">
                                            {item.title}
                                        </h2>
                                        <Badge variant="secondary">
                                            {item.status}
                                        </Badge>
                                    </div>
                                    <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
                                        <span className="flex items-center gap-1.5">
                                            <Clock3 className="size-4" />
                                            {item.duration}
                                        </span>
                                        <span>{item.questions} questions</span>
                                    </div>
                                </div>
                                <Button
                                    type="button"
                                    size="sm"
                                    disabled={
                                        autoSubmittingTryOutId === item.id
                                    }
                                    onClick={() => openTryOutDialog(item)}
                                >
                                    {autoSubmittingTryOutId === item.id
                                        ? 'Saving result...'
                                        : progressStates[item.id] ===
                                            'in_progress'
                                          ? 'Continue try out'
                                          : 'Start'}
                                </Button>
                            </div>
                        ))}

                        {tryOuts.length === 0 && (
                            <div className="rounded-lg border p-8 text-center text-sm text-muted-foreground">
                                No try outs available yet.
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <AlertDialog
                open={!!selectedTryOut}
                onOpenChange={(open) => {
                    if (!open) {
                        setSelectedTryOut(null);
                    }
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {selectedTryOut &&
                            selectedProgressState === 'in_progress'
                                ? 'Continue try out?'
                                : 'Start try out?'}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {selectedTryOut &&
                            selectedProgressState === 'in_progress'
                                ? 'Your previous progress and remaining time will be restored.'
                                : 'The timer will start when you open the try out. Make sure you are ready before continuing.'}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={startSelectedTryOut}>
                            {selectedTryOut &&
                            selectedProgressState === 'in_progress'
                                ? 'Continue'
                                : 'Start now'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

StudentTryOuts.layout = {
    breadcrumbs: [
        {
            title: 'Try Out',
            href: '/try-outs',
        },
    ],
};
