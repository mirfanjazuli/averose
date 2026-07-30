import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, ClipboardList, Medal, Trophy, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import { SummaryCard } from '@/components/admin/summary-card';
import { AdminTableSection } from '@/components/admin/table-section';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { getBadgeProps } from '@/lib/badge';

type LeaderboardRow = {
    correctCount: number;
    id: string;
    maxScore: number;
    percentageScore: number;
    questionCount: number;
    rank: number;
    score: number;
    student: {
        email: string;
        name: string;
    };
    submittedAt: string | null;
};

type TryOut = {
    averageScore: number | null;
    highestScore: number | null;
    id: string;
    leaderboard: LeaderboardRow[];
    participantsCount: number;
    slug: string;
    title: string;
    totalAttempts: number;
};

const rankClassName = (rank: number) => {
    if (rank === 1) {
        return 'border-amber-200 bg-amber-50 text-amber-700';
    }

    if (rank === 2) {
        return 'border-slate-200 bg-slate-50 text-slate-700';
    }

    if (rank === 3) {
        return 'border-orange-200 bg-orange-50 text-orange-700';
    }

    return undefined;
};

export default function AdminTryOutLeaderboard({ tryOut }: { tryOut: TryOut }) {
    const [searchQuery, setSearchQuery] = useState('');
    const filteredRows = useMemo(() => {
        const normalizedSearch = searchQuery.trim().toLowerCase();

        if (!normalizedSearch) {
            return tryOut.leaderboard;
        }

        return tryOut.leaderboard.filter((row) =>
            [row.student.name, row.student.email].some((value) =>
                value.toLowerCase().includes(normalizedSearch),
            ),
        );
    }, [searchQuery, tryOut.leaderboard]);

    return (
        <>
            <Head title={`${tryOut.title} Leaderboard`} />
            <div className="flex h-full min-w-0 max-w-full flex-1 flex-col gap-6 overflow-hidden p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="font-heading text-2xl font-semibold">
                            Leaderboard
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {tryOut.title}
                        </p>
                    </div>
                    <Button asChild variant="outline" className="gap-2">
                        <Link href={`/academics/try-outs/${tryOut.slug}`}>
                            <ArrowLeft className="size-4" />
                            Back to detail
                        </Link>
                    </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-4">
                    <SummaryCard
                        icon={Trophy}
                        label="Highest score"
                        value={tryOut.highestScore ?? '-'}
                    />
                    <SummaryCard
                        icon={Medal}
                        label="Average score"
                        value={tryOut.averageScore ?? '-'}
                    />
                    <SummaryCard
                        icon={Users}
                        label="Participants"
                        value={tryOut.participantsCount}
                    />
                    <SummaryCard
                        icon={ClipboardList}
                        label="Total attempts"
                        value={tryOut.totalAttempts}
                    />
                </div>

                <AdminTableSection
                    emptyMessage="No attempts yet."
                    emptySearchMessage="No students match your search."
                    filteredItems={filteredRows.length}
                    search={{
                        value: searchQuery,
                        onChange: setSearchQuery,
                        placeholder: 'Search student...',
                    }}
                    totalItems={tryOut.leaderboard.length}
                >
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Rank</TableHead>
                                <TableHead>Student</TableHead>
                                <TableHead>Score</TableHead>
                                <TableHead>Normalized</TableHead>
                                <TableHead>Correct</TableHead>
                                <TableHead>Submitted</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredRows.map((row) => (
                                <TableRow key={row.id}>
                                    <TableCell>
                                        <Badge
                                            {...getBadgeProps(
                                                'outline',
                                                rankClassName(row.rank),
                                            )}
                                        >
                                            {row.rank <= 3 && (
                                                <Medal className="size-3.5" />
                                            )}
                                            #{row.rank}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-medium">
                                            {row.student.name}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {row.student.email}
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-semibold">
                                        {row.score}/{row.maxScore}
                                    </TableCell>
                                    <TableCell>
                                        {row.percentageScore}
                                    </TableCell>
                                    <TableCell>
                                        {row.correctCount}/{row.questionCount}
                                    </TableCell>
                                    <TableCell>
                                        {row.submittedAt ?? '-'}
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

AdminTryOutLeaderboard.layout = {
    breadcrumbs: [
        {
            title: 'Academics',
            href: '/academics/fields',
        },
        {
            title: 'Try Out',
            href: '/academics/try-outs',
        },
    ],
};
