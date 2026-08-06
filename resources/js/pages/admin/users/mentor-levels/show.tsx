import { Head, Link } from '@inertiajs/react';
import { Eye } from 'lucide-react';
import { EmptyState } from '@/components/admin/empty-state';
import { StatusBadge } from '@/components/admin/status-badge';
import { TableScrollArea } from '@/components/admin/table-scroll-area';
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
import { formatDate } from '@/lib/date-time';

type MentorLevel = {
    hourlyRate: string;
    id: number;
    mentorsCount: number;
    name: string;
    slug: string;
    status: string;
};

type Mentor = {
    createdAt: string | null;
    email: string;
    id: number;
    name: string;
    nickname: string | null;
    slug: string;
    status: string;
};

function formatCurrency(value: string) {
    return new Intl.NumberFormat('id-ID', {
        currency: 'IDR',
        maximumFractionDigits: 0,
        style: 'currency',
    }).format(Number(value));
}

export default function MentorLevelDetail({
    level,
    mentors,
}: {
    level: MentorLevel;
    mentors: Mentor[];
}) {
    const timezone = useUserTimezone();

    return (
        <>
            <Head title={level.name} />
            <div className="flex min-h-full max-w-full min-w-0 flex-1 flex-col gap-6 p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <div className="flex flex-wrap items-center gap-3">
                            <h1 className="font-heading text-2xl font-semibold">
                                {level.name}
                            </h1>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Mentor level detail and assigned mentor list.
                        </p>
                    </div>
                </div>

                <section className="space-y-1.5">
                    <div className="grid min-h-10 gap-2 md:grid-cols-[14rem_1fr] md:items-center">
                        <p className="text-sm text-muted-foreground">
                            Hourly rate
                        </p>
                        <p className="text-sm">
                            {formatCurrency(level.hourlyRate)}
                        </p>
                    </div>
                    <div className="grid min-h-10 gap-2 md:grid-cols-[14rem_1fr] md:items-center">
                        <p className="text-sm text-muted-foreground">Status</p>
                        <div>
                            <StatusBadge status={level.status} />
                        </div>
                    </div>
                </section>

                <section className="space-y-4">
                    <h2 className="font-heading text-lg font-semibold">
                        Mentors
                    </h2>
                    {mentors.length === 0 ? (
                        <EmptyState>
                            No mentors assigned to this level yet.
                        </EmptyState>
                    ) : (
                        <TableScrollArea>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Nickname</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Joined</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="w-12 text-right" />
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {mentors.map((mentor) => (
                                        <TableRow key={mentor.id}>
                                            <TableCell className="font-medium">
                                                {mentor.name}
                                            </TableCell>
                                            <TableCell>
                                                {mentor.nickname ?? '-'}
                                            </TableCell>
                                            <TableCell>
                                                {mentor.email}
                                            </TableCell>
                                            <TableCell>
                                                {mentor.createdAt
                                                    ? formatDate(
                                                          mentor.createdAt,
                                                          timezone,
                                                      )
                                                    : '-'}
                                            </TableCell>
                                            <TableCell>
                                                <StatusBadge
                                                    status={mentor.status}
                                                />
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    asChild
                                                    variant="ghost"
                                                    size="icon-sm"
                                                    className="rounded-full"
                                                >
                                                    <Link
                                                        href={`/users/mentors/${mentor.slug}`}
                                                    >
                                                        <Eye className="size-4" />
                                                        <span className="sr-only">
                                                            View mentor
                                                        </span>
                                                    </Link>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableScrollArea>
                    )}
                </section>
            </div>
        </>
    );
}
