import { Head, Link } from '@inertiajs/react';
import { CircleCheck, Eye, Info, Video } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { ActionMenu } from '@/components/admin/action-menu';
import { StatusBadge } from '@/components/admin/status-badge';
import { AdminStatusFilter } from '@/components/admin/status-filter';
import { AdminTableSection } from '@/components/admin/table-section';
import { CompleteSessionDialog } from '@/components/mentor/complete-session-dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
import { formatBadgeLabel } from '@/lib/badge';
import {
    formatDate,
    formatTimeRange,
    formatTimezoneName,
} from '@/lib/date-time';

type MentorSession = {
    code: string;
    deliveryMode: string;
    endAt: string;
    hasJournal: boolean;
    id: string;
    program: string;
    rescheduleRequest: {
        id: string;
        reason: string;
        requestedEndAt: string;
        requestedStartAt: string;
        status: string;
    } | null;
    startAt: string;
    status: string;
    student: string;
    title: string;
    zoomAccount: string | null;
    zoomAccountSlug: string | null;
    zoomLink: string | null;
    zoomMeetingId: string | null;
    zoomPasscode: string | null;
    zoomStartUrl: string | null;
};

const completableStatuses = new Set(['assigned', 'rescheduled']);

function useCurrentServerTime(serverNow: string) {
    const [currentTime, setCurrentTime] = useState(() =>
        new Date(serverNow).getTime(),
    );

    useEffect(() => {
        const serverStartedAt = new Date(serverNow).getTime();
        const clientStartedAt = Date.now();
        const updateCurrentTime = () => {
            setCurrentTime(serverStartedAt + Date.now() - clientStartedAt);
        };
        const interval = window.setInterval(updateCurrentTime, 10_000);

        updateCurrentTime();

        return () => window.clearInterval(interval);
    }, [serverNow]);

    return currentTime;
}

export default function MentorSchedules({
    serverNow,
    sessions,
}: {
    serverNow: string;
    sessions: MentorSession[];
}) {
    const timezone = useUserTimezone();
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [completionDialogOpen, setCompletionDialogOpen] = useState(false);
    const [selectedCompletionSession, setSelectedCompletionSession] =
        useState<MentorSession | null>(null);
    const currentTime = useCurrentServerTime(serverNow);

    const filteredSessions = useMemo(() => {
        const normalizedSearch = searchQuery.trim().toLowerCase();

        return sessions.filter((session) => {
            const matchesStatus =
                statusFilter === 'all' || session.status === statusFilter;
            const matchesSearch =
                !normalizedSearch ||
                [
                    session.code,
                    session.deliveryMode,
                    session.title,
                    session.student,
                    session.program,
                    session.status,
                    formatDate(session.startAt, timezone),
                    formatTimeRange(session.startAt, session.endAt, timezone, {
                        includeTimezone: false,
                    }),
                    session.zoomAccount ?? '',
                ].some((value) =>
                    value.toLowerCase().includes(normalizedSearch),
                );

            return matchesStatus && matchesSearch;
        });
    }, [searchQuery, sessions, statusFilter, timezone]);
    const {
        changeRowsPerPage,
        firstItemIndex,
        goToPage,
        resetPage,
        rowsPerPage,
        safeCurrentPage,
        totalPages,
        visibleItems: visibleSessions,
    } = useClientPagination({ items: filteredSessions });
    const pendingRescheduleCount = sessions.filter(
        (session) => session.rescheduleRequest,
    ).length;
    const statusOptions = useMemo(
        () => [
            { label: 'All schedules', value: 'all' },
            ...Array.from(new Set(sessions.map((session) => session.status)))
                .sort((firstStatus, secondStatus) =>
                    firstStatus.localeCompare(secondStatus),
                )
                .map((status) => ({
                    label: formatBadgeLabel(status),
                    value: status,
                })),
        ],
        [sessions],
    );

    return (
        <>
            <Head title="Schedules" />
            <div className="flex min-h-full max-w-full min-w-0 flex-1 flex-col gap-6 p-4">
                {selectedCompletionSession && (
                    <CompleteSessionDialog
                        key={selectedCompletionSession.id}
                        open={completionDialogOpen}
                        onOpenChange={setCompletionDialogOpen}
                        session={selectedCompletionSession}
                    />
                )}

                <h1 className="font-heading text-2xl font-semibold">
                    Schedules
                </h1>

                {pendingRescheduleCount > 0 && (
                    <Alert className="rounded-xl border-0 bg-amber-50 text-amber-950 dark:bg-amber-950/40 dark:text-amber-100">
                        <Info className="size-4" />
                        <AlertTitle>
                            {pendingRescheduleCount} reschedule{' '}
                            {pendingRescheduleCount === 1
                                ? 'request'
                                : 'requests'}{' '}
                            pending
                        </AlertTitle>
                        <AlertDescription className="text-amber-800 dark:text-amber-200">
                            Admin approval is in progress. Hover the marked
                            status to review the requested schedule.
                        </AlertDescription>
                    </Alert>
                )}

                <AdminTableSection
                    emptyMessage="No sessions assigned yet."
                    emptySearchMessage="No sessions match your filters."
                    filteredItems={filteredSessions.length}
                    pagination={{
                        entity: 'sessions',
                        firstItemIndex,
                        onPageChange: goToPage,
                        onRowsPerPageChange: changeRowsPerPage,
                        rowsPerPage,
                        safeCurrentPage,
                        totalItems: filteredSessions.length,
                        totalPages,
                    }}
                    search={{
                        value: searchQuery,
                        onChange: (value) => {
                            setSearchQuery(value);
                            resetPage();
                        },
                        placeholder: 'Search schedules...',
                    }}
                    tableMinWidth="58rem"
                    toolbarEnd={
                        <AdminStatusFilter
                            value={statusFilter}
                            options={statusOptions}
                            onValueChange={(value) => {
                                setStatusFilter(value);
                                resetPage();
                            }}
                        />
                    }
                    totalItems={sessions.length}
                >
                    <Table className="w-full">
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>
                                    Time (
                                    {formatTimezoneName(new Date(), timezone)})
                                </TableHead>
                                <TableHead>Student</TableHead>
                                <TableHead>Subject</TableHead>
                                <TableHead>Program</TableHead>
                                <TableHead>Delivery</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="w-12 text-right" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {visibleSessions.map((session) => {
                                const startAt = new Date(
                                    session.startAt,
                                ).getTime();
                                const endAt = new Date(session.endAt).getTime();
                                const hasActiveStatus = completableStatuses.has(
                                    session.status.toLowerCase(),
                                );
                                const canJoin =
                                    hasActiveStatus &&
                                    Boolean(session.zoomLink) &&
                                    currentTime >= startAt - 5 * 60 * 1000 &&
                                    currentTime <= endAt;
                                const shouldShowJoin = currentTime <= endAt;
                                const shouldShowOnlineJoin =
                                    session.deliveryMode === 'online' &&
                                    shouldShowJoin;
                                const canComplete =
                                    hasActiveStatus &&
                                    !session.hasJournal &&
                                    currentTime > endAt;

                                return (
                                    <TableRow key={session.id}>
                                        <TableCell className="whitespace-nowrap">
                                            {formatDate(
                                                session.startAt,
                                                timezone,
                                            )}
                                        </TableCell>
                                        <TableCell className="whitespace-nowrap">
                                            {formatTimeRange(
                                                session.startAt,
                                                session.endAt,
                                                timezone,
                                                { includeTimezone: false },
                                            )}
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {session.student}
                                        </TableCell>
                                        <TableCell>
                                            <p className="font-medium">
                                                {session.title}
                                            </p>
                                        </TableCell>
                                        <TableCell>{session.program}</TableCell>
                                        <TableCell>
                                            <StatusBadge
                                                status={session.deliveryMode}
                                                tone="outline"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <StatusBadge
                                                    status={session.status}
                                                />
                                                {session.rescheduleRequest && (
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <span className="inline-flex cursor-help">
                                                                <StatusBadge
                                                                    status="pending"
                                                                    label="Reschedule pending"
                                                                    tone="warning"
                                                                />
                                                            </span>
                                                        </TooltipTrigger>
                                                        <TooltipContent className="max-w-xs">
                                                            <p className="font-medium">
                                                                Requested
                                                                schedule
                                                            </p>
                                                            <p>
                                                                {formatTimeRange(
                                                                    session
                                                                        .rescheduleRequest
                                                                        .requestedStartAt,
                                                                    session
                                                                        .rescheduleRequest
                                                                        .requestedEndAt,
                                                                    timezone,
                                                                )}
                                                            </p>
                                                            <p className="mt-2 font-medium">
                                                                Reason
                                                            </p>
                                                            <p>
                                                                {
                                                                    session
                                                                        .rescheduleRequest
                                                                        .reason
                                                                }
                                                            </p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <ActionMenu label="Open schedule actions">
                                                {shouldShowOnlineJoin &&
                                                    (canJoin ? (
                                                        <DropdownMenuItem
                                                            asChild
                                                        >
                                                            <a
                                                                href={
                                                                    session.zoomLink ??
                                                                    '#'
                                                                }
                                                                target="_blank"
                                                                rel="noreferrer"
                                                            >
                                                                <Video className="size-4" />
                                                                Join session
                                                            </a>
                                                        </DropdownMenuItem>
                                                    ) : (
                                                        <DropdownMenuItem
                                                            disabled
                                                        >
                                                            <Video className="size-4" />
                                                            Join session
                                                        </DropdownMenuItem>
                                                    ))}
                                                {canComplete && (
                                                    <DropdownMenuItem
                                                        onSelect={() => {
                                                            setSelectedCompletionSession(
                                                                session,
                                                            );
                                                            setCompletionDialogOpen(
                                                                true,
                                                            );
                                                        }}
                                                    >
                                                        <CircleCheck className="size-4" />
                                                        Complete
                                                    </DropdownMenuItem>
                                                )}
                                                {(shouldShowJoin ||
                                                    canComplete) && (
                                                    <DropdownMenuSeparator />
                                                )}
                                                <DropdownMenuItem asChild>
                                                    <Link
                                                        href={`/schedules/${session.id}`}
                                                    >
                                                        <Eye className="size-4" />
                                                        View detail
                                                    </Link>
                                                </DropdownMenuItem>
                                            </ActionMenu>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </AdminTableSection>
            </div>
        </>
    );
}

MentorSchedules.layout = {
    breadcrumbs: [
        {
            title: 'Schedules',
            href: '/schedules',
        },
    ],
};
