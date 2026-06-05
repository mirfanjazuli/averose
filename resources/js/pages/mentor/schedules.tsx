import { Head } from '@inertiajs/react';
import {
    CalendarCheck2,
    Clock3,
    MessageSquareText,
    MonitorUp,
    UserRound,
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

const sessions = [
    {
        student: 'Alya Prameswari',
        program: 'Frontend Basics',
        time: '09:00 - 10:00',
        status: 'Next',
        note: 'Review responsive layout assignment.',
    },
    {
        student: 'Raka Mahendra',
        program: 'Laravel Starter',
        time: '13:00 - 14:00',
        status: 'Confirmed',
        note: 'Discuss validation and form request structure.',
    },
    {
        student: 'Nadia Putri',
        program: 'React Advanced',
        time: '16:00 - 17:00',
        status: 'Confirmed',
        note: 'Prepare feedback for component composition.',
    },
];

const weekSummary = [
    { day: 'Mon', sessions: 3 },
    { day: 'Tue', sessions: 4 },
    { day: 'Wed', sessions: 2 },
    { day: 'Thu', sessions: 5 },
    { day: 'Fri', sessions: 3 },
];

export default function MentorSchedules() {
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
                            View your upcoming mentoring sessions and session
                            notes.
                        </p>
                    </div>
                    <Button variant="outline" className="gap-2">
                        <CalendarCheck2 className="size-4" />
                        Manage availability
                    </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-5">
                    {weekSummary.map((item) => (
                        <Card key={item.day} className="py-4">
                            <CardContent className="px-4 text-center">
                                <p className="text-xs text-muted-foreground">
                                    {item.day}
                                </p>
                                <p className="mt-1 text-2xl font-semibold">
                                    {item.sessions}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    sessions
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
                    <Card>
                        <CardHeader className="flex-row items-center justify-between gap-4">
                            <div>
                                <CardTitle>Today</CardTitle>
                                <CardDescription>
                                    Sessions assigned to you.
                                </CardDescription>
                            </div>
                            <Badge variant="secondary">
                                {sessions.length} sessions
                            </Badge>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {sessions.map((session) => (
                                <div
                                    key={`${session.student}-${session.time}`}
                                    className="grid gap-4 rounded-lg border p-4 md:grid-cols-[auto_minmax(0,1fr)_auto]"
                                >
                                    <div className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                        <UserRound className="size-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h2 className="font-semibold">
                                                {session.student}
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
                                                <MessageSquareText className="size-4" />
                                                {session.note}
                                            </span>
                                        </div>
                                    </div>
                                    <Button variant="outline" size="sm">
                                        Details
                                    </Button>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Next session</CardTitle>
                            <CardDescription>
                                Quick access to your session room.
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
                                            Frontend Basics
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            Starts at 09:00
                                        </p>
                                    </div>
                                </div>
                                <Button className="mt-4 w-full">
                                    Open room
                                </Button>
                            </div>
                            <div className="rounded-lg border p-4">
                                <p className="font-medium">Session prep</p>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    Check the latest assignment submission
                                    before joining the room.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}

MentorSchedules.layout = {
    breadcrumbs: [
        {
            title: 'Schedules',
            href: '/scheduling/schedules',
        },
    ],
};
