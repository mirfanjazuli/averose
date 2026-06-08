import { Head } from '@inertiajs/react';
import {
    ArrowUpRight,
    BookOpenCheck,
    CalendarDays,
    CheckCircle2,
    Clock3,
    GraduationCap,
    MonitorUp,
} from 'lucide-react';
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

type StudentStats = {
    activePrograms: number;
    completedLessons: number;
    progress: number;
    upcomingSessions: number;
};

export default function StudentDashboard({
    sessions,
    stats,
    subjects,
}: {
    sessions: StudentSession[];
    stats: StudentStats;
    subjects: BookingSubjectOption[];
}) {
    const statCards = [
        {
            label: 'Active programs',
            value: stats.activePrograms.toString(),
            helper: 'Currently enrolled',
            icon: GraduationCap,
        },
        {
            label: 'Upcoming sessions',
            value: stats.upcomingSessions.toString(),
            helper: 'Pending and assigned',
            icon: CalendarDays,
        },
        {
            label: 'Completed lessons',
            value: stats.completedLessons.toString(),
            helper: `${stats.progress}% progress`,
            icon: BookOpenCheck,
        },
    ];
    const nextSession = sessions[0] ?? null;
    const currentTime = new Date();
    const canJoinNextSession =
        Boolean(nextSession?.zoomLink) &&
        currentTime >= new Date(nextSession.startAt) &&
        currentTime <= new Date(nextSession.endAt);

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
                            Track your programs, sessions, and learning
                            progress.
                        </p>
                    </div>
                    <StudentBookSessionDialog
                        subjects={subjects}
                        trigger={
                            <Button className="gap-2">
                                Book session
                                <ArrowUpRight className="size-4" />
                            </Button>
                        }
                    />
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    {statCards.map((item) => (
                        <Card key={item.label}>
                            <CardContent className="flex items-center gap-4 px-6 py-5">
                                <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                    <item.icon className="size-5" />
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
                    ))}
                </div>

                <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
                    <Card>
                        <CardHeader>
                            <CardTitle>Upcoming sessions</CardTitle>
                            <CardDescription>
                                Your next mentor sessions.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {sessions.length > 0 ? (
                                sessions.map((session) => (
                                    <div
                                        key={session.id}
                                        className="flex flex-wrap items-center justify-between gap-4 rounded-lg border p-4"
                                    >
                                        <div>
                                            <p className="font-medium">
                                                {session.title}
                                            </p>
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                {session.mentor}
                                            </p>
                                            <p className="mt-1 text-xs text-muted-foreground">
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
                                <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                                    No upcoming sessions yet.
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Next session</CardTitle>
                            <CardDescription>
                                Join becomes available when the Zoom link is
                                ready and the session time has started.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="rounded-lg border p-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
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
                                <p className="mt-2 text-sm text-muted-foreground">
                                    {nextSession?.zoomLink
                                        ? 'Zoom link is assigned. Join opens at session start time.'
                                        : 'Zoom link has not been assigned yet.'}
                                </p>
                                {canJoinNextSession && nextSession?.zoomLink ? (
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
                            <div>
                                <div className="mb-2 flex items-center justify-between text-sm">
                                    <span className="font-medium">
                                        Frontend Basics
                                    </span>
                                    <span className="text-muted-foreground">
                                        72%
                                    </span>
                                </div>
                                <div className="h-3 rounded-full bg-muted">
                                    <div className="h-full w-[72%] rounded-full bg-primary" />
                                </div>
                            </div>
                            <div className="rounded-lg border p-4">
                                <p className="flex items-center gap-2 font-medium">
                                    <CheckCircle2 className="size-4 text-primary" />
                                    Next milestone
                                </p>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    Submit responsive dashboard assignment for
                                    mentor review.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}

StudentDashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: '/dashboard',
        },
    ],
};
