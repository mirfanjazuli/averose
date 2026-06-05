import { Head } from '@inertiajs/react';
import {
    CalendarDays,
    CheckCircle2,
    Clock3,
    GraduationCap,
    Plus,
    UserRoundCheck,
    UsersRound,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const stats = [
    { label: 'Assigned pairs', value: '42', icon: UsersRound },
    { label: 'Available mentors', value: '9', icon: UserRoundCheck },
    { label: 'Pending review', value: '6', icon: Clock3 },
];

const assignments = [
    {
        student: 'Alya Prameswari',
        mentor: 'Megan Norton',
        program: 'Frontend Basics',
        schedule: 'Tue, 09:00',
        status: 'Active',
        avatar: 'https://i.pravatar.cc/96?img=5',
    },
    {
        student: 'Rafi Hidayat',
        mentor: 'Floyd Miles',
        program: 'Laravel Starter',
        schedule: 'Wed, 13:00',
        status: 'Active',
        avatar: 'https://i.pravatar.cc/96?img=14',
    },
    {
        student: 'Nadia Putri',
        mentor: 'Guy Hawkins',
        program: 'React Advanced',
        schedule: 'Pending',
        status: 'Needs review',
        avatar: 'https://i.pravatar.cc/96?img=20',
    },
];

export default function MentorAssignments() {
    return (
        <>
            <Head title="Mentor Assignment" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="font-heading text-2xl font-semibold">
                            Mentor Assignment
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Pair students with mentors and monitor assignment
                            readiness.
                        </p>
                    </div>
                    <Button className="gap-2">
                        <Plus className="size-4" />
                        New assignment
                    </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    {stats.map((item) => (
                        <Card key={item.label}>
                            <CardContent className="flex items-center gap-4 px-6 py-5">
                                <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                    <item.icon className="size-5" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        {item.label}
                                    </p>
                                    <p className="text-2xl font-semibold">
                                        {item.value}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <Card>
                    <CardHeader className="flex-row items-center justify-between">
                        <CardTitle>Assignments</CardTitle>
                        <Badge variant="secondary">
                            {assignments.length} pairs
                        </Badge>
                    </CardHeader>
                    <CardContent>
                        <div className="divide-y rounded-2xl border">
                            {assignments.map((assignment) => (
                                <div
                                    key={`${assignment.student}-${assignment.mentor}`}
                                    className="grid gap-4 p-4 md:grid-cols-[minmax(0,1fr)_10rem_8rem_8rem_auto]"
                                >
                                    <div className="flex min-w-0 items-center gap-3">
                                        <Avatar>
                                            <AvatarImage
                                                src={assignment.avatar}
                                                alt={assignment.student}
                                            />
                                            <AvatarFallback>
                                                {assignment.student
                                                    .split(' ')
                                                    .map((part) => part[0])
                                                    .join('')}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0">
                                            <p className="truncate font-medium">
                                                {assignment.student}
                                            </p>
                                            <p className="truncate text-sm text-muted-foreground">
                                                Mentor: {assignment.mentor}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center">
                                        <Badge variant="outline">
                                            <GraduationCap className="size-3" />
                                            {assignment.program}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <CalendarDays className="size-4" />
                                        {assignment.schedule}
                                    </div>
                                    <div className="flex items-center">
                                        <Badge
                                            variant={
                                                assignment.status === 'Active'
                                                    ? 'default'
                                                    : 'secondary'
                                            }
                                        >
                                            {assignment.status}
                                        </Badge>
                                    </div>
                                    <Button variant="outline" size="sm">
                                        <CheckCircle2 className="size-4" />
                                        Review
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

MentorAssignments.layout = {
    breadcrumbs: [
        {
            title: 'Mentor Assignment',
            href: '/schedules/mentor-assignments',
        },
    ],
};
