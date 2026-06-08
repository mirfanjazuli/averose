import { Head, Link } from '@inertiajs/react';
import {
    ArrowUpRight,
    CalendarCheck2,
    Clock3,
    MessageSquareText,
    MonitorUp,
    NotebookText,
    UsersRound,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

type MentorStat = {
    helper: string;
    label: 'Sessions today' | 'Assigned students' | 'Teaching journal';
    value: string;
};

type MentorSession = {
    duration: string;
    id: string;
    program: string;
    status: string;
    student: string;
    time: string;
    title: string;
    zoomAccount: string | null;
    zoomLink: string | null;
};

const statIcons = {
    'Assigned students': UsersRound,
    'Sessions today': CalendarCheck2,
    'Teaching journal': NotebookText,
};

export default function MentorDashboard({
    focusItems,
    nextSession,
    stats,
    todaySessions,
}: {
    focusItems: string[];
    nextSession: MentorSession | null;
    stats: MentorStat[];
    todaySessions: MentorSession[];
}) {
    return (
        <>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4">
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
                        <Link href="/scheduling/schedules">
                            View schedules
                            <ArrowUpRight className="size-4" />
                        </Link>
                    </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    {stats.map((item) => {
                        const Icon = statIcons[item.label];

                        return (
                            <Card key={item.label}>
                                <CardContent className="flex items-center gap-4 px-6 py-5">
                                    <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                        <Icon className="size-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">
                                            {item.label}
                                        </p>
                                        <p className="mt-1 text-2xl font-semibold">
                                            {item.value}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {item.helper}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
                    <Card>
                        <CardHeader>
                            <CardTitle>Today&apos;s sessions</CardTitle>
                            <CardDescription>
                                Sessions assigned to you today.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {todaySessions.length > 0 ? (
                                todaySessions.map((session) => (
                                    <div
                                        key={session.id}
                                        className="flex flex-wrap items-center justify-between gap-4 rounded-lg border p-4"
                                    >
                                        <div className="min-w-0">
                                            <p className="font-medium">
                                                {session.student}
                                            </p>
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                {session.title} ·{' '}
                                                {session.program}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <p className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Clock3 className="size-4" />
                                                {session.time}
                                            </p>
                                            <Badge variant="secondary">
                                                {session.status}
                                            </Badge>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                                    No sessions scheduled today.
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Next session</CardTitle>
                            <CardDescription>
                                Quick access to your upcoming room.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {nextSession ? (
                                <div className="rounded-lg border p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                                            <MonitorUp className="size-5" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="truncate font-medium">
                                                {nextSession.title}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {nextSession.student}
                                            </p>
                                        </div>
                                    </div>
                                    <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                                        <Clock3 className="size-4" />
                                        {nextSession.time}
                                    </p>
                                    <Button
                                        asChild={!!nextSession.zoomLink}
                                        className="mt-4 w-full"
                                        disabled={!nextSession.zoomLink}
                                    >
                                        {nextSession.zoomLink ? (
                                            <a
                                                href={nextSession.zoomLink}
                                                target="_blank"
                                                rel="noreferrer"
                                            >
                                                Open room
                                            </a>
                                        ) : (
                                            <span>Room not ready</span>
                                        )}
                                    </Button>
                                </div>
                            ) : (
                                <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                                    No upcoming session assigned.
                                </div>
                            )}
                            <div className="rounded-lg border p-4">
                                <p className="flex items-center gap-2 font-medium">
                                    <MessageSquareText className="size-4 text-primary" />
                                    Focus
                                </p>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    Review student context before joining each
                                    room.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Focus list</CardTitle>
                        <CardDescription>
                            Priority follow-ups before the end of the day.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-3 md:grid-cols-3">
                        {focusItems.map((item) => (
                            <div
                                key={item}
                                className="rounded-lg border p-4 text-sm"
                            >
                                {item}
                            </div>
                        ))}
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
