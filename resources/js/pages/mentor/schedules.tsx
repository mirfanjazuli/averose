import { Head } from '@inertiajs/react';
import {
    CalendarCheck2,
    MoreVertical,
    Search,
    Video,
} from 'lucide-react';
import { useMemo, useState } from 'react';
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
    Pagination,
    PaginationButton,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

type MentorSession = {
    endAt: string;
    id: string;
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

export default function MentorSchedules({
    sessions,
}: {
    sessions: MentorSession[];
}) {
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [sessionsPerPage, setSessionsPerPage] = useState(5);

    const filteredSessions = useMemo(() => {
        const normalizedSearch = searchQuery.trim().toLowerCase();

        if (!normalizedSearch) {
            return sessions;
        }

        return sessions.filter((session) =>
            [
                session.title,
                session.student,
                session.program,
                session.status,
                session.time,
                session.zoomAccount ?? '',
            ].some((value) => value.toLowerCase().includes(normalizedSearch)),
        );
    }, [searchQuery, sessions]);
    const totalPages = Math.max(
        1,
        Math.ceil(filteredSessions.length / sessionsPerPage),
    );
    const safeCurrentPage = Math.min(currentPage, totalPages);
    const firstSessionIndex = (safeCurrentPage - 1) * sessionsPerPage;
    const visibleSessions = filteredSessions.slice(
        firstSessionIndex,
        firstSessionIndex + sessionsPerPage,
    );
    const todayCount = sessions.filter((session) => {
        const scheduledDate = new Date(session.startAt);
        const today = new Date();

        return scheduledDate.toDateString() === today.toDateString();
    }).length;
    const assignedCount = sessions.filter(
        (session) => session.status === 'Assigned',
    ).length;

    const goToPage = (page: number) => {
        setCurrentPage(Math.min(Math.max(page, 1), totalPages));
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
                            View assigned mentoring sessions and Zoom room
                            access.
                        </p>
                    </div>
                    <Button variant="outline" className="gap-2">
                        <CalendarCheck2 className="size-4" />
                        Manage availability
                    </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardContent className="px-6 py-5">
                            <p className="text-sm text-muted-foreground">
                                Total sessions
                            </p>
                            <p className="mt-1 text-2xl font-semibold">
                                {sessions.length}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="px-6 py-5">
                            <p className="text-sm text-muted-foreground">
                                Today
                            </p>
                            <p className="mt-1 text-2xl font-semibold">
                                {todayCount}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="px-6 py-5">
                            <p className="text-sm text-muted-foreground">
                                Assigned
                            </p>
                            <p className="mt-1 text-2xl font-semibold">
                                {assignedCount}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader className="gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <CardTitle>Session list</CardTitle>
                            <CardDescription>
                                Sessions assigned to your mentor account.
                            </CardDescription>
                        </div>
                        <div className="flex h-10 min-w-64 items-center gap-2 rounded-2xl border bg-background px-3 text-sm text-muted-foreground">
                            <Search className="size-4" />
                            <Input
                                value={searchQuery}
                                onChange={(event) => {
                                    setSearchQuery(event.target.value);
                                    setCurrentPage(1);
                                }}
                                placeholder="Search sessions..."
                                className="h-auto border-0 bg-transparent px-0 py-0 shadow-none focus-visible:ring-0"
                            />
                        </div>
                    </CardHeader>
                    <CardContent>
                        {sessions.length === 0 ? (
                            <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                                No sessions assigned yet.
                            </div>
                        ) : filteredSessions.length === 0 ? (
                            <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                                No sessions match your search.
                            </div>
                        ) : (
                            <>
                                <div className="rounded-2xl border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Session</TableHead>
                                                <TableHead>Student</TableHead>
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
                                                        {session.time}
                                                    </TableCell>
                                                    <TableCell>
                                                        {session.zoomAccount ? (
                                                            <div className="flex items-center gap-2">
                                                                <Video className="size-4 text-primary" />
                                                                <span className="text-sm">
                                                                    {
                                                                        session.zoomAccount
                                                                    }
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-muted-foreground">
                                                                Not assigned
                                                            </span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline">
                                                            {session.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger
                                                                asChild
                                                            >
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon-sm"
                                                                    className="rounded-full"
                                                                >
                                                                    <MoreVertical className="size-4" />
                                                                    <span className="sr-only">
                                                                        Open
                                                                        session
                                                                        actions
                                                                    </span>
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent
                                                                align="end"
                                                                className="w-40"
                                                            >
                                                                <DropdownMenuItem
                                                                    disabled={
                                                                        !session.zoomLink
                                                                    }
                                                                    asChild={
                                                                        !!session.zoomLink
                                                                    }
                                                                >
                                                                    {session.zoomLink ? (
                                                                        <a
                                                                            href={
                                                                                session.zoomLink
                                                                            }
                                                                            target="_blank"
                                                                            rel="noreferrer"
                                                                        >
                                                                            <Video className="size-4" />
                                                                            Join
                                                                            room
                                                                        </a>
                                                                    ) : (
                                                                        <span>
                                                                            Join
                                                                            room
                                                                        </span>
                                                                    )}
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                                <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
                                    <p className="text-sm text-muted-foreground">
                                        Showing {firstSessionIndex + 1}-
                                        {Math.min(
                                            firstSessionIndex +
                                                sessionsPerPage,
                                            filteredSessions.length,
                                        )}{' '}
                                        of {filteredSessions.length} sessions
                                    </p>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground lg:justify-center">
                                        <span>Rows per page</span>
                                        <Select
                                            value={String(sessionsPerPage)}
                                            onValueChange={(value) => {
                                                setSessionsPerPage(
                                                    Number(value),
                                                );
                                                setCurrentPage(1);
                                            }}
                                        >
                                            <SelectTrigger className="h-9 w-20 rounded-xl">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="5">
                                                    5
                                                </SelectItem>
                                                <SelectItem value="10">
                                                    10
                                                </SelectItem>
                                                <SelectItem value="20">
                                                    20
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <Pagination className="mx-0 w-auto justify-start lg:justify-end">
                                        <PaginationContent>
                                            <PaginationItem>
                                                <PaginationPrevious
                                                    href="#"
                                                    className={
                                                        safeCurrentPage === 1
                                                            ? 'pointer-events-none opacity-50'
                                                            : undefined
                                                    }
                                                    onClick={(event) => {
                                                        event.preventDefault();
                                                        goToPage(
                                                            safeCurrentPage - 1,
                                                        );
                                                    }}
                                                />
                                            </PaginationItem>
                                            {Array.from(
                                                { length: totalPages },
                                                (_, index) => index + 1,
                                            ).map((page) => (
                                                <PaginationItem key={page}>
                                                    <PaginationButton
                                                        type="button"
                                                        isActive={
                                                            safeCurrentPage ===
                                                            page
                                                        }
                                                        onClick={() =>
                                                            goToPage(page)
                                                        }
                                                    >
                                                        {page}
                                                    </PaginationButton>
                                                </PaginationItem>
                                            ))}
                                            {totalPages > 5 && (
                                                <PaginationItem>
                                                    <PaginationEllipsis />
                                                </PaginationItem>
                                            )}
                                            <PaginationItem>
                                                <PaginationNext
                                                    href="#"
                                                    className={
                                                        safeCurrentPage ===
                                                        totalPages
                                                            ? 'pointer-events-none opacity-50'
                                                            : undefined
                                                    }
                                                    onClick={(event) => {
                                                        event.preventDefault();
                                                        goToPage(
                                                            safeCurrentPage + 1,
                                                        );
                                                    }}
                                                />
                                            </PaginationItem>
                                        </PaginationContent>
                                    </Pagination>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

MentorSchedules.layout = {
    breadcrumbs: [
        {
            title: 'Schedules',
            href: '/scheduling/schedules',
        },
    ],
};
