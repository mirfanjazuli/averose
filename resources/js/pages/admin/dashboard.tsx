import { Head, Link } from '@inertiajs/react';
import {
    ArrowUpRight,
    CalendarDays,
    CheckCircle2,
    Clock3,
    GraduationCap,
    UserRoundCheck,
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
import { dashboard } from '@/routes';

type DashboardStat = {
    href: string;
    label: 'Students' | 'Mentors' | 'Schedules';
    trend: string;
    value: string;
};

type ProgramProgress = {
    label: string;
    value: number;
};

type TodaySession = {
    id: string;
    student: string;
    time: string;
    title: string;
    type: string;
};

type UserComposition = {
    activeAccounts: number;
    verifiedProfiles: number;
};

const statIcons = {
    Mentors: UserRoundCheck,
    Schedules: CalendarDays,
    Students: GraduationCap,
};

export default function Dashboard({
    activities,
    programProgress,
    stats,
    todaySessions,
    userComposition,
}: {
    activities: string[];
    programProgress: ProgramProgress[];
    stats: DashboardStat[];
    todaySessions: TodaySession[];
    userComposition: UserComposition;
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
                            Overview of students, mentors, and today&apos;s
                            schedules.
                        </p>
                    </div>
                    <Button asChild className="gap-2">
                        <Link href="/scheduling/schedules">
                            View schedules
                            <ArrowUpRight className="size-4" />
                        </Link>
                    </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    {stats.map((item) => (
                        <Card key={item.label}>
                            <CardContent className="flex items-center gap-4 px-6 py-5">
                                <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                    {(() => {
                                        const Icon = statIcons[item.label];

                                        return <Icon className="size-5" />;
                                    })()}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm text-muted-foreground">
                                        {item.label}
                                    </p>
                                    <div className="mt-1 flex items-end justify-between gap-3">
                                        <p className="text-2xl font-semibold">
                                            {item.value}
                                        </p>
                                        <Badge variant="secondary">
                                            {item.trend}
                                        </Badge>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
                    <Card>
                        <CardHeader>
                            <CardTitle>Program progress</CardTitle>
                            <CardDescription>
                                Active enrollment by learning program.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            {programProgress.length > 0 ? (
                                programProgress.map((item) => (
                                    <div key={item.label}>
                                        <div className="mb-2 flex items-center justify-between text-sm">
                                            <span className="font-medium">
                                                {item.label}
                                            </span>
                                            <span className="text-muted-foreground">
                                                {item.value}%
                                            </span>
                                        </div>
                                        <div className="h-3 rounded-full bg-muted">
                                            <div
                                                className="h-full rounded-full bg-primary"
                                                style={{
                                                    width: `${item.value}%`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                                    No program enrollment data yet.
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Today</CardTitle>
                            <CardDescription>
                                Upcoming schedules for the team.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {todaySessions.length > 0 ? (
                                todaySessions.map((item) => (
                                    <div
                                        key={item.id}
                                        className="rounded-2xl border p-4"
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <p className="font-medium">
                                                {item.title}
                                            </p>
                                            <Badge variant="outline">
                                                {item.type}
                                            </Badge>
                                        </div>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            {item.student}
                                        </p>
                                        <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                                            <Clock3 className="size-4" />
                                            {item.time}
                                        </p>
                                    </div>
                                ))
                            ) : (
                                <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                                    No sessions scheduled today.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>User composition</CardTitle>
                            <CardDescription>
                                Quick split between active user groups.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2">
                            <div className="rounded-2xl border p-5">
                                <UsersRound className="size-5 text-primary" />
                                <p className="mt-4 text-3xl font-semibold">
                                    {userComposition.activeAccounts}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Total active accounts
                                </p>
                            </div>
                            <div className="rounded-2xl border p-5">
                                <CheckCircle2 className="size-5 text-primary" />
                                <p className="mt-4 text-3xl font-semibold">
                                    {userComposition.verifiedProfiles}%
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Verified user profiles
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Recent activity</CardTitle>
                            <CardDescription>
                                Latest updates from students and mentors.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {activities.length > 0 ? (
                                activities.map((activity) => (
                                    <div
                                        key={activity}
                                        className="flex items-start gap-3 rounded-2xl border p-4"
                                    >
                                        <span className="mt-1 size-2 rounded-full bg-primary" />
                                        <p className="text-sm">{activity}</p>
                                    </div>
                                ))
                            ) : (
                                <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                                    No recent activity yet.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};
