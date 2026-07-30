import { Head, Link } from '@inertiajs/react';
import { Eye, NotebookPen, UserRoundCheck, UsersRound } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { ActionMenu } from '@/components/admin/action-menu';
import { SummaryCard } from '@/components/admin/summary-card';
import { AdminTableSection } from '@/components/admin/table-section';
import {
    DateRangeFilter,
    formatDateForRangeQuery,
    getThisMonthDateRange,
} from '@/components/date-range-filter';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useClientPagination } from '@/hooks/use-client-pagination';
import type { MentorJournal } from './data';

const dateFormatter = new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
});

const timeFormatter = new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
});

function formatDate(value: string) {
    return dateFormatter.format(new Date(value));
}

function formatDateTime(value: string) {
    return `${formatDate(value)}, ${timeFormatter.format(new Date(value))} WIB`;
}

export default function MentorJournals({
    journals,
}: {
    journals: MentorJournal[];
}) {
    const [searchQuery, setSearchQuery] = useState('');
    const [dateRange, setDateRange] = useState<DateRange | undefined>(
        getThisMonthDateRange,
    );
    const filteredJournals = useMemo(() => {
        const normalizedSearch = searchQuery.trim().toLowerCase();
        const dateFrom = dateRange?.from
            ? formatDateForRangeQuery(dateRange.from)
            : null;
        const dateTo = dateRange?.to
            ? formatDateForRangeQuery(dateRange.to)
            : null;

        return journals.filter((journal) => {
            const sessionDate = formatDateForRangeQuery(
                new Date(journal.sessionStartAt),
            );

            if (dateFrom && sessionDate < dateFrom) {
                return false;
            }

            if (dateTo && sessionDate > dateTo) {
                return false;
            }

            if (!normalizedSearch) {
                return true;
            }

            return [
                formatDate(journal.sessionStartAt),
                formatDateTime(journal.completedAt),
                journal.mentor,
                journal.student,
                journal.subject,
                journal.program,
            ].some((value) => value.toLowerCase().includes(normalizedSearch));
        });
    }, [dateRange, journals, searchQuery]);
    const uniqueMentors = new Set(
        filteredJournals.map((journal) => journal.mentorId),
    ).size;
    const uniqueStudents = new Set(
        filteredJournals.map((journal) => journal.studentId),
    ).size;
    const {
        changeRowsPerPage,
        firstItemIndex,
        goToPage,
        resetPage,
        rowsPerPage,
        safeCurrentPage,
        totalPages,
        visibleItems: visibleJournals,
    } = useClientPagination({ items: filteredJournals });

    return (
        <>
            <Head title="Mentor Journals" />
            <div className="flex min-h-full max-w-full min-w-0 flex-1 flex-col gap-6 p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="font-heading text-2xl font-semibold">
                            Mentor Journals
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Track completed teaching journals and student
                            progress.
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
                        icon={UserRoundCheck}
                        label="Mentors"
                        value={uniqueMentors}
                    />
                    <SummaryCard
                        icon={UsersRound}
                        label="Students"
                        value={uniqueStudents}
                    />
                </div>

                <AdminTableSection
                    emptyMessage="No mentor journals yet."
                    emptySearchMessage="No mentor journals match your filters."
                    filteredItems={filteredJournals.length}
                    pagination={{
                        entity: 'journals',
                        firstItemIndex,
                        onPageChange: goToPage,
                        onRowsPerPageChange: changeRowsPerPage,
                        rowsPerPage,
                        safeCurrentPage,
                        totalItems: filteredJournals.length,
                        totalPages,
                    }}
                    search={{
                        value: searchQuery,
                        onChange: (value) => {
                            setSearchQuery(value);
                            resetPage();
                        },
                        placeholder: 'Search journals...',
                    }}
                    tableMinWidth="64rem"
                    totalItems={journals.length}
                >
                    <Table className="w-full">
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Completed at</TableHead>
                                <TableHead>Mentor</TableHead>
                                <TableHead>Student</TableHead>
                                <TableHead>Subject</TableHead>
                                <TableHead>Program</TableHead>
                                <TableHead className="w-12 text-right" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {visibleJournals.map((journal) => (
                                <TableRow key={journal.id}>
                                    <TableCell className="whitespace-nowrap">
                                        {formatDate(journal.sessionStartAt)}
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap">
                                        {formatDateTime(journal.completedAt)}
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {journal.mentor}
                                    </TableCell>
                                    <TableCell>{journal.student}</TableCell>
                                    <TableCell>{journal.subject}</TableCell>
                                    <TableCell>{journal.program}</TableCell>
                                    <TableCell className="text-right">
                                        <ActionMenu label="Open journal actions">
                                            <DropdownMenuItem asChild>
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
                </AdminTableSection>
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
