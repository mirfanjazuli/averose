import { Form, Head, Link } from '@inertiajs/react';
import {
    CalendarDays,
    Check,
    ChevronsUpDown,
    Clock3,
    ExternalLink,
    UserRoundCheck,
    Video,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { ActionMenu } from '@/components/admin/action-menu';
import {
    formatBadgeLabel,
    getBadgeProps,
    getStatusBadgeTone,
} from '@/lib/badge';
import { EmptyState } from '@/components/admin/empty-state';
import { SummaryCard } from '@/components/admin/summary-card';
import { TablePagination } from '@/components/admin/table-pagination';
import { TableSearch } from '@/components/admin/table-search';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenuItem,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useClientPagination } from '@/hooks/use-client-pagination';

type MentorOption = {
    id: string;
    name: string;
};

type AdminSession = {
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

function MentorSearchSelect({
    mentors,
    onValueChange,
    value,
}: {
    mentors: MentorOption[];
    onValueChange: (value: string) => void;
    value: string;
}) {
    const [open, setOpen] = useState(false);
    const selectedMentor = mentors.find((mentor) => mentor.id === value);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="h-12 w-full justify-between rounded-2xl px-4 font-normal"
                >
                    <span
                        className={
                            selectedMentor
                                ? 'truncate'
                                : 'truncate text-muted-foreground'
                        }
                    >
                        {selectedMentor?.name ?? 'Select mentor'}
                    </span>
                    <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
                </Button>
            </PopoverTrigger>
            <PopoverContent
                align="start"
                className="w-(--radix-popover-trigger-width) p-0"
            >
                <Command>
                    <CommandInput placeholder="Search mentor..." />
                    <CommandList>
                        <CommandEmpty>No mentor found.</CommandEmpty>
                        <CommandGroup>
                            {mentors.map((mentor) => (
                                <CommandItem
                                    key={mentor.id}
                                    value={`${mentor.name} ${mentor.id}`}
                                    onSelect={() => {
                                        onValueChange(mentor.id);
                                        setOpen(false);
                                    }}
                                >
                                    <span className="truncate">
                                        {mentor.name}
                                    </span>
                                    <Check
                                        className={
                                            value === mentor.id
                                                ? 'ml-auto size-4 opacity-100'
                                                : 'ml-auto size-4 opacity-0'
                                        }
                                    />
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

export default function Schedules({
    mentors,
    sessions,
}: {
    mentors: MentorOption[];
    sessions: AdminSession[];
}) {
    const [assigningSession, setAssigningSession] =
        useState<AdminSession | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [mentorId, setMentorId] = useState('');

    const filteredSessions = useMemo(() => {
        const normalizedSearch = searchQuery.trim().toLowerCase();

        if (!normalizedSearch) {
            return sessions;
        }

        return sessions.filter((session) =>
            [
                session.title,
                session.student,
                session.mentor,
                session.program,
                session.status,
                session.time,
                session.zoomAccount ?? '',
            ].some((value) => value.toLowerCase().includes(normalizedSearch)),
        );
    }, [searchQuery, sessions]);
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
        setMentorId('');
    };

    return (
        <>
            <Head title="Schedules" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4">
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

                <Dialog
                    open={!!assigningSession}
                    onOpenChange={(open) => {
                        if (!open) {
                            setAssigningSession(null);
                            setMentorId('');
                        }
                    }}
                >
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Assign mentor</DialogTitle>
                            <DialogDescription>
                                Zoom account and meeting link will be allocated
                                automatically based on availability.
                            </DialogDescription>
                        </DialogHeader>
                        {assigningSession && (
                            <Form
                                action={`/scheduling/schedules/${assigningSession.id}/assignment`}
                                method="put"
                                disableWhileProcessing
                                onSuccess={() => {
                                    setAssigningSession(null);
                                    setMentorId('');
                                    toast.success('Session assigned.');
                                }}
                                onError={() => {
                                    toast.error(
                                        'Unable to assign this session.',
                                    );
                                }}
                                className="space-y-5"
                            >
                                {({ errors, processing }) => (
                                    <>
                                        <input
                                            type="hidden"
                                            name="mentor_id"
                                            value={mentorId}
                                        />
                                        <div className="rounded-2xl border p-4 text-sm">
                                            <p className="font-medium">
                                                {assigningSession.title}
                                            </p>
                                            <p className="mt-1 text-muted-foreground">
                                                {assigningSession.student} ·{' '}
                                                {assigningSession.time}
                                            </p>
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-sm font-medium">
                                                Mentor
                                            </p>
                                            <MentorSearchSelect
                                                mentors={mentors}
                                                value={mentorId}
                                                onValueChange={setMentorId}
                                            />
                                            {errors.mentor_id && (
                                                <p className="text-xs text-destructive">
                                                    {errors.mentor_id}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex justify-end gap-2 pt-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => {
                                                    setAssigningSession(null);
                                                    setMentorId('');
                                                }}
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                disabled={
                                                    !mentorId || processing
                                                }
                                            >
                                                {processing
                                                    ? 'Assigning...'
                                                    : 'Assign mentor'}
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </Form>
                        )}
                    </DialogContent>
                </Dialog>

                <Card>
                    <CardHeader className="gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <CardTitle>Booked sessions</CardTitle>
                            <CardDescription>
                                Sessions submitted by students.
                            </CardDescription>
                        </div>
                        <TableSearch
                            value={searchQuery}
                            onChange={(value) => {
                                setSearchQuery(value);
                                resetPage();
                            }}
                            placeholder="Search sessions..."
                        />
                    </CardHeader>
                    <CardContent>
                        {sessions.length === 0 ? (
                            <EmptyState>No sessions booked yet.</EmptyState>
                        ) : filteredSessions.length === 0 ? (
                            <EmptyState>
                                No sessions match your search.
                            </EmptyState>
                        ) : (
                            <>
                                <div className="rounded-2xl border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Session</TableHead>
                                                <TableHead>Student</TableHead>
                                                <TableHead>Mentor</TableHead>
                                                <TableHead>Time</TableHead>
                                                <TableHead>Zoom</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="w-12 text-right" />
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {visibleSessions.map((session) => (
                                                <TableRow key={session.id}>
                                                    <TableCell>
                                                        <p className="font-medium">
                                                            {session.title}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {session.program}
                                                        </p>
                                                    </TableCell>
                                                    <TableCell>
                                                        {session.student}
                                                    </TableCell>
                                                    <TableCell>
                                                        {session.mentor}
                                                    </TableCell>
                                                    <TableCell>
                                                        {session.time}
                                                    </TableCell>
                                                    <TableCell>
                                                        {session.zoomLink ? (
                                                            <div className="flex items-center gap-2">
                                                                {session.zoomAccountSlug ? (
                                                                    <Link
                                                                        href={`/zoom-accounts/${session.zoomAccountSlug}`}
                                                                        className="inline-flex items-center gap-2 font-medium text-primary hover:underline"
                                                                    >
                                                                        <Video className="size-4" />
                                                                        {
                                                                            session.zoomAccount
                                                                        }
                                                                        <ExternalLink className="size-3.5" />
                                                                    </Link>
                                                                ) : (
                                                                    <>
                                                                        <Video className="size-4 text-primary" />
                                                                        <span className="text-sm">
                                                                            {
                                                                                session.zoomAccount
                                                                            }
                                                                        </span>
                                                                    </>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <span className="text-muted-foreground">
                                                                Not assigned
                                                            </span>
                                                        )}
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
                                                            <DropdownMenuItem
                                                                onClick={() =>
                                                                    openAssignmentDialog(
                                                                        session,
                                                                    )
                                                                }
                                                            >
                                                                <UserRoundCheck className="size-4" />
                                                                {session.zoomLink
                                                                    ? 'Reassign mentor'
                                                                    : 'Assign mentor'}
                                                            </DropdownMenuItem>
                                                            {session.zoomLink && (
                                                                <>
                                                                    <DropdownMenuSeparator />
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
                                                                            <ExternalLink className="size-4" />
                                                                            Join
                                                                            meeting
                                                                        </a>
                                                                    </DropdownMenuItem>
                                                                </>
                                                            )}
                                                            {session.zoomStartUrl && (
                                                                <DropdownMenuItem
                                                                    asChild
                                                                >
                                                                    <a
                                                                        href={
                                                                            session.zoomStartUrl
                                                                        }
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                    >
                                                                        <Video className="size-4" />
                                                                        Start
                                                                        meeting
                                                                    </a>
                                                                </DropdownMenuItem>
                                                            )}
                                                        </ActionMenu>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                                <TablePagination
                                    entity="sessions"
                                    firstItemIndex={firstItemIndex}
                                    onPageChange={goToPage}
                                    onRowsPerPageChange={changeRowsPerPage}
                                    rowsPerPage={rowsPerPage}
                                    safeCurrentPage={safeCurrentPage}
                                    totalItems={filteredSessions.length}
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
