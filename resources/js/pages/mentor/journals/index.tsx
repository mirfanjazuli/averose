import { Head, Link } from '@inertiajs/react';
import { Eye } from 'lucide-react';
import { useMemo, useState } from 'react';
import { ActionMenu } from '@/components/admin/action-menu';
import { AdminTableSection } from '@/components/admin/table-section';
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

type MentorJournal = {
    completedAt: string;
    id: string;
    nextImprovementPlan: string;
    program: string;
    sessionStartAt: string;
    slug: string;
    student: string;
    subject: string;
};

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
    const filteredJournals = useMemo(() => {
        const normalizedSearch = searchQuery.trim().toLowerCase();

        if (!normalizedSearch) {
            return journals;
        }

        return journals.filter((journal) =>
            [
                formatDate(journal.sessionStartAt),
                formatDateTime(journal.completedAt),
                journal.student,
                journal.subject,
                journal.program,
                journal.nextImprovementPlan,
            ].some((value) => value.toLowerCase().includes(normalizedSearch)),
        );
    }, [journals, searchQuery]);
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
            <Head title="Journals" />
            <div className="flex min-h-full max-w-full min-w-0 flex-1 flex-col gap-6 p-4">
                <h1 className="font-heading text-2xl font-semibold">
                    Journals
                </h1>

                <AdminTableSection
                    emptyMessage="No journals completed yet."
                    emptySearchMessage="No journals match your search."
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
                    tableMinWidth="68rem"
                    totalItems={journals.length}
                >
                    <Table className="w-full">
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Student</TableHead>
                                <TableHead>Program</TableHead>
                                <TableHead>Subject</TableHead>
                                <TableHead>Completed at</TableHead>
                                <TableHead className="w-12 text-right" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {visibleJournals.map((journal) => (
                                <TableRow key={journal.id}>
                                    <TableCell className="whitespace-nowrap">
                                        {formatDate(journal.sessionStartAt)}
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {journal.student}
                                    </TableCell>
                                    <TableCell>{journal.subject}</TableCell>
                                    <TableCell>{journal.program}</TableCell>
                                    <TableCell className="whitespace-nowrap">
                                        {formatDateTime(journal.completedAt)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <ActionMenu label="Open journal actions">
                                            <DropdownMenuItem asChild>
                                                <Link
                                                    href={`/journals/${journal.slug}`}
                                                >
                                                    <Eye className="size-4" />
                                                    View detail
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
            title: 'Journals',
            href: '/journals',
        },
    ],
};
