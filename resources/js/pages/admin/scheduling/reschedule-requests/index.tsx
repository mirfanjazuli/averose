import { Head, Link } from '@inertiajs/react';
import { CalendarClock, Check, Clock3, Eye, Repeat2, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { ActionMenu } from '@/components/admin/action-menu';
import { SummaryCard } from '@/components/admin/summary-card';
import { AdminTableSection } from '@/components/admin/table-section';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenuItem,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { useClientPagination } from '@/hooks/use-client-pagination';
import { useUserTimezone } from '@/hooks/use-user-timezone';
import { formatBadgeLabel, getBadgeProps } from '@/lib/badge';
import {
    formatDate,
    formatDateTime,
    formatTime,
    formatTimezoneName,
} from '@/lib/date-time';
import {
    ApproveRescheduleDialog,
    RejectRescheduleDialog,
} from './components/review-dialogs';

type RescheduleRequest = {
    adminNote: string | null;
    currentEndAt: string;
    currentStartAt: string;
    id: string;
    mentor: string;
    notes: string | null;
    program: string;
    reason: string;
    requestedEndAt: string;
    requestedStartAt: string;
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
    const timezone = useUserTimezone();
    const [approveRequestId, setApproveRequestId] = useState<string | null>(
        null,
    );
    const [rejectRequestId, setRejectRequestId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredRequests = useMemo(() => {
        const normalizedSearch = searchQuery.trim().toLowerCase();

        if (!normalizedSearch) {
            return requests;
        }

        return requests.filter((request) =>
            [
                request.student,
                request.mentor,
                request.session,
                request.reason,
                request.notes ?? '',
                formatDateTime(request.currentStartAt, timezone),
                formatDateTime(request.requestedStartAt, timezone),
                request.status,
            ].some((value) => value.toLowerCase().includes(normalizedSearch)),
        );
    }, [requests, searchQuery, timezone]);
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
            <div className="flex min-h-full max-w-full min-w-0 flex-1 flex-col gap-6 p-4">
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

                <AdminTableSection
                    emptyMessage="No reschedule requests yet."
                    emptySearchMessage="No reschedule requests match your search."
                    filteredItems={filteredRequests.length}
                    pagination={{
                        entity: 'requests',
                        firstItemIndex,
                        onPageChange: goToPage,
                        onRowsPerPageChange: changeRowsPerPage,
                        rowsPerPage,
                        safeCurrentPage,
                        totalItems: filteredRequests.length,
                        totalPages,
                    }}
                    search={{
                        value: searchQuery,
                        onChange: (value) => {
                            setSearchQuery(value);
                            resetPage();
                        },
                        placeholder: 'Search requests...',
                    }}
                    tableMinWidth="76rem"
                    totalItems={requests.length}
                >
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Student</TableHead>
                                <TableHead>Subject</TableHead>
                                <TableHead>Mentor</TableHead>
                                <TableHead>
                                    Current (
                                    {formatTimezoneName(new Date(), timezone)})
                                </TableHead>
                                <TableHead className="w-12 text-center" />
                                <TableHead>
                                    Requested (
                                    {formatTimezoneName(new Date(), timezone)})
                                </TableHead>
                                <TableHead>Reason</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="w-12 text-right" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {visibleRequests.map((request) => (
                                <TableRow key={request.id}>
                                    <TableCell>{request.student}</TableCell>
                                    <TableCell className="font-medium">
                                        {request.session}
                                    </TableCell>
                                    <TableCell>{request.mentor}</TableCell>
                                    <TableCell className="whitespace-nowrap">
                                        <div className="flex items-center gap-3">
                                            <p>
                                                {formatDate(
                                                    request.currentStartAt,
                                                    timezone,
                                                )}
                                            </p>
                                            <p className="text-muted-foreground">
                                                {formatTime(
                                                    request.currentStartAt,
                                                    timezone,
                                                    { includeTimezone: false },
                                                )}
                                            </p>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Repeat2 className="mx-auto size-4 text-primary" />
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap">
                                        <div className="flex items-center gap-3 font-medium text-primary">
                                            <p>
                                                {formatDate(
                                                    request.requestedStartAt,
                                                    timezone,
                                                )}
                                            </p>
                                            <p className="font-light">
                                                {formatTime(
                                                    request.requestedStartAt,
                                                    timezone,
                                                    { includeTimezone: false },
                                                )}
                                            </p>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <p className="text-sm">
                                            {request.reason}
                                        </p>
                                    </TableCell>
                                    <TableCell>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Badge
                                                    {...getBadgeProps(
                                                        request.status ===
                                                            'Approved'
                                                            ? 'success'
                                                            : request.status ===
                                                                'Rejected'
                                                              ? 'danger'
                                                              : 'muted',
                                                        'cursor-help',
                                                    )}
                                                >
                                                    {formatBadgeLabel(
                                                        request.status,
                                                    )}
                                                </Badge>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                {request.reviewedAt
                                                    ? `${formatDateTime(request.reviewedAt, timezone)} oleh ${request.reviewer}`
                                                    : 'Waiting for review'}
                                            </TooltipContent>
                                        </Tooltip>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <ActionMenu label="Open request actions">
                                            <DropdownMenuItem asChild>
                                                <Link
                                                    href={`/scheduling/reschedule-requests/${request.id}`}
                                                >
                                                    <Eye className="size-4" />
                                                    View detail
                                                </Link>
                                            </DropdownMenuItem>
                                            {request.status === 'Pending' && (
                                                <>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        onSelect={() =>
                                                            setApproveRequestId(
                                                                request.id,
                                                            )
                                                        }
                                                    >
                                                        <Check className="size-4" />
                                                        Approve
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        variant="destructive"
                                                        onSelect={() =>
                                                            setRejectRequestId(
                                                                request.id,
                                                            )
                                                        }
                                                    >
                                                        <X className="size-4" />
                                                        Reject
                                                    </DropdownMenuItem>
                                                </>
                                            )}
                                        </ActionMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </AdminTableSection>

                <ApproveRescheduleDialog
                    open={approveRequestId !== null}
                    requestId={approveRequestId}
                    onOpenChange={(open) => !open && setApproveRequestId(null)}
                />
                <RejectRescheduleDialog
                    open={rejectRequestId !== null}
                    requestId={rejectRequestId}
                    onOpenChange={(open) => !open && setRejectRequestId(null)}
                />
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
