import { Head, Link } from '@inertiajs/react';
import {
    CalendarDays,
    Clock3,
    Eye,
    NotebookPen,
    UserRoundCheck,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import type { DateRange } from 'react-day-picker';
import {
    DateRangeFilter,
    formatDateForRangeQuery,
    getThisMonthDateRange,
} from '@/components/date-range-filter';
import { ActionMenu } from '@/components/admin/action-menu';
import { formatBadgeLabel, getBadgeProps } from '@/lib/badge';
import { EmptyState } from '@/components/admin/empty-state';
import { SummaryCard } from '@/components/admin/summary-card';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import type { JournalNote } from './data';
import type { MentorJournal } from './data';

const noteTones: Record<
    JournalNote,
    'default' | 'muted' | 'outline' | 'success'
> = {
    completed: 'success',
    'mentor late': 'outline',
    'mentor waiting': 'muted',
    postponed: 'muted',
    'student late': 'outline',
};

export default function MentorJournals({
    journals,
}: {
    journals: MentorJournal[];
}) {
    const [dateRange, setDateRange] = useState<DateRange | undefined>(
        getThisMonthDateRange,
    );
    const filteredJournals = useMemo(() => {
        const dateFrom = dateRange?.from
            ? formatDateForRangeQuery(dateRange.from)
            : null;
        const dateTo = dateRange?.to
            ? formatDateForRangeQuery(dateRange.to)
            : null;

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
                    <DateRangeFilter
                        value={dateRange}
                        onChange={setDateRange}
                    />
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <SummaryCard
                        icon={NotebookPen}
                        label="Total journals"
                        value={filteredJournals.length}
                    />
                    <SummaryCard
                        icon={CalendarDays}
                        label="Completed"
                        value={completedJournals}
                    />
                    <SummaryCard
                        icon={UserRoundCheck}
                        label="Late or waiting"
                        value={lateOrWaitingJournals}
                    />
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Journal list</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {filteredJournals.length === 0 ? (
                            <EmptyState>
                                No mentor journals found for this date range.
                            </EmptyState>
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
                                                        {...getBadgeProps(
                                                            noteTones[
                                                                journal.note
                                                            ],
                                                        )}
                                                    >
                                                        {formatBadgeLabel(
                                                            journal.note,
                                                        )}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <ActionMenu label="Open journal actions">
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
                                                    </ActionMenu>
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
