import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowRight, ArrowUpRight, PlayCircle } from 'lucide-react';
import { useState } from 'react';

import { TimezoneIndicator } from '@/components/timezone-indicator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardAction,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    formatBadgeLabel,
    getBadgeProps,
    getStatusBadgeTone,
} from '@/lib/badge';
import {
    formatDateInput,
    formatDateTime,
    formatTimeRange,
} from '@/lib/date-time';
import { ScheduleFeedbackDialog } from '@/pages/student/schedules/components/schedule-feedback-dialog';
import type { ScheduleFeedbackSession } from '@/pages/student/schedules/components/schedule-feedback-dialog';
import { StudentBookSessionDialog } from '@/pages/student/schedules/components/student-book-session-dialog';
import type { BookingSubjectOption } from '@/pages/student/schedules/components/student-book-session-dialog';

type StudentSession = {
    endAt: string;
    id: string;
    mentor: string;
    mentorRating?: number | null;
    program: string;
    startAt: string;
    status: string;
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

function formatRelativeSessionDay(dateValue: string, timezone: string) {
    const sessionDate = new Date(dateValue);
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    if (
        formatDateInput(sessionDate, timezone) ===
        formatDateInput(today, timezone)
    ) {
        return 'Hari ini';
    }

    if (
        formatDateInput(sessionDate, timezone) ===
        formatDateInput(tomorrow, timezone)
    ) {
        return 'Besok';
    }

    return null;
}

function formatSessionDate(dateValue: string, timezone: string) {
    const sessionDate = new Date(dateValue);

    return {
        day: formatDateTime(sessionDate, timezone, { day: '2-digit' }),
        month: formatDateTime(sessionDate, timezone, { month: 'short' }),
    };
}

function formatSessionTimeLabel(
    startAt: string,
    endAt: string,
    timezone: string,
) {
    const relativeDay = formatRelativeSessionDay(startAt, timezone);
    const timeRange = formatTimeRange(startAt, endAt, timezone, {
        includeTimezone: false,
    });

    return relativeDay ? `${relativeDay}, ${timeRange}` : timeRange;
}

function greetingForCurrentTime(timezone: string) {
    const hour = Number(
        formatDateTime(new Date(), timezone, {
            hour: '2-digit',
            hourCycle: 'h23',
        }),
    );

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
    pendingFeedbackSessions,
    recordings,
    sessions,
    stats,
    subjects,
}: {
    pendingFeedbackSessions: ScheduleFeedbackSession[];
    recordings: StudentRecording[];
    sessions: StudentSession[];
    stats: StudentStats;
    subjects: BookingSubjectOption[];
}) {
    const { auth } = usePage().props;
    const timezone = auth.user.timezone;
    const [bookingOpen, setBookingOpen] = useState(false);
    const [feedbackOpen, setFeedbackOpen] = useState(false);
    const [feedbackReminderOpen, setFeedbackReminderOpen] = useState(false);
    const [feedbackSession, setFeedbackSession] =
        useState<ScheduleFeedbackSession | null>(null);
    const studentName = auth.user?.nickname || auth.user?.name || 'Siswa';
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
    const unavailableBookingLabel = hasActiveProgram
        ? 'Lihat paket belajar'
        : 'Lihat status program';
    const currentTime = new Date();
    const canJoinSession = (session: StudentSession) => {
        const joinWindowStart = new Date(session.startAt);
        joinWindowStart.setMinutes(joinWindowStart.getMinutes() - 5);

        return (
            Boolean(session.zoomLink) &&
            currentTime >= joinWindowStart &&
            currentTime <= new Date(session.endAt)
        );
    };
    const primaryPendingFeedback = pendingFeedbackSessions[0] ?? null;
    const pendingFeedbackLabel =
        pendingFeedbackSessions.length > 1
            ? `${pendingFeedbackSessions.length} sesi menunggu penilaian`
            : '1 sesi menunggu penilaian';
    const openFeedbackDialog = (session: ScheduleFeedbackSession) => {
        setFeedbackReminderOpen(false);
        setFeedbackSession(session);
        setFeedbackOpen(true);
    };
    const requestBooking = () => {
        if (primaryPendingFeedback) {
            setFeedbackReminderOpen(true);

            return;
        }

        setBookingOpen(true);
    };

    return (
        <>
            <Head title="Dashboard" />
            <div className="flex h-full max-w-full min-w-0 flex-1 flex-col gap-8 py-4 text-[#102a3a] md:gap-10 md:py-6">
                <div className="space-y-6">
                    <section className="flex h-full flex-col gap-5 py-2 md:flex-row md:items-start md:justify-between md:gap-8 md:py-4">
                        <div className="min-w-0">
                            <h1 className="max-w-3xl font-heading text-2xl leading-tight font-semibold tracking-tight text-[#102a3a] md:text-4xl">
                                {greetingForCurrentTime(timezone)}
                                {', '}
                                <span className="font-bold text-[#0f8f7a]">
                                    {studentName}
                                </span>
                                !
                            </h1>
                            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#526b7b]">
                                {dashboardHeadline}
                            </p>
                        </div>

                        {canBookSession ? (
                            <>
                                <Button
                                    className="shrink-0 gap-2 rounded-2xl bg-[#d9a441] text-[#102a3a] shadow-lg shadow-[#d9a441]/20 hover:bg-[#c89532]"
                                    onClick={requestBooking}
                                >
                                    Jadwalkan sesi
                                    <ArrowUpRight className="size-4" />
                                </Button>
                                <StudentBookSessionDialog
                                    open={bookingOpen}
                                    onOpenChange={setBookingOpen}
                                    subjects={subjects}
                                    trigger={null}
                                />
                            </>
                        ) : (
                            <Button
                                asChild
                                className="shrink-0 rounded-2xl bg-[#d9a441] text-[#102a3a] shadow-lg shadow-[#d9a441]/20 hover:bg-[#c89532]"
                            >
                                <Link href="/enrollments">
                                    {unavailableBookingLabel}
                                </Link>
                            </Button>
                        )}
                    </section>

                    {primaryPendingFeedback ? (
                        <Alert className="flex flex-col gap-3 rounded-md border-0 bg-[#eafcf4] px-4 py-3 text-[#102a3a] shadow-none md:flex-row md:items-center md:justify-between md:gap-4">
                            <div className="min-w-0">
                                <div className="flex min-w-0 items-center gap-3">
                                    <Badge className="rounded-md border-0 bg-[#45bd91] px-3 py-1 text-xs font-semibold text-white hover:bg-[#45bd91]">
                                        Baru
                                    </Badge>
                                    <AlertTitle className="font-semibold text-[#102a3a]">
                                        Nilai sesi terakhirmu
                                    </AlertTitle>
                                </div>
                                <AlertDescription className="mt-1.5 min-w-0 text-sm font-medium text-[#102a3a]">
                                    <span>{pendingFeedbackLabel}.</span>{' '}
                                    <span>
                                        Bantu mentor menyiapkan sesi berikutnya.
                                    </span>
                                </AlertDescription>
                            </div>
                            <button
                                type="button"
                                className="inline-flex shrink-0 items-center gap-1 self-start font-semibold text-[#102a3a] underline underline-offset-4 transition-colors hover:text-[#0f8f7a] md:self-center"
                                onClick={() =>
                                    openFeedbackDialog(primaryPendingFeedback)
                                }
                            >
                                Nilai sesi
                                <ArrowRight className="size-4" />
                            </button>
                        </Alert>
                    ) : null}
                </div>
                <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_24rem]">
                    <section className="space-y-3">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <h2 className="text-md font-heading font-semibold text-[#102a3a]">
                                    Sesi terdekat
                                </h2>
                                <TimezoneIndicator compact />
                            </div>
                            <Link
                                href="/schedules"
                                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0f8f7a] transition-colors hover:text-[#0b7668]"
                            >
                                Lihat semua
                                <ArrowRight className="size-4" />
                            </Link>
                        </div>

                        {sessions.length > 0 ? (
                            <div className="divide-y divide-[#edf3f1] overflow-hidden rounded-md bg-white shadow-sm ring-1 shadow-[#102a3a]/[0.03] ring-[#dcece7]">
                                {sessions.slice(0, 4).map((session) => {
                                    const sessionDate = formatSessionDate(
                                        session.startAt,
                                        timezone,
                                    );
                                    const canJoin = canJoinSession(session);

                                    return (
                                        <div
                                            key={session.id}
                                            className="grid gap-5 px-4 py-5 transition-colors hover:bg-[#f8fbfa] sm:px-5 md:grid-cols-[4.75rem_minmax(0,1fr)_7rem] md:items-center"
                                        >
                                            <div className="flex items-center gap-4 md:block">
                                                <div className="w-18 rounded-md bg-[#edf7f4] px-3 py-2.5 text-center text-[#0f8f7a] md:w-auto">
                                                    <p className="text-xl leading-none font-semibold">
                                                        {sessionDate.day}
                                                    </p>
                                                    <p className="mt-1 text-[11px] font-semibold tracking-wide uppercase">
                                                        {sessionDate.month}
                                                    </p>
                                                </div>
                                                <div className="md:hidden">
                                                    <div className="space-y-1.5">
                                                        <p className="text-sm font-semibold text-[#0f8f7a]">
                                                            {formatSessionTimeLabel(
                                                                session.startAt,
                                                                session.endAt,
                                                                timezone,
                                                            )}
                                                        </p>
                                                        <Badge
                                                            {...getBadgeProps(
                                                                getStatusBadgeTone(
                                                                    session.status,
                                                                ),
                                                                'w-fit',
                                                            )}
                                                        >
                                                            {formatBadgeLabel(
                                                                session.status,
                                                            )}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="min-w-0 self-center">
                                                <div className="hidden flex-wrap items-center gap-2 md:flex">
                                                    <p className="text-sm font-semibold text-[#0f8f7a]">
                                                        {formatSessionTimeLabel(
                                                            session.startAt,
                                                            session.endAt,
                                                            timezone,
                                                        )}
                                                    </p>
                                                    <Badge
                                                        {...getBadgeProps(
                                                            getStatusBadgeTone(
                                                                session.status,
                                                            ),
                                                            'w-fit',
                                                        )}
                                                    >
                                                        {formatBadgeLabel(
                                                            session.status,
                                                        )}
                                                    </Badge>
                                                </div>
                                                <p className="mt-2 truncate leading-6 font-semibold text-[#102a3a]">
                                                    {session.title}{' '}
                                                    <span className="font-normal text-[#526b7b]">
                                                        · {session.mentor}
                                                    </span>
                                                </p>
                                            </div>

                                            <div className="flex items-center justify-start md:min-h-9 md:justify-end">
                                                {canJoin && session.zoomLink ? (
                                                    <Button
                                                        asChild
                                                        size="sm"
                                                        className="rounded-xl bg-[#0f8f7a] hover:bg-[#0b7668]"
                                                    >
                                                        <a
                                                            href={
                                                                session.zoomLink
                                                            }
                                                            target="_blank"
                                                            rel="noreferrer"
                                                        >
                                                            Bergabung
                                                        </a>
                                                    </Button>
                                                ) : null}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="rounded-[1.35rem] border border-dashed border-[#dcece7] bg-white p-6">
                                <p className="font-medium text-[#102a3a]">
                                    Belum ada sesi terjadwal
                                </p>
                                <p className="mt-1 text-sm text-[#526b7b]">
                                    Jadwalkan sesi belajar agar mentor bisa
                                    menyiapkan kelas untukmu.
                                </p>
                            </div>
                        )}
                    </section>

                    <Card className="rounded-[1.5rem] border-[#dcece7] bg-white shadow-sm shadow-[#102a3a]/[0.03]">
                        <CardHeader>
                            <CardTitle className="text-[#102a3a]">
                                Rekaman terbaru
                            </CardTitle>
                            <CardAction>
                                <Link
                                    href="/recordings"
                                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0f8f7a] transition-colors hover:text-[#0b7668]"
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
                                        className="flex gap-3 rounded-[1.15rem] border border-[#dcece7] p-3 transition-colors hover:border-[#bfe4db]"
                                    >
                                        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#edf7f4] text-[#0f8f7a]">
                                            <PlayCircle className="size-5" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="line-clamp-2 text-sm font-semibold text-[#102a3a]">
                                                {recording.title}
                                            </p>
                                            <p className="mt-1 text-xs text-[#526b7b]">
                                                {recording.subject} ·{' '}
                                                {recording.mentor}
                                            </p>
                                            <Button
                                                asChild
                                                variant="link"
                                                className="mt-1 h-auto px-0 text-xs font-semibold text-[#0f8f7a] hover:text-[#0b7668]"
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
                                <div className="rounded-[1.15rem] border border-dashed border-[#dcece7] p-6 text-sm text-[#526b7b]">
                                    Belum ada rekaman sesi.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            <Dialog
                open={feedbackReminderOpen}
                onOpenChange={setFeedbackReminderOpen}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Nilai sesi sebelumnya?</DialogTitle>
                        <DialogDescription>
                            Masukanmu membantu mentor menyesuaikan pembelajaran
                            berikutnya.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:justify-between">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setFeedbackReminderOpen(false);
                                setBookingOpen(true);
                            }}
                        >
                            Nanti
                        </Button>
                        <Button
                            type="button"
                            onClick={() => {
                                if (primaryPendingFeedback) {
                                    openFeedbackDialog(primaryPendingFeedback);
                                }
                            }}
                        >
                            Nilai sekarang
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ScheduleFeedbackDialog
                open={feedbackOpen}
                onOpenChange={setFeedbackOpen}
                session={feedbackSession}
            />
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
