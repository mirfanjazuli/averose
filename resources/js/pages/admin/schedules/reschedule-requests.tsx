import { Form, Head, usePage } from '@inertiajs/react';
import {
    CalendarClock,
    Check,
    Clock3,
    MessageSquareText,
    Repeat2,
    X,
} from 'lucide-react';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type RescheduleRequest = {
    adminNote: string | null;
    current: string;
    id: string;
    mentor: string;
    notes: string | null;
    program: string;
    reason: string;
    requested: string;
    reviewedAt: string | null;
    reviewer: string | null;
    session: string;
    status: string;
    student: string;
};

type Summary = {
    approved: number;
    pending: number;
    rejected: number;
};

const summaryCards = [
    { key: 'pending', label: 'Pending', icon: Clock3 },
    { key: 'approved', label: 'Approved', icon: Check },
    { key: 'rejected', label: 'Rejected', icon: X },
] as const;

export default function RescheduleRequests({
    requests,
    summary,
}: {
    requests: RescheduleRequest[];
    summary: Summary;
}) {
    const page = usePage<{ flash?: { success?: string } }>();

    useEffect(() => {
        if (page.props.flash?.success) {
            toast.success(page.props.flash.success);
        }
    }, [page.props.flash?.success]);

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
                            Review student schedule change requests. Mentor only
                            receives the request information.
                        </p>
                    </div>
                    <Badge variant="secondary" className="px-3 py-1.5">
                        {requests.length} total
                    </Badge>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    {summaryCards.map((item) => (
                        <Card key={item.key}>
                            <CardContent className="flex items-center gap-4 px-6 py-5">
                                <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                    <item.icon className="size-5" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        {item.label}
                                    </p>
                                    <p className="text-2xl font-semibold">
                                        {summary[item.key]}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <Card>
                    <CardHeader className="flex-row items-center justify-between">
                        <CardTitle>Requests</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {requests.length > 0 ? (
                            requests.map((request) => (
                                <div
                                    key={request.id}
                                    className="grid gap-4 rounded-lg border p-4 lg:grid-cols-[minmax(0,1fr)_12rem_12rem_8rem_auto]"
                                >
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <p className="truncate font-medium">
                                                {request.student}
                                            </p>
                                            <Badge variant="outline">
                                                {request.session}
                                            </Badge>
                                        </div>
                                        <p className="mt-1 truncate text-sm text-muted-foreground">
                                            Mentor: {request.mentor}
                                        </p>
                                        <p className="truncate text-sm text-muted-foreground">
                                            Program: {request.program}
                                        </p>
                                        <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                                            <MessageSquareText className="size-3.5" />
                                            {request.reason}
                                        </p>
                                        {request.notes && (
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                {request.notes}
                                            </p>
                                        )}
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
                                                    : 'outline'
                                            }
                                            className={
                                                request.status === 'Approved'
                                                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                                    : request.status ===
                                                        'Rejected'
                                                      ? 'border-destructive/30 text-destructive'
                                                      : undefined
                                            }
                                        >
                                            {request.status}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center justify-end gap-2">
                                        {request.status === 'Pending' ? (
                                            <>
                                                <Form
                                                    action={`/scheduling/reschedule-requests/${request.id}/reject`}
                                                    method="put"
                                                >
                                                    {({ processing }) => (
                                                        <Button
                                                            type="submit"
                                                            variant="outline"
                                                            size="icon-sm"
                                                            disabled={
                                                                processing
                                                            }
                                                        >
                                                            <X className="size-4" />
                                                        </Button>
                                                    )}
                                                </Form>
                                                <Form
                                                    action={`/scheduling/reschedule-requests/${request.id}/approve`}
                                                    method="put"
                                                >
                                                    {({ processing }) => (
                                                        <Button
                                                            type="submit"
                                                            size="icon-sm"
                                                            disabled={
                                                                processing
                                                            }
                                                        >
                                                            <Check className="size-4" />
                                                        </Button>
                                                    )}
                                                </Form>
                                            </>
                                        ) : (
                                            <p className="text-right text-xs text-muted-foreground">
                                                {request.reviewedAt
                                                    ? `Reviewed ${request.reviewedAt}`
                                                    : 'Reviewed'}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                                No reschedule requests yet.
                            </div>
                        )}
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
