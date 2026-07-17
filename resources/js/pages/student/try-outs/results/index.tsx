import { Head, Link } from '@inertiajs/react';
import { ArrowUpRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { StudentTryOutLayout } from '@/pages/student/try-outs/components/student-try-out-layout';

type Attempt = {
    correctCount: number;
    id: string;
    maxScore: number;
    percentageScore: number;
    questionCount: number;
    score: number;
    submittedAt: string | null;
    tryOut: {
        slug: string;
        title: string;
    };
};

export default function StudentTryOutResults({
    attempts,
}: {
    attempts: Attempt[];
}) {
    return (
        <>
            <Head title="Try Out Results" />
            <StudentTryOutLayout
                header={
                    <div className="flex flex-wrap items-start gap-4">
                        <h1 className="font-heading text-2xl font-semibold">
                            Riwayat Hasil Try Out
                        </h1>
                    </div>
                }
            >
                <Card>
                    <CardContent>
                        {attempts.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Try out</TableHead>
                                        <TableHead>Submitted</TableHead>
                                        <TableHead>Score</TableHead>
                                        <TableHead>Correct</TableHead>
                                        <TableHead className="w-10" />
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {attempts.map((attempt) => (
                                        <TableRow key={attempt.id}>
                                            <TableCell className="font-medium">
                                                {attempt.tryOut.title}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {attempt.submittedAt ?? '-'}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary">
                                                    {attempt.score}/
                                                    {attempt.maxScore}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {attempt.correctCount}/
                                                {attempt.questionCount}
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    asChild
                                                    size="icon"
                                                    variant="ghost"
                                                >
                                                    <Link
                                                        href={`/try-outs/${attempt.tryOut.slug}/results/${attempt.id}`}
                                                    >
                                                        <ArrowUpRight className="size-4" />
                                                    </Link>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <div className="rounded-lg border p-8 text-center text-sm text-muted-foreground">
                                No try out results yet.
                            </div>
                        )}
                    </CardContent>
                </Card>
            </StudentTryOutLayout>
        </>
    );
}

StudentTryOutResults.layout = {
    breadcrumbs: [
        {
            title: 'Try Out',
            href: '/try-outs',
        },
        {
            title: 'Results',
            href: '/try-outs/results',
        },
    ],
};
