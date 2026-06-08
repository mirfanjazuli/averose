import { Head } from '@inertiajs/react';
import { BookOpenCheck, CalendarClock, GraduationCap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

type Enrollment = {
    duration: number | null;
    field: string | null;
    id: number;
    maxReschedule: number | null;
    program: string | null;
    sessions: number | null;
    startDate: string | null;
    status: string;
    variant: string | null;
};

export default function StudentEnrollments({
    enrollments,
}: {
    enrollments: Enrollment[];
}) {
    const activeEnrollments = enrollments.filter(
        (enrollment) => enrollment.status === 'active',
    ).length;

    return (
        <>
            <Head title="Enrollments" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4">
                <div>
                    <h1 className="font-heading text-2xl font-semibold">
                        Enrollments
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        View your active programs, session variants, and
                        reschedule allowance.
                    </p>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardContent className="flex items-center gap-4 px-6 py-5">
                            <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                <GraduationCap className="size-5" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Total programs
                                </p>
                                <p className="text-2xl font-semibold">
                                    {enrollments.length}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="flex items-center gap-4 px-6 py-5">
                            <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                <BookOpenCheck className="size-5" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Active
                                </p>
                                <p className="text-2xl font-semibold">
                                    {activeEnrollments}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="flex items-center gap-4 px-6 py-5">
                            <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                <CalendarClock className="size-5" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Next start
                                </p>
                                <p className="text-lg font-semibold">
                                    {enrollments[0]?.startDate ?? '-'}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Program list</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {enrollments.length === 0 ? (
                            <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                                No enrollments yet.
                            </div>
                        ) : (
                            <div className="rounded-2xl border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Field</TableHead>
                                            <TableHead>Variant</TableHead>
                                            <TableHead>Start date</TableHead>
                                            <TableHead>Max reschedule</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {enrollments.map((enrollment) => (
                                            <TableRow key={enrollment.id}>
                                                <TableCell className="font-medium">
                                                    {enrollment.program ?? '-'}
                                                </TableCell>
                                                <TableCell>
                                                    {enrollment.field ?? '-'}
                                                </TableCell>
                                                <TableCell>
                                                    <div>
                                                        <p>
                                                            {enrollment.variant ??
                                                                '-'}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {enrollment.sessions ??
                                                                '-'}{' '}
                                                            sessions ·{' '}
                                                            {enrollment.duration ??
                                                                '-'}{' '}
                                                            minutes
                                                        </p>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {enrollment.startDate ?? '-'}
                                                </TableCell>
                                                <TableCell>
                                                    {enrollment.maxReschedule ??
                                                        '-'}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge>
                                                        {enrollment.status}
                                                    </Badge>
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

StudentEnrollments.layout = {
    breadcrumbs: [
        {
            title: 'Enrollments',
            href: '/enrollments',
        },
    ],
};
