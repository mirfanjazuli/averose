import { Head, Link } from '@inertiajs/react';
import {
    ArrowUpRight,
    CalendarCheck2,
    Clock3,
    MessageSquareText,
    MonitorUp,
    Star,
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

const stats = [
    {
        label: 'Sessions today',
        value: '4',
        helper: '2 completed',
        icon: CalendarCheck2,
    },
    {
        label: 'Assigned students',
        value: '18',
        helper: '5 active programs',
        icon: UsersRound,
    },
    {
        label: 'Average rating',
        value: '4.9',
        helper: 'Last 30 days',
        icon: Star,
    },
];

const todaySchedules = [
    {
        student: 'Alya Prameswari',
        program: 'Frontend Basics',
        time: '09:00 - 10:00',
        status: 'Next',
    },
    {
        student: 'Raka Mahendra',
        program: 'Laravel Starter',
        time: '13:00 - 14:00',
        status: 'Confirmed',
    },
    {
        student: 'Nadia Putri',
        program: 'React Advanced',
        time: '16:00 - 17:00',
        status: 'Confirmed',
    },
];

const focusItems = [
    'Review capstone progress for Frontend Basics cohort.',
    'Prepare feedback notes for Laravel Starter students.',
    'Open next week availability before 18:00.',
];

export default function MentorDashboard() {
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
                    <Button asChild className="gap-2">
                        <Link href="/settings/profile">
                            Update availability
                            <ArrowUpRight className="size-4" />
                        </Link>
                    </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    {stats.map((item) => (
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
                            <CardTitle>Today&apos;s sessions</CardTitle>
                            <CardDescription>
                                Upcoming mentor sessions and student context.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {todaySchedules.map((schedule) => (
                                <div
                                    key={`${schedule.student}-${schedule.time}`}
                                    className="flex flex-wrap items-center justify-between gap-4 rounded-lg border p-4"
                                >
                                    <div className="min-w-0">
                                        <p className="font-medium">
                                            {schedule.student}
                                        </p>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            {schedule.program}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <p className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Clock3 className="size-4" />
                                            {schedule.time}
                                        </p>
                                        <Badge variant="secondary">
                                            {schedule.status}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Session room</CardTitle>
                            <CardDescription>
                                Quick access for the next online session.
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
                                <p className="flex items-center gap-2 font-medium">
                                    <MessageSquareText className="size-4 text-primary" />
                                    Latest note
                                </p>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    Alya asked for extra review on responsive
                                    layout composition.
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
