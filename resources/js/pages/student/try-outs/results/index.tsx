import { Head, Link } from '@inertiajs/react';
import { ArrowUpRight, History } from 'lucide-react';
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
import { useUserTimezone } from '@/hooks/use-user-timezone';
import { formatDateTime } from '@/lib/date-time';
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
    const timezone = useUserTimezone();
    const bestScore =
        attempts.length > 0
            ? Math.max(...attempts.map((attempt) => attempt.percentageScore))
            : null;
    const averageScore =
        attempts.length > 0
            ? Math.round(
                  attempts.reduce(
                      (total, attempt) => total + attempt.percentageScore,
                      0,
                  ) / attempts.length,
              )
            : null;
    const latestAttempt = attempts[0] ?? null;

    return (
        <>
            <Head title="Try Out Results" />
            <StudentTryOutLayout
                header={
                    <div>
                        <h1 className="font-heading text-2xl leading-tight font-semibold tracking-tight text-[#102a3a] md:text-4xl">
                            Riwayat try out
                        </h1>
                        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#526b7b]">
                            Lihat hasil, skor, dan detail pengerjaan try out
                            yang sudah kamu selesaikan.
                        </p>
                    </div>
                }
                sidebar={
                    <div className="space-y-4">
                        <div>
                            <p className="text-xs font-semibold tracking-wide text-[#526b7b] uppercase">
                                Total attempt
                            </p>
                            <p className="mt-1 font-heading text-3xl font-semibold tracking-tight text-[#102a3a]">
                                {attempts.length}
                            </p>
                        </div>

                        <div className="space-y-2 border-t border-[#edf3f1] pt-3">
                            <div className="flex items-center justify-between gap-3 text-sm">
                                <span className="text-[#526b7b]">
                                    Terbaik
                                </span>
                                <span className="font-semibold text-[#102a3a]">
                                    {bestScore ?? '-'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between gap-3 text-sm">
                                <span className="text-[#526b7b]">
                                    Rata-rata
                                </span>
                                <span className="font-semibold text-[#102a3a]">
                                    {averageScore ?? '-'}
                                </span>
                            </div>
                        </div>

                        {latestAttempt ? (
                            <div className="border-t border-[#edf3f1] pt-3">
                                <p className="text-xs font-semibold tracking-wide text-[#526b7b] uppercase">
                                    Terakhir
                                </p>
                                <p className="mt-2 line-clamp-2 text-sm font-semibold text-[#102a3a]">
                                    {latestAttempt.tryOut.title}
                                </p>
                                <p className="mt-1 text-xs text-[#526b7b]">
                                    {latestAttempt.submittedAt
                                        ? formatDateTime(
                                              latestAttempt.submittedAt,
                                              timezone,
                                          )
                                        : '-'}
                                </p>
                            </div>
                        ) : null}
                    </div>
                }
            >
                {attempts.length > 0 ? (
                    <div className="overflow-hidden rounded-md bg-white shadow-sm shadow-[#102a3a]/[0.03] ring-1 ring-[#dcece7]">
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead>Try out</TableHead>
                                        <TableHead>Submitted</TableHead>
                                        <TableHead>Score</TableHead>
                                        <TableHead>Correct</TableHead>
                                        <TableHead className="w-10" />
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {attempts.map((attempt) => (
                                        <TableRow
                                            key={attempt.id}
                                            className="hover:bg-[#f8fbfa]"
                                        >
                                            <TableCell className="font-semibold text-[#102a3a]">
                                                {attempt.tryOut.title}
                                            </TableCell>
                                            <TableCell className="text-[#526b7b]">
                                                {attempt.submittedAt
                                                    ? formatDateTime(
                                                          attempt.submittedAt,
                                                          timezone,
                                                      )
                                                    : '-'}
                                            </TableCell>
                                            <TableCell>
                                                <Badge className="bg-[#edf7f4] text-[#0f8f7a]">
                                                    {attempt.score}/
                                                    {attempt.maxScore}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="font-medium text-[#102a3a]">
                                                {attempt.correctCount}/
                                                {attempt.questionCount}
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    asChild
                                                    size="icon"
                                                    variant="ghost"
                                                    className="rounded-full text-[#0f8f7a] hover:bg-[#edf7f4] hover:text-[#0b7668]"
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
                    </div>
                ) : (
                    <div className="rounded-md bg-[#f8fbfa] px-6 py-12 text-center">
                        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-white text-[#0f8f7a] ring-1 ring-[#dcece7]">
                            <History className="size-6" />
                        </div>
                        <h2 className="mt-5 font-heading text-xl font-semibold text-[#102a3a]">
                            Belum ada hasil try out
                        </h2>
                        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#526b7b]">
                            Hasil akan muncul setelah kamu menyelesaikan try
                            out.
                        </p>
                    </div>
                )}
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
