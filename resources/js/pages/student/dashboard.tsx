import { Head, Link } from '@inertiajs/react';
import {
    ArrowUpRight,
    BookOpenCheck,
    CalendarDays,
    CheckCircle2,
    Clock3,
    GraduationCap,
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
        label: 'Active programs',
        value: '2',
        helper: 'Frontend Basics, UI Design',
        icon: GraduationCap,
    },
    {
        label: 'Upcoming sessions',
        value: '3',
        helper: 'This week',
        icon: CalendarDays,
    },
    {
        label: 'Completed lessons',
        value: '18',
        helper: '72% progress',
        icon: BookOpenCheck,
    },
];

const sessions = [
    {
        title: 'Responsive layout review',
        mentor: 'Megan Norton',
        time: 'Today, 09:00',
        status: 'Next',
    },
    {
        title: 'Component composition',
        mentor: 'Raka Mahendra',
        time: 'Wednesday, 14:00',
        status: 'Confirmed',
    },
    {
        title: 'Portfolio feedback',
        mentor: 'Nadia Putri',
        time: 'Friday, 10:00',
        status: 'Confirmed',
    },
];

export default function StudentDashboard() {
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
                    <Button asChild className="gap-2">
                        <Link href="/settings/profile">
                            Update profile
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
                            <CardTitle>Upcoming sessions</CardTitle>
                            <CardDescription>
                                Your next mentor sessions.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {sessions.map((session) => (
                                <div
                                    key={`${session.title}-${session.time}`}
                                    className="flex flex-wrap items-center justify-between gap-4 rounded-lg border p-4"
                                >
                                    <div>
                                        <p className="font-medium">
                                            {session.title}
                                        </p>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            {session.mentor}
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
                            ))}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Progress</CardTitle>
                            <CardDescription>
                                Current completion snapshot.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
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
