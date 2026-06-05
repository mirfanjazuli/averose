import { Head } from '@inertiajs/react';
import {
    CalendarClock,
    Check,
    Clock3,
    MessageSquareText,
    Repeat2,
    X,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const requests = [
    {
        student: 'Alya Prameswari',
        mentor: 'Megan Norton',
        current: 'Tue, 09:00',
        requested: 'Thu, 10:30',
        reason: 'Class schedule overlap',
        status: 'Pending',
        avatar: 'https://i.pravatar.cc/96?img=5',
    },
    {
        student: 'Rafi Hidayat',
        mentor: 'Floyd Miles',
        current: 'Wed, 13:00',
        requested: 'Fri, 15:00',
        reason: 'Medical appointment',
        status: 'Pending',
        avatar: 'https://i.pravatar.cc/96?img=14',
    },
    {
        student: 'Bagas Wibowo',
        mentor: 'Kristin Watson',
        current: 'Mon, 11:00',
        requested: 'Tue, 16:00',
        reason: 'Project presentation',
        status: 'Approved',
        avatar: 'https://i.pravatar.cc/96?img=31',
    },
];

const summary = [
    { label: 'Pending', value: '2', icon: Clock3 },
    { label: 'Approved', value: '8', icon: Check },
    { label: 'Rejected', value: '1', icon: X },
];

export default function RescheduleRequests() {
    return (
        <>
            <Head title="Reschedule Requests" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="font-heading text-2xl font-semibold">
                            Reschedule Requests
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Review schedule change requests from students and
                            mentors.
                        </p>
                    </div>
                    <Button variant="outline" className="gap-2">
                        <Repeat2 className="size-4" />
                        Sync requests
                    </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    {summary.map((item) => (
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
                        <CardTitle>Requests</CardTitle>
                        <Badge variant="secondary">
                            {requests.length} total
                        </Badge>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {requests.map((request) => (
                            <div
                                key={`${request.student}-${request.requested}`}
                                className="grid gap-4 rounded-2xl border p-4 lg:grid-cols-[minmax(0,1fr)_12rem_12rem_8rem_auto]"
                            >
                                <div className="flex min-w-0 items-center gap-3">
                                    <Avatar>
                                        <AvatarImage
                                            src={request.avatar}
                                            alt={request.student}
                                        />
                                        <AvatarFallback>
                                            {request.student
                                                .split(' ')
                                                .map((part) => part[0])
                                                .join('')}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0">
                                        <p className="truncate font-medium">
                                            {request.student}
                                        </p>
                                        <p className="truncate text-sm text-muted-foreground">
                                            Mentor: {request.mentor}
                                        </p>
                                        <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                                            <MessageSquareText className="size-3.5" />
                                            {request.reason}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <CalendarClock className="size-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-muted-foreground">
                                            Current
                                        </p>
                                        <p className="font-medium">
                                            {request.current}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <Repeat2 className="size-4 text-primary" />
                                    <div>
                                        <p className="text-muted-foreground">
                                            Requested
                                        </p>
                                        <p className="font-medium">
                                            {request.requested}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center">
                                    <Badge
                                        variant={
                                            request.status === 'Pending'
                                                ? 'secondary'
                                                : 'default'
                                        }
                                    >
                                        {request.status}
                                    </Badge>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="icon-sm">
                                        <X className="size-4" />
                                    </Button>
                                    <Button size="icon-sm">
                                        <Check className="size-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

RescheduleRequests.layout = {
    breadcrumbs: [
        {
            title: 'Scheduling',
            href: '/scheduling/schedules',
        },
        {
            title: 'Reschedule Requests',
            href: '/scheduling/reschedule-requests',
        },
    ],
};
