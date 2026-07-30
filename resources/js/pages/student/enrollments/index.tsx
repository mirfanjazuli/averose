import { Head, Link } from '@inertiajs/react';
import {
    ArrowUpRight,
    BookOpen,
    CalendarDays,
    Clock3,
    GraduationCap,
    Repeat2,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatBadgeLabel, getBadgeProps, getStatusBadgeTone } from '@/lib/badge';

type Enrollment = {
    duration: number | null;
    field: string | null;
    id: number;
    maxReschedule: number | null;
    program: string | null;
    sessions: number | null;
    sessionsRemaining: number | null;
    sessionsUsed: number | null;
    startDate: string | null;
    status: string;
    variant: string | null;
};

function formatStartDate(dateValue: string | null) {
    if (!dateValue) {
        return '-';
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return dateValue;
    }

    return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    }).format(date);
}

function enrollmentProgress(enrollment: Enrollment) {
    if (!enrollment.sessions || enrollment.sessions <= 0) {
        return 0;
    }

    return Math.min(
        100,
        Math.round(((enrollment.sessionsUsed ?? 0) / enrollment.sessions) * 100),
    );
}

function remainingLabel(enrollment: Enrollment) {
    if (enrollment.sessionsRemaining === null) {
        return '-';
    }

    return `${enrollment.sessionsRemaining} sesi`;
}

export default function StudentEnrollments({
    enrollments,
}: {
    enrollments: Enrollment[];
}) {
    return (
        <>
            <Head title="Program" />
            <div className="flex h-full min-w-0 max-w-full flex-1 flex-col gap-8 py-4 text-[#102a3a] md:gap-10 md:py-6">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h1 className="font-heading text-2xl leading-tight font-semibold tracking-tight text-[#102a3a] md:text-4xl">
                            Program belajar
                        </h1>
                        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#526b7b]">
                            Pantau paket belajar, sesi tersisa, dan jadwal yang
                            bisa kamu atur berikutnya.
                        </p>
                    </div>
                    <Button
                        asChild
                        className="w-full shrink-0 gap-2 rounded-2xl bg-[#d9a441] text-[#102a3a] shadow-lg shadow-[#d9a441]/20 hover:bg-[#c89532] sm:w-auto"
                    >
                        <Link href="/schedules">
                            Jadwalkan sesi
                            <ArrowUpRight className="size-4" />
                        </Link>
                    </Button>
                </div>

                {enrollments.length === 0 ? (
                    <div className="rounded-md bg-[#f8fbfa] px-6 py-12 text-center">
                        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-white text-[#0f8f7a] ring-1 ring-[#dcece7]">
                            <GraduationCap className="size-6" />
                        </div>
                        <h2 className="mt-5 font-heading text-xl font-semibold text-[#102a3a]">
                            Belum ada program aktif
                        </h2>
                        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#526b7b]">
                            Pilih program yang sesuai dengan target belajarmu,
                            lalu mulai atur sesi bersama mentor.
                        </p>
                        <Button
                            asChild
                            className="mt-6 rounded-2xl bg-[#d9a441] text-[#102a3a] hover:bg-[#c89532]"
                        >
                            <Link href="/programs">Lihat semua program</Link>
                        </Button>
                    </div>
                ) : (
                    <div className="grid gap-4 xl:grid-cols-2">
                        {enrollments.map((enrollment) => {
                            const progress = enrollmentProgress(enrollment);

                            return (
                                <article
                                    key={enrollment.id}
                                    className="overflow-hidden rounded-md bg-white shadow-sm shadow-[#102a3a]/[0.03] ring-1 ring-[#dcece7]"
                                >
                                    <div className="space-y-5 p-5 sm:p-6">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-[#526b7b]">
                                                    {enrollment.field ??
                                                        'Program belajar'}
                                                </p>
                                                <h2 className="mt-1 truncate font-heading text-xl font-semibold text-[#102a3a]">
                                                    {enrollment.program ?? '-'}
                                                </h2>
                                                <p className="mt-1 text-sm text-[#526b7b]">
                                                    {enrollment.variant ??
                                                        'Paket utama'}
                                                </p>
                                            </div>
                                            <Badge
                                                {...getBadgeProps(
                                                    getStatusBadgeTone(
                                                        enrollment.status,
                                                    ),
                                                    'shrink-0',
                                                )}
                                            >
                                                {formatBadgeLabel(
                                                    enrollment.status,
                                                )}
                                            </Badge>
                                        </div>

                                        <div>
                                            <div className="flex items-end justify-between gap-4">
                                                <div>
                                                    <p className="text-xs font-semibold tracking-wide text-[#526b7b] uppercase">
                                                        Sesi tersisa
                                                    </p>
                                                    <p className="mt-1 font-heading text-3xl font-semibold text-[#0f8f7a]">
                                                        {remainingLabel(
                                                            enrollment,
                                                        )}
                                                    </p>
                                                </div>
                                                <p className="text-sm font-medium text-[#526b7b]">
                                                    {enrollment.sessionsUsed ??
                                                        0}
                                                    /{enrollment.sessions ?? 0}{' '}
                                                    sesi
                                                </p>
                                            </div>
                                            <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#edf7f4]">
                                                <div
                                                    className="h-full rounded-full bg-[#0f8f7a]"
                                                    style={{
                                                        width: `${progress}%`,
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        <div className="grid gap-3 text-sm sm:grid-cols-3">
                                            <div className="flex gap-3">
                                                <BookOpen className="mt-0.5 size-4 shrink-0 text-[#0f8f7a]" />
                                                <div>
                                                    <p className="font-semibold text-[#102a3a]">
                                                        Paket
                                                    </p>
                                                    <p className="mt-0.5 text-[#526b7b]">
                                                        {enrollment.sessions ??
                                                            0}{' '}
                                                        sesi
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex gap-3">
                                                <Clock3 className="mt-0.5 size-4 shrink-0 text-[#0f8f7a]" />
                                                <div>
                                                    <p className="font-semibold text-[#102a3a]">
                                                        Durasi
                                                    </p>
                                                    <p className="mt-0.5 text-[#526b7b]">
                                                        {enrollment.duration ??
                                                            '-'}{' '}
                                                        menit
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex gap-3">
                                                <Repeat2 className="mt-0.5 size-4 shrink-0 text-[#0f8f7a]" />
                                                <div>
                                                    <p className="font-semibold text-[#102a3a]">
                                                        Reschedule
                                                    </p>
                                                    <p className="mt-0.5 text-[#526b7b]">
                                                        {enrollment.maxReschedule ??
                                                            0}{' '}
                                                        kali
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-3 border-t border-[#edf3f1] pt-4 sm:flex-row sm:items-center sm:justify-between">
                                            <div className="flex items-center gap-2 text-sm text-[#526b7b]">
                                                <CalendarDays className="size-4 text-[#0f8f7a]" />
                                                Mulai{' '}
                                                {formatStartDate(
                                                    enrollment.startDate,
                                                )}
                                            </div>
                                            <Button
                                                asChild
                                                variant="outline"
                                                className="rounded-xl border-[#dcece7] text-[#102a3a] hover:bg-[#edf7f4] hover:text-[#0f8f7a]"
                                            >
                                                <Link href="/schedules">
                                                    Atur jadwal
                                                </Link>
                                            </Button>
                                        </div>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
            </div>
        </>
    );
}

StudentEnrollments.layout = {
    breadcrumbs: [
        {
            title: 'Program',
            href: '/enrollments',
        },
    ],
};
