import { Head } from '@inertiajs/react';
import { GraduationCap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

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

function statusVariant(status: string) {
    return status === 'active' ? 'default' : 'secondary';
}

export default function StudentEnrollments({
    enrollments,
}: {
    enrollments: Enrollment[];
}) {
    return (
        <>
            <Head title="Enrollments" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4 md:p-6">
                <Card className="border-primary/15 bg-primary/5">
                    <CardContent className="p-5 md:p-6">
                        <div className="flex items-start gap-4">
                            <div>
                                <h1 className="font-heading text-2xl font-semibold md:text-3xl">
                                    Program belajarmu saat ini
                                </h1>
                                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                                    Lihat program, paket sesi, dan detail
                                    belajar yang sedang kamu ikuti.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {enrollments.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center gap-3 py-14 text-center">
                            <GraduationCap className="size-10 text-muted-foreground" />
                            <div>
                                <p className="font-medium">Belum ada program</p>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Program yang kamu ikuti akan tampil di sini.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 lg:grid-cols-2">
                        {enrollments.map((enrollment) => (
                            <Card key={enrollment.id}>
                                <CardContent className="space-y-5 p-5">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="min-w-0">
                                            <p className="text-sm text-muted-foreground">
                                                {enrollment.field ??
                                                    'Program belajar'}
                                            </p>
                                            <h2 className="mt-1 truncate text-xl font-semibold">
                                                {enrollment.program ?? '-'}
                                            </h2>
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                {enrollment.variant ??
                                                    'Paket utama'}
                                            </p>
                                        </div>
                                        <Badge
                                            variant={statusVariant(
                                                enrollment.status,
                                            )}
                                            className="capitalize"
                                        >
                                            {enrollment.status}
                                        </Badge>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
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
