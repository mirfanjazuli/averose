import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, ArrowUpRight, ClipboardCheck, Trophy } from 'lucide-react';
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
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

type Attempt = {
    correctCount: number;
    id: string;
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
    const bestScore =
        attempts.length > 0
            ? Math.max(...attempts.map((attempt) => attempt.score))
            : null;

    return (
        <>
            <Head title="Try Out Results" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <Button
                            asChild
                            variant="ghost"
                            size="sm"
                            className="-ml-3 mb-2 gap-2"
                        >
                            <Link href="/try-outs">
                                <ArrowLeft className="size-4" />
                                Back
                            </Link>
                        </Button>
                        <h1 className="font-heading text-2xl font-semibold">
                            Try Out Results
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Review your submitted try out attempts.
                        </p>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                        <CardContent className="flex items-center gap-4 px-6 py-5">
                            <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <ClipboardCheck className="size-5" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Completed
                                </p>
                                <p className="mt-1 text-2xl font-semibold">
                                    {attempts.length}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="flex items-center gap-4 px-6 py-5">
                            <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <Trophy className="size-5" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Best score
                                </p>
                                <p className="mt-1 text-2xl font-semibold">
                                    {bestScore ?? '-'}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Attempts</CardTitle>
                        <CardDescription>
                            Open a result to inspect answers and keys.
                        </CardDescription>
                    </CardHeader>
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
                                                    {attempt.score}
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
            </div>
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
