import { Head, Link } from '@inertiajs/react';
import {
    CalendarDays,
    Clock3,
    Eye,
    Pencil,
    UserRoundCheck,
    Video,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { ActionMenu } from '@/components/admin/action-menu';
import { AdminStatusFilter } from '@/components/admin/status-filter';
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
import { useClientPagination } from '@/hooks/use-client-pagination';
import {
    formatBadgeLabel,
    getBadgeProps,
    getStatusBadgeTone,
} from '@/lib/badge';
import { AssignDialogSchedule } from '@/pages/admin/scheduling/schedules/components/assign-dialog-schedule';
import { CreateDialogSchedule } from '@/pages/admin/scheduling/schedules/components/create-dialog-schedule';
import type { EnrollmentOption } from '@/pages/admin/scheduling/schedules/components/create-dialog-schedule';
import { EditDialogSchedule } from '@/pages/admin/scheduling/schedules/components/edit-dialog-schedule';

type AdminSession = {
    code: string;
    deliveryMode: string;
    endAt: string;
    id: string;
    mentor: string;
    program: string;
    startAt: string;
    status: string;
    student: string;
    time: string;
    title: string;
    zoomAccount: string | null;
    zoomAccountSlug: string | null;
    zoomLink: string | null;
    zoomMeetingId: string | null;
    zoomPasscode: string | null;
    zoomStartUrl: string | null;
};

function formatScheduleDate(value: string) {
    return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    }).format(new Date(value));
}

function formatScheduleTimeRange(startAt: string, endAt: string) {
    const formatter = new Intl.DateTimeFormat('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
    });

    return `${formatter.format(new Date(startAt))} - ${formatter.format(new Date(endAt))} WIB`;
}

export default function Schedules({
    enrollments,
    sessions,
}: {
    enrollments: EnrollmentOption[];
    sessions: AdminSession[];
}) {
    const [assigningSession, setAssigningSession] =
        useState<AdminSession | null>(null);
    const [creatingSchedule, setCreatingSchedule] = useState(false);
    const [editingSession, setEditingSession] = useState<AdminSession | null>(
        null,
    );
    const [currentTime, setCurrentTime] = useState(() => Date.now());
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        const interval = window.setInterval(() => {
            setCurrentTime(Date.now());
        }, 30_000);

        return () => window.clearInterval(interval);
    }, []);

    const statusFilters = useMemo(
        () => [
            { count: sessions.length, label: 'All schedules', value: 'all' },
            ...Array.from(new Set(sessions.map((session) => session.status)))
                .sort((firstStatus, secondStatus) =>
                    firstStatus.localeCompare(secondStatus),
                )
                .map((status) => ({
                    count: sessions.filter(
                        (session) => session.status === status,
                    ).length,
                    label: formatBadgeLabel(status),
                    value: status,
                })),
        ],
        [sessions],
    );

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
                    session.mentor,
                    session.status,
                    session.time,
                    session.zoomAccount ?? '',
                ].some((value) =>
                    value.toLowerCase().includes(normalizedSearch),
                );

            return matchesStatus && matchesSearch;
        });
    }, [searchQuery, sessions, statusFilter]);
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
    const assignedCount = sessions.filter(
        (session) => session.status === 'Assigned',
    ).length;
    const pendingCount = sessions.filter(
        (session) => session.status === 'Pending',
    ).length;

    const openAssignmentDialog = (session: AdminSession) => {
        setAssigningSession(session);
    };

    return (
        <>
            <Head title="Schedules" />
            <div className="flex min-h-full max-w-full min-w-0 flex-1 flex-col gap-6 p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="font-heading text-2xl font-semibold">
                            Schedules
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Manage student schedules, mentor assignments, and
                            Zoom allocation.
                        </p>
                    </div>
                    <CreateDialogSchedule
                        enrollments={enrollments}
                        open={creatingSchedule}
                        onOpenChange={setCreatingSchedule}
                        onSuccess={() => {
                            setCreatingSchedule(false);
                            toast.success('Schedule added.');
                        }}
                        onError={() => {
                            toast.error('Unable to add this schedule.');
                        }}
                    />
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <SummaryCard
                        icon={CalendarDays}
                        label="Total schedules"
                        value={sessions.length}
                    />
                    <SummaryCard
                        icon={UserRoundCheck}
                        label="Assigned"
                        value={assignedCount}
                    />
                    <SummaryCard
                        icon={Clock3}
                        label="Pending"
                        value={pendingCount}
                    />
                </div>

                <AssignDialogSchedule
                    key={assigningSession?.id ?? 'closed'}
                    open={assigningSession !== null}
                    schedule={assigningSession}
                    onOpenChange={(open) => {
                        if (!open) {
                            setAssigningSession(null);
                        }
                    }}
                    onSuccess={() => {
                        setAssigningSession(null);
                        toast.success('Session assigned.');
                    }}
                    onError={() => {
                        toast.error('Unable to assign this session.');
                    }}
                />

                <EditDialogSchedule
                    key={editingSession?.id ?? 'closed'}
                    open={editingSession !== null}
                    schedule={editingSession}
                    onOpenChange={(open) => {
                        if (!open) {
                            setEditingSession(null);
                        }
                    }}
                    onSuccess={() => {
                        setEditingSession(null);
                        toast.success('Schedule updated.');
                    }}
                    onError={() => {
                        toast.error('Unable to update this schedule.');
                    }}
                />

                <AdminTableSection
                    emptyMessage="No sessions booked yet."
                    emptySearchMessage="No sessions match your search."
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
                        placeholder: 'Search sessions...',
                    }}
                    toolbarEnd={
                        <AdminStatusFilter
                            value={statusFilter}
                            options={statusFilters}
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
                                <TableHead>Time</TableHead>
                                <TableHead>Student</TableHead>
                                <TableHead>Subject</TableHead>
                                <TableHead>Delivery</TableHead>
                                <TableHead>Mentor</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="w-12 text-right" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {visibleSessions.map((session) => {
                                const isCompleted =
                                    session.status.toLowerCase() ===
                                    'completed';
                                const canJoinMeeting =
                                    !isCompleted &&
                                    Boolean(session.zoomLink) &&
                                    currentTime >=
                                        new Date(session.startAt).getTime() &&
                                    currentTime <=
                                        new Date(session.endAt).getTime();
                                const hasActionsBeforeDetail =
                                    !isCompleted || canJoinMeeting;

                                return (
                                    <TableRow key={session.id}>
                                        <TableCell className="whitespace-nowrap">
                                            {formatScheduleDate(
                                                session.startAt,
                                            )}
                                        </TableCell>
                                        <TableCell className="whitespace-nowrap">
                                            {formatScheduleTimeRange(
                                                session.startAt,
                                                session.endAt,
                                            )}
                                        </TableCell>
                                        <TableCell>{session.student}</TableCell>
                                        <TableCell>
                                            <p className="font-medium">
                                                {session.title}
                                            </p>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">
                                                {formatBadgeLabel(
                                                    session.deliveryMode,
                                                )}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {session.mentor ===
                                            'Unassigned mentor'
                                                ? '-'
                                                : session.mentor}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                {...getBadgeProps(
                                                    getStatusBadgeTone(
                                                        session.status,
                                                    ),
                                                )}
                                            >
                                                {formatBadgeLabel(
                                                    session.status,
                                                )}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <ActionMenu label="Open session actions">
                                                {!isCompleted && (
                                                    <>
                                                        <DropdownMenuItem
                                                            onClick={() =>
                                                                setEditingSession(
                                                                    session,
                                                                )
                                                            }
                                                        >
                                                            <Pencil className="size-4" />
                                                            Edit schedule
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() =>
                                                                openAssignmentDialog(
                                                                    session,
                                                                )
                                                            }
                                                        >
                                                            <UserRoundCheck className="size-4" />
                                                            {session.mentor !==
                                                            'Unassigned mentor'
                                                                ? 'Reassign mentor'
                                                                : 'Assign mentor'}
                                                        </DropdownMenuItem>
                                                    </>
                                                )}
                                                {canJoinMeeting &&
                                                    session.zoomLink && (
                                                        <DropdownMenuItem
                                                            asChild
                                                        >
                                                            <a
                                                                href={
                                                                    session.zoomLink
                                                                }
                                                                target="_blank"
                                                                rel="noreferrer"
                                                            >
                                                                <Video className="size-4" />
                                                                Join meeting
                                                            </a>
                                                        </DropdownMenuItem>
                                                    )}
                                                {hasActionsBeforeDetail && (
                                                    <DropdownMenuSeparator />
                                                )}
                                                <DropdownMenuItem asChild>
                                                    <Link
                                                        href={`/scheduling/schedules/${session.id}`}
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

Schedules.layout = {
    breadcrumbs: [
        {
            title: 'Scheduling',
            href: '/scheduling/schedules',
        },
        {
            title: 'Schedules',
            href: '/scheduling/schedules',
        },
    ],
};
