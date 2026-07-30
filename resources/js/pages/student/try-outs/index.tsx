import { Form, Head, router, usePage } from '@inertiajs/react';
import {
    ArrowUpRight,
    BookOpenCheck,
    CalendarCheck2,
    Clock3,
    Ticket,
} from 'lucide-react';
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

type TryOutSummary = {
    bestScore: number | null;
    completed: number;
};

export default function StudentTryOuts({
    summary,
    tryOuts,
}: {
    summary: TryOutSummary;
    tryOuts: TryOut[];
}) {
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
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <h1 className="font-heading text-2xl leading-tight font-semibold tracking-tight text-[#102a3a] md:text-4xl">
                                Try out
                            </h1>
                            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#526b7b]">
                                Kerjakan latihan evaluasi, lanjutkan progress,
                                atau gunakan token untuk membuka akses khusus.
                            </p>
                        </div>
                        <Button
                            type="button"
                            className="w-full shrink-0 gap-2 rounded-2xl bg-[#d9a441] text-[#102a3a] shadow-lg shadow-[#d9a441]/20 hover:bg-[#c89532] sm:w-auto"
                            onClick={() => setRedeemDialogOpen(true)}
                        >
                            <Ticket className="size-4" />
                            Gunakan token
                        </Button>
                    </div>
                }
                sidebar={
                    <div className="space-y-4">
                        <div>
                            <p className="text-xs font-semibold tracking-wide text-[#526b7b] uppercase">
                                Try out tersedia
                            </p>
                            <p className="mt-1 font-heading text-3xl font-semibold tracking-tight text-[#102a3a]">
                                {tryOuts.length}
                            </p>
                        </div>

                        <div className="space-y-2 border-t border-[#edf3f1] pt-3">
                            <div className="flex items-center justify-between gap-3 text-sm">
                                <span className="text-[#526b7b]">
                                    Selesai
                                </span>
                                <span className="font-semibold text-[#102a3a]">
                                    {summary.completed}
                                </span>
                            </div>
                            <div className="flex items-center justify-between gap-3 text-sm">
                                <span className="text-[#526b7b]">
                                    Skor terbaik
                                </span>
                                <span className="font-semibold text-[#102a3a]">
                                    {summary.bestScore ?? '-'}
                                </span>
                            </div>
                        </div>
                    </div>
                }
            >
                <div className="grid gap-4 lg:grid-cols-3">
                    {tryOuts.map((item) => (
                        <div
                            key={item.id}
                            className="group flex min-h-64 flex-col rounded-md bg-white p-4 shadow-sm shadow-[#102a3a]/[0.03] ring-1 ring-[#dcece7] transition-colors hover:ring-[#bfe4db]"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#edf7f4] text-[#0f8f7a]">
                                    <BookOpenCheck className="size-5 transition-transform group-hover:scale-105" />
                                </div>
                                <Badge
                                    variant="outline"
                                    className={
                                        item.status === 'Private'
                                            ? 'rounded-full border-amber-200 bg-amber-50 px-3 text-amber-700'
                                            : 'rounded-full border-emerald-200 bg-emerald-50 px-3 text-emerald-700'
                                    }
                                >
                                    {item.status}
                                </Badge>
                            </div>

                            <div className="mt-5 min-w-0">
                                <h2 className="line-clamp-2 font-heading text-lg leading-snug font-semibold text-[#102a3a]">
                                    {item.title}
                                </h2>
                                <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-[#526b7b]">
                                    <div className="flex items-center gap-2">
                                        <Clock3 className="size-4 text-[#0f8f7a]" />
                                        <span>{item.duration}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CalendarCheck2 className="size-4 text-[#0f8f7a]" />
                                        <span>{item.questions} soal</span>
                                    </div>
                                </div>
                                {item.status === 'Private' && (
                                    <p className="mt-4 text-sm leading-6 text-[#526b7b]">
                                        {item.remainingAttempts} attempt tersisa
                                        {item.accessStartsAt &&
                                        item.accessEndsAt
                                            ? ` · ${item.accessStartsAt} - ${item.accessEndsAt}`
                                            : ''}
                                    </p>
                                )}
                            </div>

                            <Button
                                type="button"
                                className="mt-auto w-full gap-2 rounded-xl bg-[#0f8f7a] hover:bg-[#0b7668]"
                                disabled={autoSubmittingTryOutId === item.id}
                                onClick={() => openTryOutDialog(item)}
                            >
                                {autoSubmittingTryOutId === item.id
                                    ? 'Menyimpan hasil...'
                                    : progressStates[item.id] === 'in_progress'
                                      ? 'Lanjutkan try out'
                                      : 'Mulai try out'}
                                <ArrowUpRight className="size-4" />
                            </Button>
                        </div>
                    ))}

                    {tryOuts.length === 0 && (
                        <div className="rounded-md bg-[#f8fbfa] px-6 py-12 text-center lg:col-span-2">
                            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-white text-[#0f8f7a] ring-1 ring-[#dcece7]">
                                <BookOpenCheck className="size-6" />
                            </div>
                            <h2 className="mt-5 font-heading text-xl font-semibold text-[#102a3a]">
                                Belum ada try out tersedia
                            </h2>
                            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#526b7b]">
                                Try out yang dapat kamu akses akan tampil di
                                sini.
                            </p>
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
                        <DialogTitle>Gunakan token try out</DialogTitle>
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
                                        Batal
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={processing || !redeemToken}
                                    >
                                        Gunakan
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
