import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowUpRight, Clock3 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

type MentorStat = {
    helper: string;
    label: 'Monthly sessions' | 'Pending journals' | 'Today' | 'Upcoming';
    value: string;
};

type MentorSession = {
    duration: string;
    endAt?: string;
    id: string;
    improvementPlan?: string;
    needsCompletion?: boolean;
    program: string;
    startAt?: string;
    status: string;
    student: string;
    time: string;
    title: string;
    zoomAccount: string | null;
    zoomLink: string | null;
};

type MentorJournal = {
    date: string;
    id: string;
    improvementPlan: string;
    note: string;
    program: string;
    slug: string;
    student: string;
    title: string;
};

function EmptyState({ children }: { children: string }) {
    return (
        <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            {children}
        </div>
    );
}

function SessionSummary({ session }: { session: MentorSession }) {
    return (
        <div className="min-w-0">
            <p className="truncate font-medium">{session.student}</p>
            <p className="mt-1 truncate text-sm text-muted-foreground">
                {session.title} · {session.program}
            </p>
        </div>
    );
}

const sessionTimeFormatter = new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
});

function sessionTimeRange(session: MentorSession) {
    if (!session.startAt || !session.endAt) {
        return session.time;
    }

    const startAt = new Date(session.startAt);
    const endAt = new Date(session.endAt);

    if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
        return session.time;
    }

    return `${sessionTimeFormatter.format(startAt)} - ${sessionTimeFormatter.format(endAt)}`;
}

function NextSessionSummary({
    session,
    showFocus,
}: {
    session: MentorSession;
    showFocus: boolean;
}) {
    return (
        <div className="flex min-w-0 items-start gap-3">
            <div className="shrink-0 rounded-md bg-muted px-2.5 py-1 text-sm font-medium">
                {sessionTimeRange(session)}
            </div>
            <div className="min-w-0">
                <p className="truncate font-medium">{session.student}</p>
                <p className="mt-1 truncate text-sm text-muted-foreground">
                    {session.title} · {session.program}
                </p>
                {showFocus && (
                    <div className="mt-3 text-sm">
                        <p className="font-medium text-foreground">Focus</p>
                        <p className="mt-1 italic text-muted-foreground">
                            {session.improvementPlan}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

type SessionDateGroup = {
    key: string;
    label: string;
    sessions: MentorSession[];
};

const sessionDateFormatter = new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    weekday: 'long',
});

function localDateKey(date: Date) {
    return [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, '0'),
        String(date.getDate()).padStart(2, '0'),
    ].join('-');
}

function sessionDateLabel(startAt?: string) {
    if (!startAt) {
        return 'Upcoming';
    }

    const date = new Date(startAt);

    if (Number.isNaN(date.getTime())) {
        return 'Upcoming';
    }

    const today = new Date();
    const tomorrow = new Date(today);

    tomorrow.setDate(today.getDate() + 1);

    if (localDateKey(date) === localDateKey(today)) {
        return 'Today';
    }

    if (localDateKey(date) === localDateKey(tomorrow)) {
        return 'Tomorrow';
    }

    return sessionDateFormatter.format(date);
}

function groupSessionsByDate(sessions: MentorSession[]) {
    return sessions.reduce<SessionDateGroup[]>((groups, session) => {
        const startAt = session.startAt ? new Date(session.startAt) : null;
        const key =
            startAt && !Number.isNaN(startAt.getTime())
                ? localDateKey(startAt)
                : 'upcoming';
        const label = sessionDateLabel(session.startAt);
        const existingGroup = groups.find((group) => group.key === key);

        if (existingGroup) {
            existingGroup.sessions.push(session);

            return groups;
        }

        groups.push({
            key,
            label,
            sessions: [session],
        });

        return groups;
    }, []);
}

function OpenRoomButton({ session }: { session: MentorSession }) {
    if (!session.zoomLink) {
        return (
            <Button disabled className="shrink-0">
                Room not ready
            </Button>
        );
    }

    return (
        <Button asChild className="shrink-0">
            <a href={session.zoomLink} target="_blank" rel="noreferrer">
                Open room
            </a>
        </Button>
    );
}

export default function MentorDashboard({
    completionSession,
    nextSessions,
    pendingJournals,
    recentJournals,
    stats,
}: {
    completionSession: MentorSession | null;
    nextSessions: MentorSession[];
    pendingJournals: MentorSession[];
    recentJournals: MentorJournal[];
    stats: MentorStat[];
}) {
    const nextSessionGroups = groupSessionsByDate(nextSessions);
    const nearestSessionId = nextSessions[0]?.id;
    const [completionDialogOpen, setCompletionDialogOpen] = useState(false);
    const [selectedCompletionSession, setSelectedCompletionSession] =
        useState<MentorSession | null>(completionSession);
    const completionForm = useForm({
        achievement: '',
        improvement_area: '',
        next_improvement_plan: nextSessions[0]?.improvementPlan ?? '',
    });

    const openCompletionDialog = (session: MentorSession) => {
        setSelectedCompletionSession(session);
        completionForm.setData({
            achievement: '',
            improvement_area: '',
            next_improvement_plan: session.improvementPlan ?? '',
        });
        completionForm.clearErrors();
        setCompletionDialogOpen(true);
    };

    const saveCompletion = () => {
        if (!selectedCompletionSession) {
            return;
        }

        completionForm.post(
            `/mentor/sessions/${selectedCompletionSession.id}/complete`,
            {
                preserveScroll: true,
                onSuccess: () => {
                    setCompletionDialogOpen(false);
                    setSelectedCompletionSession(null);
                    completionForm.reset();
                    toast.success('Session journal completed.');
                },
                onError: () => {
                    toast.error('Please complete the session journal form.');
                },
            },
        );
    };

    return (
        <>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4">
                <Dialog
                    open={completionDialogOpen}
                    onOpenChange={setCompletionDialogOpen}
                >
                    <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Complete session</DialogTitle>
                            <DialogDescription>
                                Record the teaching journal for{' '}
                                {selectedCompletionSession?.student ??
                                    'this student'}
                                .
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="achievement">
                                    Achievement
                                </Label>
                                <Textarea
                                    id="achievement"
                                    value={completionForm.data.achievement}
                                    onChange={(event) =>
                                        completionForm.setData({
                                            ...completionForm.data,
                                            achievement: event.target.value,
                                        })
                                    }
                                    placeholder="What did the student achieve in this session?"
                                    className="min-h-28"
                                />
                                {completionForm.errors.achievement && (
                                    <p className="text-sm text-destructive">
                                        {completionForm.errors.achievement}
                                    </p>
                                )}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="improvement-area">
                                    Area to improve
                                </Label>
                                <Textarea
                                    id="improvement-area"
                                    value={completionForm.data.improvement_area}
                                    onChange={(event) =>
                                        completionForm.setData({
                                            ...completionForm.data,
                                            improvement_area:
                                                event.target.value,
                                        })
                                    }
                                    placeholder="What should the student improve?"
                                    className="min-h-28"
                                />
                                {completionForm.errors.improvement_area && (
                                    <p className="text-sm text-destructive">
                                        {
                                            completionForm.errors
                                                .improvement_area
                                        }
                                    </p>
                                )}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="next-improvement-plan">
                                    Next improvement plan
                                </Label>
                                <Textarea
                                    id="next-improvement-plan"
                                    value={
                                        completionForm.data
                                            .next_improvement_plan
                                    }
                                    onChange={(event) =>
                                        completionForm.setData({
                                            ...completionForm.data,
                                            next_improvement_plan:
                                                event.target.value,
                                        })
                                    }
                                    placeholder="Plan for the next meeting."
                                    className="min-h-28"
                                />
                                {completionForm.errors
                                    .next_improvement_plan && (
                                    <p className="text-sm text-destructive">
                                        {
                                            completionForm.errors
                                                .next_improvement_plan
                                        }
                                    </p>
                                )}
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setCompletionDialogOpen(false)}
                                disabled={completionForm.processing}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                onClick={saveCompletion}
                                disabled={completionForm.processing}
                            >
                                Save journal
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="font-heading text-2xl font-semibold">
                            Dashboard
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Track today&apos;s sessions, assigned students, and
                            follow-up priorities.
                        </p>
                    </div>
                    <Button asChild variant="outline" className="gap-2">
                        <Link href="/schedules">
                            View schedules
                            <ArrowUpRight className="size-4" />
                        </Link>
                    </Button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {stats.map((item) => (
                        <Card key={item.label}>
                            <CardContent className="relative flex min-h-40 flex-col justify-between px-6">
                                <div className="flex items-start justify-between gap-4">
                                    <p className="min-w-0 truncate text-sm text-muted-foreground">
                                        {item.label}
                                    </p>
                                    <Button
                                        asChild
                                        variant="secondary"
                                        size="icon"
                                        className="-mt-1 size-8 shrink-0 rounded-full"
                                    >
                                        <Link href="/schedules">
                                            <ArrowUpRight className="size-3.5" />
                                        </Link>
                                    </Button>
                                </div>

                                <div>
                                    <div className="flex items-end gap-2">
                                        <p
                                            className={cn(
                                                'text-5xl font-semibold tracking-normal',
                                                item.label ===
                                                    'Pending journals' &&
                                                    Number(item.value) > 0 &&
                                                    'text-destructive',
                                            )}
                                        >
                                            {item.value}
                                        </p>
                                    </div>
                                    <p className="mt-2 truncate text-xs text-muted-foreground">
                                        {item.helper}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.65fr)]">
                    <Card>
                        <CardHeader>
                            <CardTitle>Next session</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {nextSessionGroups.length > 0 ? (
                                <div className="space-y-5">
                                    {nextSessionGroups.map((group) => (
                                        <div
                                            key={group.key}
                                            className="space-y-3"
                                        >
                                            <div className="flex items-center gap-3">
                                                <p className="shrink-0 text-xs font-semibold tracking-normal text-muted-foreground">
                                                    {group.label}
                                                </p>
                                                {/* <div className="h-px flex-1 bg-border" /> */}
                                            </div>

                                            {group.sessions.map((session) => (
                                                <div
                                                    key={session.id}
                                                    className="rounded-lg border p-4"
                                                >
                                                    <div className="flex flex-wrap items-start justify-between gap-4">
                                                        <NextSessionSummary
                                                            session={session}
                                                            showFocus={
                                                                session.id ===
                                                                nearestSessionId
                                                            }
                                                        />
                                                        <OpenRoomButton
                                                            session={session}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <EmptyState>
                                    No upcoming session assigned.
                                </EmptyState>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Journal needs completion</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {pendingJournals.length > 0 ? (
                                pendingJournals.map((session) => (
                                    <div
                                        key={session.id}
                                        className="rounded-lg border p-4"
                                    >
                                        <div className="min-w-0 space-y-1">
                                            <SessionSummary
                                                session={session}
                                            />
                                            <p className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Clock3 className="size-4" />
                                                {session.time}
                                            </p>
                                        </div>
                                        <Button
                                            type="button"
                                            className="mt-4 w-full"
                                            onClick={() =>
                                                openCompletionDialog(session)
                                            }
                                        >
                                            Complete
                                        </Button>
                                    </div>
                                ))
                            ) : (
                                <EmptyState>No pending journals.</EmptyState>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader className="gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <CardTitle>Recent journals</CardTitle>
                        </div>
                        <Link
                            href="/journals"
                            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                        >
                            View all
                            <ArrowUpRight className="size-4" />
                        </Link>
                    </CardHeader>
                    <CardContent>
                        {recentJournals.length > 0 ? (
                            <div className="divide-y rounded-lg border">
                                {recentJournals.map((journal) => (
                                    <div
                                        key={journal.id}
                                        className="grid gap-3 p-4 md:grid-cols-[minmax(0,1fr)_auto]"
                                    >
                                        <div className="min-w-0">
                                            <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                                                <p className="truncate font-medium">
                                                    {journal.student}
                                                </p>
                                                <span className="text-sm text-muted-foreground">
                                                    {journal.date}
                                                </span>
                                            </div>
                                            <p className="mt-1 truncate text-sm text-muted-foreground">
                                                {journal.title} ·{' '}
                                                {journal.program}
                                            </p>
                                            <p className="mt-2 line-clamp-2 text-sm italic text-muted-foreground">
                                                * {journal.improvementPlan}
                                            </p>
                                        </div>
                                        <Button
                                            asChild
                                            variant="ghost"
                                            size="sm"
                                            className="justify-self-start md:justify-self-end"
                                        >
                                            <Link
                                                href={`/journals/${journal.slug}`}
                                            >
                                                Review
                                            </Link>
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <EmptyState>No recent journals yet.</EmptyState>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

MentorDashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: '/dashboard',
        },
    ],
};
