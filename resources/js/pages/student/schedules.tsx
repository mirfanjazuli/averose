import { Head } from '@inertiajs/react';
import {
    CheckCircle2,
    Clock3,
    GraduationCap,
    MonitorUp,
    Search,
    UserRoundCheck,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import type { BookingSubjectOption } from '@/components/student-book-session-dialog';

import { StudentBookSessionDialog } from '@/components/student-book-session-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

type StudentSession = {
    endAt: string;
    id: string;
    mentor: string;
    program: string;
    startAt: string;
    status: string;
    time: string;
    title: string;
    zoomLink: string | null;
};

function sessionDay(session: StudentSession) {
    const dateValue = new Date(session.startAt);

    return {
        active: dateValue.toDateString() === new Date().toDateString(),
        date: new Intl.DateTimeFormat('en-US', { day: '2-digit' }).format(
            dateValue,
        ),
        day: new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(
            dateValue,
        ),
        id: session.id,
    };
}

export default function StudentSchedules({
    sessions,
    subjects,
}: {
    sessions: StudentSession[];
    subjects: BookingSubjectOption[];
}) {
    const [searchQuery, setSearchQuery] = useState('');

    const week = useMemo(() => sessions.slice(0, 5).map(sessionDay), [sessions]);
    const nextSession = sessions[0] ?? null;
    const filteredSessions = useMemo(() => {
        const normalizedSearch = searchQuery.trim().toLowerCase();

        if (!normalizedSearch) {
            return sessions;
        }

        return sessions.filter((session) =>
            [
                session.title,
                session.mentor,
                session.program,
                session.time,
                session.status,
            ].some((value) => value.toLowerCase().includes(normalizedSearch)),
        );
    }, [searchQuery, sessions]);

    return (
        <>
            <Head title="Schedules" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="font-heading text-2xl font-semibold">
                            Schedules
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            View your upcoming sessions, mentors, and program
                            timeline.
                        </p>
                    </div>
                    <StudentBookSessionDialog subjects={subjects} />
                </div>

                <div className="grid gap-4 md:grid-cols-5">
                    {week.length > 0 ? (
                        week.map((item) => (
                        <Card
                            key={item.id}
                            className={
                                item.active
                                    ? 'border-primary/30 bg-primary/10 py-4'
                                    : 'py-4'
                            }
                        >
                            <CardContent className="px-4 text-center">
                                <p className="text-xs text-muted-foreground">
                                    {item.day}
                                </p>
                                <p className="mt-1 text-2xl font-semibold">
                                    {item.date}
                                </p>
                            </CardContent>
                        </Card>
                        ))
                    ) : (
                        <Card className="py-4 md:col-span-5">
                            <CardContent className="px-4 text-sm text-muted-foreground">
                                No booked sessions yet.
                            </CardContent>
                        </Card>
                    )}
                </div>

                <Card>
                    <CardHeader className="gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <CardTitle>Upcoming sessions</CardTitle>
                            <CardDescription>
                                Your scheduled learning sessions.
                            </CardDescription>
                        </div>
                        <div className="flex h-10 min-w-64 items-center gap-2 rounded-2xl border bg-background px-3 text-sm text-muted-foreground">
                            <Search className="size-4" />
                            <Input
                                value={searchQuery}
                                onChange={(event) =>
                                    setSearchQuery(event.target.value)
                                }
                                placeholder="Search sessions..."
                                className="h-auto border-0 bg-transparent px-0 py-0 shadow-none focus-visible:ring-0"
                            />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-2xl border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Session</TableHead>
                                        <TableHead>Program</TableHead>
                                        <TableHead>Mentor</TableHead>
                                        <TableHead>Time</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="w-24 text-right" />
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredSessions.length > 0 ? (
                                        filteredSessions.map((session) => (
                                            <TableRow key={session.id}>
                                                <TableCell className="font-medium">
                                                    {session.title}
                                                </TableCell>
                                                <TableCell>
                                                    {session.program}
                                                </TableCell>
                                                <TableCell>
                                                    {session.mentor}
                                                </TableCell>
                                                <TableCell>
                                                    {session.time}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">
                                                        {session.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                    >
                                                        Details
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell
                                                colSpan={6}
                                                className="h-24 text-center text-sm text-muted-foreground"
                                            >
                                                No sessions found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
                    <Card>
                        <CardHeader className="flex-row items-center justify-between gap-4">
                            <div>
                                <CardTitle>This week</CardTitle>
                                <CardDescription>
                                    Sessions grouped by upcoming day.
                                </CardDescription>
                            </div>
                            <Badge variant="secondary">
                                {sessions.length} sessions
                            </Badge>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {sessions.length > 0 ? (
                                sessions.map((session) => (
                                    <div
                                        key={session.id}
                                        className="grid gap-4 rounded-lg border p-4 md:grid-cols-[auto_minmax(0,1fr)_auto]"
                                    >
                                        <div className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                            <GraduationCap className="size-5" />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h2 className="font-semibold">
                                                    {session.title}
                                                </h2>
                                                <Badge variant="outline">
                                                    {session.status}
                                                </Badge>
                                            </div>
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                {session.program}
                                            </p>
                                            <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
                                                <span className="flex items-center gap-1.5">
                                                    <Clock3 className="size-4" />
                                                    {session.time}
                                                </span>
                                                <span className="flex items-center gap-1.5">
                                                    <UserRoundCheck className="size-4" />
                                                    {session.mentor}
                                                </span>
                                            </div>
                                        </div>
                                        <Button variant="outline" size="sm">
                                            Details
                                        </Button>
                                    </div>
                                ))
                            ) : (
                                <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                                    No booked sessions yet.
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Next session</CardTitle>
                            <CardDescription>
                                Quick overview before joining.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="rounded-lg border p-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                                        <MonitorUp className="size-5" />
                                    </div>
                                    <div>
                                        <p className="font-medium">
                                            {nextSession?.title ??
                                                'No session booked'}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {nextSession?.time ??
                                                'Book a session to see it here.'}
                                        </p>
                                    </div>
                                </div>
                                {nextSession?.zoomLink ? (
                                    <Button asChild className="mt-4 w-full">
                                        <a
                                            href={nextSession.zoomLink}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            Join session
                                        </a>
                                    </Button>
                                ) : (
                                    <Button className="mt-4 w-full" disabled>
                                        Join session
                                    </Button>
                                )}
                            </div>
                            <div className="rounded-lg border p-4">
                                <p className="flex items-center gap-2 font-medium">
                                    <CheckCircle2 className="size-4 text-primary" />
                                    Preparation
                                </p>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    Bring your latest dashboard assignment and
                                    layout questions.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}

StudentSchedules.layout = {
    breadcrumbs: [
        {
            title: 'Schedules',
            href: '/scheduling/schedules',
        },
    ],
};
