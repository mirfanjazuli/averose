import { Head, Link } from '@inertiajs/react';
import {
    ArrowUpRight,
    CalendarClock,
    CalendarDays,
    NotebookPen,
} from 'lucide-react';
import { useState } from 'react';
import { EmptyState } from '@/components/admin/empty-state';
import { SummaryCard } from '@/components/admin/summary-card';
import { CompleteSessionDialog } from '@/components/mentor/complete-session-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type MentorStat = {
    label: 'Pending journals' | 'Today' | 'Upcoming';
    value: string;
};

const statIcons = {
    'Pending journals': NotebookPen,
    Today: CalendarDays,
    Upcoming: CalendarClock,
} as const;

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
        <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-[7.5rem_minmax(0,1fr)]">
            <p className="pt-0.5 text-sm font-medium whitespace-nowrap tabular-nums">
                {sessionTimeRange(session)}
            </p>
            <div className="min-w-0">
                <SessionSummary session={session} />
                {showFocus && session.improvementPlan && (
                    <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">
                        <span className="font-medium text-foreground">
                            Focus:{' '}
                        </span>
                        {session.improvementPlan}
                    </p>
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
            <span className="shrink-0 pt-1 text-xs text-muted-foreground">
                Room not ready
            </span>
        );
    }

    return (
        <Button asChild size="sm" className="shrink-0 gap-2">
            <a href={session.zoomLink} target="_blank" rel="noreferrer">
                Join
            </a>
        </Button>
    );
}

export default function MentorDashboard({
    nextSessions,
    pendingJournals,
    stats,
}: {
    nextSessions: MentorSession[];
    pendingJournals: MentorSession[];
    stats: MentorStat[];
}) {
    const nextSessionGroups = groupSessionsByDate(nextSessions);
    const nearestSessionId = nextSessions[0]?.id;
    const [completionDialogOpen, setCompletionDialogOpen] = useState(false);
    const [selectedCompletionSession, setSelectedCompletionSession] =
        useState<MentorSession | null>(null);

    const openCompletionDialog = (session: MentorSession) => {
        setSelectedCompletionSession(session);
        setCompletionDialogOpen(true);
    };

    return (
        <>
            <Head title="Dashboard" />
            <div className="flex min-h-full max-w-full min-w-0 flex-1 flex-col gap-6 p-4">
                {selectedCompletionSession && (
                    <CompleteSessionDialog
                        key={selectedCompletionSession.id}
                        open={completionDialogOpen}
                        onOpenChange={setCompletionDialogOpen}
                        session={selectedCompletionSession}
                    />
                )}

                <div className="flex flex-wrap items-start justify-between gap-4">
                    <h1 className="font-heading text-2xl font-semibold">
                        Dashboard
                    </h1>
                    <Button asChild variant="outline" className="gap-2">
                        <Link href="/schedules">
                            View schedules
                            <ArrowUpRight className="size-4" />
                        </Link>
                    </Button>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                    {stats.map((item) => (
                        <SummaryCard
                            key={item.label}
                            icon={statIcons[item.label]}
                            label={item.label}
                            value={
                                <span
                                    className={cn(
                                        item.label === 'Pending journals' &&
                                            Number(item.value) > 0 &&
                                            'text-destructive',
                                    )}
                                >
                                    {item.value}
                                </span>
                            }
                        />
                    ))}
                </div>

                <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.65fr)]">
                    <section className="space-y-3">
                        <h2 className="font-heading text-base font-medium">
                            Next sessions
                        </h2>
                        <Card size="sm" className="gap-0 rounded-xl py-0">
                            <CardContent className="px-0">
                                {nextSessionGroups.length > 0 ? (
                                    <div>
                                        {nextSessionGroups.map((group) => (
                                            <section
                                                key={group.key}
                                                className="border-b last:border-b-0"
                                            >
                                                <div className="bg-muted/30 px-4 py-2.5">
                                                    <p className="text-xs font-medium text-muted-foreground">
                                                        {group.label}
                                                    </p>
                                                </div>

                                                <div className="divide-y">
                                                    {group.sessions.map(
                                                        (session) => (
                                                            <div
                                                                key={session.id}
                                                                className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-start sm:justify-between"
                                                            >
                                                                <NextSessionSummary
                                                                    session={
                                                                        session
                                                                    }
                                                                    showFocus={
                                                                        session.id ===
                                                                        nearestSessionId
                                                                    }
                                                                />
                                                                <OpenRoomButton
                                                                    session={
                                                                        session
                                                                    }
                                                                />
                                                            </div>
                                                        ),
                                                    )}
                                                </div>
                                            </section>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-4">
                                        <EmptyState>
                                            No upcoming session assigned.
                                        </EmptyState>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </section>

                    <section className="space-y-3">
                        <div className="flex items-center justify-between gap-3">
                            <h2 className="font-heading text-base font-medium">
                                Journal needs completion
                            </h2>
                        </div>
                        <Card size="sm" className="gap-0 rounded-xl py-0">
                            <CardContent className="px-0">
                                {pendingJournals.length > 0 ? (
                                    <div className="divide-y">
                                        {pendingJournals.map((session) => (
                                            <div
                                                key={session.id}
                                                className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                                            >
                                                <div className="min-w-0">
                                                    <p className="mb-2 text-xs text-muted-foreground">
                                                        {sessionDateLabel(
                                                            session.startAt,
                                                        )}{' '}
                                                        ·{' '}
                                                        <span className="tabular-nums">
                                                            {sessionTimeRange(
                                                                session,
                                                            )}
                                                        </span>
                                                    </p>
                                                    <SessionSummary
                                                        session={session}
                                                    />
                                                </div>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    onClick={() =>
                                                        openCompletionDialog(
                                                            session,
                                                        )
                                                    }
                                                >
                                                    Complete
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-4">
                                        <EmptyState>
                                            No pending journals.
                                        </EmptyState>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </section>
                </div>
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
