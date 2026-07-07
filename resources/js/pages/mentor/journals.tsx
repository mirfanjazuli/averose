import { Head, Link } from '@inertiajs/react';
import { CalendarDays, Clock3, NotebookPen, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

type JournalNote =
    | 'completed'
    | 'mentor late'
    | 'mentor waiting'
    | 'postponed'
    | 'student late';

type MentorJournal = {
    achievement: string;
    date: string;
    duration: string;
    id: string;
    improvementArea: string;
    nextImprovementPlan: string;
    note: JournalNote;
    program: string;
    sessionName: string;
    slug: string;
    student: string;
    subject: string;
};

const noteVariants: Record<
    JournalNote,
    'default' | 'destructive' | 'outline' | 'secondary'
> = {
    completed: 'default',
    'mentor late': 'outline',
    'mentor waiting': 'secondary',
    postponed: 'secondary',
    'student late': 'outline',
};

export default function MentorJournals({
    journals,
}: {
    journals: MentorJournal[];
}) {
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [journalsPerPage, setJournalsPerPage] = useState(5);
    const filteredJournals = useMemo(() => {
        const normalizedSearch = searchQuery.trim().toLowerCase();

        if (!normalizedSearch) {
            return journals;
        }

        return journals.filter((journal) =>
            [
                journal.date,
                journal.student,
                journal.sessionName,
                journal.subject,
                journal.program,
                journal.note,
                journal.achievement,
                journal.improvementArea,
                journal.nextImprovementPlan,
            ].some((value) => value.toLowerCase().includes(normalizedSearch)),
        );
    }, [journals, searchQuery]);
    const totalPages = Math.max(
        1,
        Math.ceil(filteredJournals.length / journalsPerPage),
    );
    const safeCurrentPage = Math.min(currentPage, totalPages);
    const firstJournalIndex = (safeCurrentPage - 1) * journalsPerPage;
    const visibleJournals = filteredJournals.slice(
        firstJournalIndex,
        firstJournalIndex + journalsPerPage,
    );
    const completedJournals = journals.filter(
        (journal) => journal.note === 'completed',
    ).length;
    const thisMonthJournals = journals.filter((journal) => {
        const journalDate = new Date(journal.date);
        const today = new Date();

        return (
            journalDate.getMonth() === today.getMonth() &&
            journalDate.getFullYear() === today.getFullYear()
        );
    }).length;

    const goToPage = (page: number) => {
        setCurrentPage(Math.min(Math.max(page, 1), totalPages));
    };

    return (
        <>
            <Head title="Journals" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4">
                <div>
                    <h1 className="font-heading text-2xl font-semibold">
                        Journals
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Review completed session notes and student follow-up
                        plans.
                    </p>
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
                                    {journals.length}
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
                                    This month
                                </p>
                                <p className="text-2xl font-semibold">
                                    {thisMonthJournals}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="flex items-center gap-4 px-6 py-5">
                            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                <Clock3 className="size-5" />
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
                </div>

                <Card>
                    <CardHeader className="gap-4 md:flex-row md:items-center md:justify-between">
                        <CardTitle>Journal list</CardTitle>
                        <div className="flex h-10 min-w-64 items-center gap-2 rounded-2xl border bg-background px-3 text-sm text-muted-foreground">
                            <Search className="size-4" />
                            <Input
                                value={searchQuery}
                                onChange={(event) => {
                                    setSearchQuery(event.target.value);
                                    setCurrentPage(1);
                                }}
                                placeholder="Search journals..."
                                className="h-auto border-0 bg-transparent px-0 py-0 shadow-none focus-visible:ring-0"
                            />
                        </div>
                    </CardHeader>
                    <CardContent>
                        {journals.length === 0 ? (
                            <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                                No journals completed yet.
                            </div>
                        ) : filteredJournals.length === 0 ? (
                            <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                                No journals match your search.
                            </div>
                        ) : (
                            <>
                                <div className="rounded-2xl border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Date</TableHead>
                                                <TableHead>Student</TableHead>
                                                <TableHead>Session</TableHead>
                                                <TableHead>Subject</TableHead>
                                                <TableHead>Duration</TableHead>
                                                <TableHead>Focus</TableHead>
                                                <TableHead>Note</TableHead>
                                                <TableHead className="w-20 text-right" />
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {visibleJournals.map((journal) => (
                                                <TableRow key={journal.id}>
                                                    <TableCell>
                                                        {journal.date}
                                                    </TableCell>
                                                    <TableCell className="font-medium">
                                                        {journal.student}
                                                    </TableCell>
                                                    <TableCell>
                                                        <p className="font-medium">
                                                            {
                                                                journal.sessionName
                                                            }
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {journal.program}
                                                        </p>
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
                                                    <TableCell className="max-w-64">
                                                        <p className="line-clamp-2 text-sm text-muted-foreground">
                                                            {
                                                                journal.nextImprovementPlan
                                                            }
                                                        </p>
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
                                                        <Button
                                                            asChild
                                                            variant="ghost"
                                                            size="sm"
                                                        >
                                                            <Link
                                                                href={`/journals/${journal.slug}`}
                                                            >
                                                                Review
                                                            </Link>
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>

                                <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
                                    <p className="text-sm text-muted-foreground">
                                        Showing {firstJournalIndex + 1}-
                                        {Math.min(
                                            firstJournalIndex + journalsPerPage,
                                            filteredJournals.length,
                                        )}{' '}
                                        of {filteredJournals.length} journals
                                    </p>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground lg:justify-center">
                                        <span>Rows per page</span>
                                        <Select
                                            value={String(journalsPerPage)}
                                            onValueChange={(value) => {
                                                setJournalsPerPage(
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

MentorJournals.layout = {
    breadcrumbs: [
        {
            title: 'Journals',
            href: '/journals',
        },
    ],
};
