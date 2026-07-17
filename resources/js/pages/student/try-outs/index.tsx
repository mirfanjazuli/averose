import { Form, Head, router, usePage } from '@inertiajs/react';
import { BookOpenCheck, CalendarCheck2, Clock3, Ticket } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import InputError from '@/components/input-error';
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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StudentTryOutLayout } from '@/pages/student/try-outs/components/student-try-out-layout';

type TryOut = {
    accessEndsAt: string | null;
    accessStartsAt: string | null;
    duration: string;
    durationMinutes: number | null;
    id: string;
    questions: number;
    remainingAttempts: number | null;
    scoringMode: 'raw_score' | 'negative_marking';
    slug: string;
    status: string;
    title: string;
};

type SavedTryOutProgress = {
    activeIndex?: number;
    answers?: Record<string, string | string[]>;
    flaggedQuestions?: Record<string, boolean>;
    startedAt?: number;
    scoringMode?: TryOut['scoringMode'];
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

const initialRedeemToken = () => {
    if (typeof window === 'undefined') {
        return '';
    }

    return (
        new URLSearchParams(window.location.search).get('token')?.toUpperCase() ??
        ''
    );
};

export default function StudentTryOuts({ tryOuts }: { tryOuts: TryOut[] }) {
    const page = usePage<{
        flash?: {
            success?: string;
        };
    }>();
    const initialToken = initialRedeemToken();
    const [progressStates, setProgressStates] = useState<
        Record<string, TryOutProgressState>
    >({});
    const [selectedTryOut, setSelectedTryOut] = useState<TryOut | null>(null);
    const [selectedProgressState, setSelectedProgressState] =
        useState<TryOutProgressState>('not_started');
    const [redeemDialogOpen, setRedeemDialogOpen] = useState(
        Boolean(initialToken),
    );
    const [redeemToken, setRedeemToken] = useState(initialToken);
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
            <StudentTryOutLayout
                header={
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h1 className="font-heading text-2xl font-semibold">
                                Try Out
                            </h1>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            className="gap-2"
                            onClick={() => setRedeemDialogOpen(true)}
                        >
                            <Ticket className="size-4" />
                            Redeem token
                        </Button>
                    </div>
                }
            >
                <div className="grid gap-4 lg:grid-cols-3">
                    {tryOuts.map((item) => (
                        <div
                            key={item.id}
                            className="flex flex-col justify-between gap-5 rounded-xl border bg-card p-4 text-card-foreground"
                        >
                            <div className="flex gap-4">
                                <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                    <BookOpenCheck className="size-5" />
                                </div>
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h2 className="font-semibold">
                                            {item.title}
                                        </h2>
                                        <Badge
                                            variant="outline"
                                            className={
                                                item.status === 'Private'
                                                    ? 'border-amber-200 bg-amber-50 text-amber-700'
                                                    : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                            }
                                        >
                                            {item.status}
                                        </Badge>
                                    </div>
                                    <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
                                        <span className="flex items-center gap-1.5">
                                            <Clock3 className="size-4" />
                                            {item.duration}
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <CalendarCheck2 className="size-4" />
                                            {item.questions} soal
                                        </span>
                                    </div>
                                    {item.status === 'Private' && (
                                        <p className="mt-3 text-sm text-muted-foreground">
                                            {item.remainingAttempts} attempt
                                            tersisa
                                            {item.accessStartsAt &&
                                            item.accessEndsAt
                                                ? `, berlaku ${item.accessStartsAt} - ${item.accessEndsAt}`
                                                : ''}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <Button
                                type="button"
                                className="w-full"
                                disabled={autoSubmittingTryOutId === item.id}
                                onClick={() => openTryOutDialog(item)}
                            >
                                {autoSubmittingTryOutId === item.id
                                    ? 'Menyimpan hasil...'
                                    : progressStates[item.id] === 'in_progress'
                                      ? 'Lanjutkan try out'
                                      : 'Mulai try out'}
                            </Button>
                        </div>
                    ))}

                    {tryOuts.length === 0 && (
                        <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground lg:col-span-2">
                            Belum ada try out tersedia.
                        </div>
                    )}
                </div>
            </StudentTryOutLayout>

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
                                ? 'Lanjutkan try out?'
                                : 'Mulai try out?'}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {selectedTryOut &&
                            selectedProgressState === 'in_progress'
                                ? 'Progress dan sisa waktu sebelumnya akan dipulihkan.'
                                : 'Timer akan berjalan saat try out dibuka. Pastikan kamu sudah siap sebelum lanjut.'}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={startSelectedTryOut}>
                            {selectedTryOut &&
                            selectedProgressState === 'in_progress'
                                ? 'Lanjutkan'
                                : 'Mulai sekarang'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Dialog open={redeemDialogOpen} onOpenChange={setRedeemDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Redeem try out token</DialogTitle>
                        <DialogDescription>
                            Masukkan token group untuk membuka akses try out
                            private.
                        </DialogDescription>
                    </DialogHeader>
                    <Form
                        action="/try-outs/redeem"
                        method="post"
                        resetOnSuccess
                        onSuccess={() => {
                            setRedeemDialogOpen(false);
                            setRedeemToken('');
                            toast.success(
                                page.props.flash?.success ??
                                    'Token try out berhasil digunakan.',
                            );
                        }}
                        onError={() => {
                            toast.error('Token try out tidak bisa digunakan.');
                        }}
                        className="space-y-4"
                    >
                        {({ errors, processing }) => (
                            <>
                                <div className="grid gap-2">
                                    <Label htmlFor="try-out-token">
                                        Token
                                    </Label>
                                    <Input
                                        id="try-out-token"
                                        name="token"
                                        value={redeemToken}
                                        onChange={(event) =>
                                            setRedeemToken(
                                                event.target.value.toUpperCase(),
                                            )
                                        }
                                        placeholder="AVEROSE2026"
                                        className="font-mono uppercase"
                                        aria-invalid={!!errors.token}
                                    />
                                    <InputError message={errors.token} />
                                </div>
                                <div className="flex justify-end gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        disabled={processing}
                                        onClick={() =>
                                            setRedeemDialogOpen(false)
                                        }
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={processing || !redeemToken}
                                    >
                                        Redeem
                                    </Button>
                                </div>
                            </>
                        )}
                    </Form>
                </DialogContent>
            </Dialog>
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
