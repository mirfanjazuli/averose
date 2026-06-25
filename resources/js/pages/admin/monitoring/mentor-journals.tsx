import { Head, Link } from '@inertiajs/react';
import { format } from 'date-fns';
import {
    CalendarDays,
    CalendarIcon,
    Clock3,
    Eye,
    MoreVertical,
    NotebookPen,
    UserRoundCheck,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
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
import { cn } from '@/lib/utils';
import { noteVariants } from './mentor-journal-data';
import type { MentorJournal } from './mentor-journal-data';

const formatDateForInput = (date: Date) => date.toISOString().slice(0, 10);

const getThisMonthRange = (): DateRange => {
    const today = new Date();

    return {
        from: new Date(today.getFullYear(), today.getMonth(), 1),
        to: new Date(today.getFullYear(), today.getMonth() + 1, 0),
    };
};

const getDateRangeLabel = (dateRange: DateRange | undefined) => {
    if (dateRange?.from && dateRange.to) {
        return `${format(dateRange.from, 'MMM d, yyyy')} - ${format(
            dateRange.to,
            'MMM d, yyyy',
        )}`;
    }

    if (dateRange?.from) {
        return format(dateRange.from, 'MMM d, yyyy');
    }

    return 'Select date range';
};

export default function MentorJournals({
    journals,
}: {
    journals: MentorJournal[];
}) {
    const [dateRange, setDateRange] = useState<DateRange | undefined>(
        getThisMonthRange,
    );
    const filteredJournals = useMemo(() => {
        const dateFrom = dateRange?.from
            ? formatDateForInput(dateRange.from)
            : null;
        const dateTo = dateRange?.to ? formatDateForInput(dateRange.to) : null;

        return journals.filter((journal) => {
            if (dateFrom && journal.date < dateFrom) {
                return false;
            }

            if (dateTo && journal.date > dateTo) {
                return false;
            }

            return true;
        });
    }, [dateRange, journals]);
    const completedJournals = filteredJournals.filter(
        (journal) => journal.note === 'completed',
    ).length;
    const lateOrWaitingJournals = filteredJournals.filter((journal) =>
        ['student late', 'mentor late', 'mentor waiting'].includes(
            journal.note,
        ),
    ).length;

    return (
        <>
            <Head title="Mentor Journals" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="font-heading text-2xl font-semibold">
                            Mentor Journals
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Track mentor teaching notes, session summaries, and
                            review status.
                        </p>
                    </div>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                type="button"
                                variant="outline"
                                className={cn(
                                    'h-10 w-full justify-start gap-2 rounded-2xl px-3 text-left font-normal sm:w-72',
                                    !dateRange?.from &&
                                        'text-muted-foreground',
                                )}
                            >
                                <CalendarIcon className="size-4" />
                                {getDateRangeLabel(dateRange)}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent
                            align="end"
                            className="w-auto gap-0 p-0"
                        >
                            <Calendar
                                mode="range"
                                defaultMonth={dateRange?.from}
                                selected={dateRange}
                                onSelect={setDateRange}
                                numberOfMonths={2}
                            />
                        </PopoverContent>
                    </Popover>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardContent className="flex items-center gap-4 px-6 py-5">
                            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                <NotebookPen className="size-5" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Total journals
                                </p>
                                <p className="text-2xl font-semibold">
                                    {filteredJournals.length}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="flex items-center gap-4 px-6 py-5">
                            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                <CalendarDays className="size-5" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Completed
                                </p>
                                <p className="text-2xl font-semibold">
                                    {completedJournals}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="flex items-center gap-4 px-6 py-5">
                            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                <UserRoundCheck className="size-5" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Late or waiting
                                </p>
                                <p className="text-2xl font-semibold">
                                    {lateOrWaitingJournals}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Journal list</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {filteredJournals.length === 0 ? (
                            <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                                No mentor journals found for this date range.
                            </div>
                        ) : (
                            <div className="rounded-2xl border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Mentor</TableHead>
                                            <TableHead>Student</TableHead>
                                            <TableHead>Session name</TableHead>
                                            <TableHead>Subject</TableHead>
                                            <TableHead>Duration</TableHead>
                                            <TableHead>Note</TableHead>
                                            <TableHead className="w-12 text-right" />
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredJournals.map((journal) => (
                                            <TableRow key={journal.id}>
                                                <TableCell>
                                                    {journal.date}
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    {journal.mentor}
                                                </TableCell>
                                                <TableCell>
                                                    {journal.student}
                                                </TableCell>
                                                <TableCell>
                                                    {journal.sessionName}
                                                </TableCell>
                                                <TableCell>
                                                    {journal.subject}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <Clock3 className="size-4 text-muted-foreground" />
                                                        {journal.duration}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={
                                                            noteVariants[
                                                                journal.note
                                                            ]
                                                        }
                                                        className="capitalize"
                                                    >
                                                        {journal.note}
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
                                                                    journal
                                                                    actions
                                                                </span>
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent
                                                            align="end"
                                                            className="w-40"
                                                        >
                                                            <DropdownMenuItem
                                                                asChild
                                                            >
                                                                <Link
                                                                    href={`/monitoring/mentor-journals/${journal.slug}`}
                                                                >
                                                                    <Eye className="size-4" />
                                                                    View
                                                                </Link>
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

MentorJournals.layout = {
    breadcrumbs: [
        {
            title: 'Monitoring',
            href: '/monitoring/mentor-journals',
        },
        {
            title: 'Mentor Journals',
            href: '/monitoring/mentor-journals',
        },
    ],
};
