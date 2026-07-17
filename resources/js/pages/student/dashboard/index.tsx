import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowRight, ArrowUpRight, BookOpen, PlayCircle } from 'lucide-react';
import { DynamicIcon } from 'lucide-react/dynamic';
import type { IconName } from 'lucide-react/dynamic';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardAction,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { StudentBookSessionDialog } from '@/pages/student/schedules/components/student-book-session-dialog';
import type { BookingSubjectOption } from '@/pages/student/schedules/components/student-book-session-dialog';

type StudentSession = {
    endAt: string;
    id: string;
    mentor: string;
    program: string;
    startAt: string;
    status: string;
    subjectIcon?: IconName | null;
    time: string;
    title: string;
    zoomLink: string | null;
};

type StudentRecording = {
    id: string;
    mentor: string;
    recordedAt: string | null;
    subject: string;
    title: string;
    youtubeEmbedUrl: string;
    youtubeUrl: string;
};

type StudentStats = {
    activePrograms: number;
    completedLessons: number;
    progress: number;
    upcomingSessions: number;
};

function formatRelativeSessionDay(dateValue: string) {
    const sessionDate = new Date(dateValue);
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    if (sessionDate.toDateString() === today.toDateString()) {
        return 'Hari ini';
    }

    if (sessionDate.toDateString() === tomorrow.toDateString()) {
        return 'Besok';
    }

    return null;
}

function formatSessionDate(dateValue: string) {
    const sessionDate = new Date(dateValue);

    return {
        day: new Intl.DateTimeFormat('id-ID', { day: '2-digit' }).format(
            sessionDate,
        ),
        month: new Intl.DateTimeFormat('id-ID', { month: 'short' }).format(
            sessionDate,
        ),
    };
}

function formatSessionTimeLabel(startAt: string, endAt: string) {
    const relativeDay = formatRelativeSessionDay(startAt);
    const timeRange = formatSessionTimeRange(startAt, endAt);

    return relativeDay ? `${relativeDay}, ${timeRange}` : timeRange;
}

function formatNextSessionLabel(dateValue: string) {
    const relativeDay = formatRelativeSessionDay(dateValue);

    if (relativeDay === 'Hari ini') {
        return 'Kelas hari ini';
    }

    if (relativeDay === 'Besok') {
        return 'Kelas besok';
    }

    return 'Kelas terdekat';
}

function formatSessionTimeRange(startAt: string, endAt: string) {
    const formatter = new Intl.DateTimeFormat('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
    });

    return `${formatter.format(new Date(startAt))} - ${formatter.format(
        new Date(endAt),
    )}`;
}

function greetingForCurrentTime() {
    const hour = new Date().getHours();

    if (hour >= 4 && hour < 11) {
        return 'Selamat pagi';
    }

    if (hour >= 11 && hour < 15) {
        return 'Selamat siang';
    }

    if (hour >= 15 && hour < 18) {
        return 'Selamat sore';
    }

    return 'Selamat malam';
}

export default function StudentDashboard({
    recordings,
    sessions,
    stats,
    subjects,
}: {
    recordings: StudentRecording[];
    sessions: StudentSession[];
    stats: StudentStats;
    subjects: BookingSubjectOption[];
}) {
    const { auth } = usePage().props;
    const studentName = auth.user?.name ?? 'Siswa';
    const hasActiveProgram = stats.activePrograms > 0;
    const canBookSession = subjects.some(
        (subject) =>
            Boolean(subject.enrollmentId) && subject.sessionsRemaining !== 0,
    );
    const dashboardHeadline = !hasActiveProgram
        ? 'Mulai kembali perjalanan belajarmu!'
        : canBookSession
          ? 'Yuk, atur jadwal belajar berikutnya!'
          : 'Saatnya lanjut ke paket belajar berikutnya';
    const dashboardDescription = !hasActiveProgram
        ? 'Program belajarmu belum aktif. Cek status programmu agar kamu bisa mulai booking sesi dengan mentor.'
        : canBookSession
          ? 'Pilih mata pelajaran, tentukan waktu, dan siapkan sesi belajar yang paling cocok untuk ritmemu.'
          : 'Sesi pada paketmu sudah terpakai. Cek paket belajar agar progress kamu tidak berhenti di tengah jalan.';
    const unavailableBookingLabel = hasActiveProgram
        ? 'Lihat paket belajar'
        : 'Lihat status program';
    const heroSession =
        sessions.find((session) => formatRelativeSessionDay(session.startAt)) ??
        null;
    const currentTime = new Date();
    const canJoinHeroSession =
        heroSession !== null &&
        Boolean(heroSession.zoomLink) &&
        currentTime >= new Date(heroSession.startAt) &&
        currentTime <= new Date(heroSession.endAt);
    const canJoinSession = (session: StudentSession) =>
        Boolean(session.zoomLink) &&
        currentTime >= new Date(session.startAt) &&
        currentTime <= new Date(session.endAt);

    return (
        <>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4 md:p-6">
                <div
                    className={
                        heroSession
                            ? 'grid gap-0 xl:grid-cols-[minmax(0,1fr)_24rem]'
                            : ''
                    }
                >
                    <Card
                        className={
                            heroSession
                                ? 'overflow-hidden rounded-b-none border-primary/15 bg-primary/5 xl:rounded-r-none xl:rounded-bl-2xl'
                                : 'overflow-hidden border-primary/15 bg-primary/5'
                        }
                    >
                        <CardContent className="flex h-full flex-col p-5 md:p-6">
                            <div>
                                <p className="text-sm font-medium">
                                    {greetingForCurrentTime()}{' '}
                                    <span className="font-bold text-primary">
                                        {studentName}
                                    </span>
                                    !
                                </p>
                                <h1 className="mt-2 max-w-3xl font-heading text-2xl leading-tight font-semibold md:text-4xl">
                                    {dashboardHeadline}
                                </h1>
                                <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
                                    {dashboardDescription}
                                </p>
                            </div>

                            <div className="mt-auto flex flex-wrap gap-3 pt-8">
                                {canBookSession ? (
                                    <StudentBookSessionDialog
                                        subjects={subjects}
                                        trigger={
                                            <Button className="gap-2">
                                                Jadwalkan sesi
                                                <ArrowUpRight className="size-4" />
                                            </Button>
                                        }
                                    />
                                ) : (
                                    <Button asChild>
                                        <Link href="/enrollments">
                                            {unavailableBookingLabel}
                                        </Link>
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {heroSession ? (
                        <Card className="-mt-px rounded-t-none xl:mt-0 xl:-ml-px xl:rounded-l-none xl:rounded-tr-2xl">
                            <CardContent className="flex h-full flex-col p-5 md:p-6">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <p className="text-xs font-medium text-muted-foreground uppercase">
                                            {formatNextSessionLabel(
                                                heroSession.startAt,
                                            )}
                                        </p>
                                        <p className="shrink-0 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                                            {formatSessionTimeRange(
                                                heroSession.startAt,
                                                heroSession.endAt,
                                            )}
                                        </p>
                                    </div>

                                    <div className="flex min-w-0 items-start gap-4">
                                        <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                            <DynamicIcon
                                                name={
                                                    heroSession.subjectIcon ??
                                                    'book-open'
                                                }
                                                fallback={() => (
                                                    <BookOpen className="size-6" />
                                                )}
                                                className="size-6"
                                            />
                                        </div>
                                        <div className="min-w-0">
                                            <h2 className="truncate font-heading text-xl font-semibold">
                                                {heroSession.title}
                                            </h2>
                                            <p className="mt-1 truncate text-sm font-medium text-muted-foreground">
                                                {heroSession.mentor}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-auto pt-5">
                                    {canJoinHeroSession &&
                                    heroSession.zoomLink ? (
                                        <Button asChild className="w-full">
                                            <a
                                                href={heroSession.zoomLink}
                                                target="_blank"
                                                rel="noreferrer"
                                            >
                                                Bergabung sekarang
                                            </a>
                                        </Button>
                                    ) : (
                                        <Button
                                            className="w-full"
                                            variant="outline"
                                            disabled
                                        >
                                            {heroSession.zoomLink
                                                ? 'Bisa bergabung saat kelas dimulai'
                                                : 'Link meeting belum tersedia'}
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ) : null}
                </div>
                <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_24rem]">
                    <Card>
                        <CardHeader>
                            <CardTitle>Sesi terdekat</CardTitle>
                            <CardAction>
                                <Link
                                    href="/schedules"
                                    className="inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-primary/80"
                                >
                                    Lihat semua
                                    <ArrowRight className="size-4" />
                                </Link>
                            </CardAction>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {sessions.length > 0 ? (
                                sessions.slice(0, 4).map((session) => {
                                    const sessionDate = formatSessionDate(
                                        session.startAt,
                                    );

                                    return (
                                        <div
                                            key={session.id}
                                            className="grid gap-4 rounded-xl border bg-card p-4 transition-colors hover:border-primary/30 md:grid-cols-[5.5rem_minmax(0,1fr)_auto]"
                                        >
                                            <div className="flex items-center gap-3 md:block">
                                                <div className="w-20 rounded-xl bg-primary/10 px-3 py-3 text-center text-primary md:w-auto">
                                                    <p className="text-2xl leading-none font-semibold">
                                                        {sessionDate.day}
                                                    </p>
                                                    <p className="mt-1 text-xs font-medium uppercase">
                                                        {sessionDate.month}
                                                    </p>
                                                </div>
                                                <div className="md:hidden">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <p className="text-sm font-semibold">
                                                            {formatSessionTimeLabel(
                                                                session.startAt,
                                                                session.endAt,
                                                            )}
                                                        </p>
                                                        <Badge
                                                            variant="secondary"
                                                            className="w-fit"
                                                        >
                                                            {session.status}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="min-w-0 self-center">
                                                <div className="hidden items-center gap-2 md:flex">
                                                    <p className="text-sm font-semibold text-primary">
                                                        {formatSessionTimeLabel(
                                                            session.startAt,
                                                            session.endAt,
                                                        )}
                                                    </p>
                                                    <Badge
                                                        variant="secondary"
                                                        className="w-fit"
                                                    >
                                                        {session.status}
                                                    </Badge>
                                                </div>
                                                <p className="mt-2 truncate font-semibold">
                                                    {session.title}{' '}
                                                    <span className="font-normal text-muted-foreground">
                                                        · {session.mentor}
                                                    </span>
                                                </p>
                                            </div>

                                            <div className="flex items-center justify-start md:justify-end">
                                                {canJoinSession(session) &&
                                                session.zoomLink ? (
                                                    <Button asChild size="sm">
                                                        <a
                                                            href={
                                                                session.zoomLink
                                                            }
                                                            target="_blank"
                                                            rel="noreferrer"
                                                        >
                                                            Masuk
                                                        </a>
                                                    </Button>
                                                ) : null}
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="rounded-xl border border-dashed p-6">
                                    <p className="font-medium">
                                        Belum ada sesi terjadwal
                                    </p>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Jadwalkan sesi belajar agar mentor bisa
                                        menyiapkan kelas untukmu.
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Rekaman terbaru</CardTitle>
                            <CardAction>
                                <Link
                                    href="/recordings"
                                    className="inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-primary/80"
                                >
                                    <ArrowRight className="size-4" />
                                </Link>
                            </CardAction>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {recordings.length > 0 ? (
                                recordings.slice(0, 3).map((recording) => (
                                    <div
                                        key={recording.id}
                                        className="flex gap-3 rounded-xl border p-3"
                                    >
                                        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                            <PlayCircle className="size-5" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="line-clamp-2 text-sm font-medium">
                                                {recording.title}
                                            </p>
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                {recording.subject} ·{' '}
                                                {recording.mentor}
                                            </p>
                                            <Button
                                                asChild
                                                variant="link"
                                                className="mt-1 h-auto px-0 text-xs"
                                            >
                                                <a
                                                    href={recording.youtubeUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                >
                                                    Tonton rekaman
                                                </a>
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
                                    Belum ada rekaman sesi.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}

StudentDashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: '/dashboard',
        },
    ],
};
