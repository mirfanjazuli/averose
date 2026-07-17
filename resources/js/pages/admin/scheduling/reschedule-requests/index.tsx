import { Form, Head, usePage } from '@inertiajs/react';
import {
    CalendarClock,
    Check,
    Clock3,
    MessageSquareText,
    Repeat2,
    X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { EmptyState } from '@/components/admin/empty-state';
import { SummaryCard } from '@/components/admin/summary-card';
import { TablePagination } from '@/components/admin/table-pagination';
import { TableSearch } from '@/components/admin/table-search';
import { formatBadgeLabel, getBadgeProps } from '@/lib/badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useClientPagination } from '@/hooks/use-client-pagination';

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
    { key: 'total', label: 'Total requests', icon: CalendarClock },
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
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (page.props.flash?.success) {
            toast.success(page.props.flash.success);
        }
    }, [page.props.flash?.success]);

    const filteredRequests = useMemo(() => {
        const normalizedSearch = searchQuery.trim().toLowerCase();

        if (!normalizedSearch) {
            return requests;
        }

        return requests.filter((request) =>
            [
                request.student,
                request.mentor,
                request.program,
                request.session,
                request.reason,
                request.notes ?? '',
                request.current,
                request.requested,
                request.status,
            ].some((value) => value.toLowerCase().includes(normalizedSearch)),
        );
    }, [requests, searchQuery]);
    const {
        changeRowsPerPage,
        firstItemIndex,
        goToPage,
        resetPage,
        rowsPerPage,
        safeCurrentPage,
        totalPages,
        visibleItems: visibleRequests,
    } = useClientPagination({ items: filteredRequests });
    const summaryValues = {
        ...summary,
        total: requests.length,
    };

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
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {summaryCards.map((item) => (
                        <SummaryCard
                            key={item.key}
                            icon={item.icon}
                            label={item.label}
                            value={summaryValues[item.key]}
                        />
                    ))}
                </div>

                <Card>
                    <CardHeader className="gap-4 md:flex-row md:items-center md:justify-between">
                        <CardTitle>Requests</CardTitle>
                        <TableSearch
                            value={searchQuery}
                            onChange={(value) => {
                                setSearchQuery(value);
                                resetPage();
                            }}
                            placeholder="Search requests..."
                        />
                    </CardHeader>
                    <CardContent>
                        {requests.length === 0 ? (
                            <EmptyState>No reschedule requests yet.</EmptyState>
                        ) : filteredRequests.length === 0 ? (
                            <EmptyState>
                                No reschedule requests match your search.
                            </EmptyState>
                        ) : (
                            <>
                                <div className="rounded-2xl border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Student</TableHead>
                                                <TableHead>Session</TableHead>
                                                <TableHead>Current</TableHead>
                                                <TableHead>Requested</TableHead>
                                                <TableHead>Reason</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="w-24 text-right" />
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {visibleRequests.map((request) => (
                                                <TableRow key={request.id}>
                                                    <TableCell>
                                                        <p className="font-medium">
                                                            {request.student}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            Mentor:{' '}
                                                            {request.mentor}
                                                        </p>
                                                    </TableCell>
                                                    <TableCell>
                                                        <p className="font-medium">
                                                            {request.session}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {request.program}
                                                        </p>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <CalendarClock className="size-4 text-muted-foreground" />
                                                            <span>
                                                                {
                                                                    request.current
                                                                }
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <Repeat2 className="size-4 text-primary" />
                                                            <span>
                                                                {
                                                                    request.requested
                                                                }
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="max-w-64">
                                                            <p className="flex items-center gap-1.5 text-sm">
                                                                <MessageSquareText className="size-3.5 text-muted-foreground" />
                                                                {request.reason}
                                                            </p>
                                                            {request.notes && (
                                                                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                                                                    {
                                                                        request.notes
                                                                    }
                                                                </p>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            {...getBadgeProps(
                                                                request.status ===
                                                                    'Approved'
                                                                    ? 'success'
                                                                    : request.status ===
                                                                        'Rejected'
                                                                      ? 'danger'
                                                                      : 'muted',
                                                            )}
                                                        >
                                                            {formatBadgeLabel(
                                                                request.status,
                                                            )}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {request.status ===
                                                        'Pending' ? (
                                                            <div className="flex justify-end gap-2">
                                                                <Form
                                                                    action={`/scheduling/reschedule-requests/${request.id}/reject`}
                                                                    method="put"
                                                                >
                                                                    {({
                                                                        processing,
                                                                    }) => (
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
                                                                    {({
                                                                        processing,
                                                                    }) => (
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
                                                            </div>
                                                        ) : (
                                                            <p className="text-right text-xs text-muted-foreground">
                                                                {request.reviewedAt
                                                                    ? `Reviewed ${request.reviewedAt}`
                                                                    : 'Reviewed'}
                                                            </p>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                                <TablePagination
                                    entity="requests"
                                    firstItemIndex={firstItemIndex}
                                    onPageChange={goToPage}
                                    onRowsPerPageChange={changeRowsPerPage}
                                    rowsPerPage={rowsPerPage}
                                    safeCurrentPage={safeCurrentPage}
                                    totalItems={filteredRequests.length}
                                    totalPages={totalPages}
                                />
                            </>
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
