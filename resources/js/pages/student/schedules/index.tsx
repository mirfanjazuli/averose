import { Form, Head } from '@inertiajs/react';
import { ArrowUpRight, BookOpen, Pencil, Repeat2, Search } from 'lucide-react';
import { DynamicIcon } from 'lucide-react/dynamic';
import type { IconName } from 'lucide-react/dynamic';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import InputError from '@/components/input-error';
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
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    formatBadgeLabel,
    getBadgeProps,
    getStatusBadgeTone,
} from '@/lib/badge';
import { Textarea } from '@/components/ui/textarea';
import type { BookingSubjectOption } from '@/pages/student/schedules/components/student-book-session-dialog';
import { StudentBookSessionDialog } from '@/pages/student/schedules/components/student-book-session-dialog';

const rescheduleReasons = [
    'Sakit',
    'Bentrok sekolah/kampus',
    'Kegiatan keluarga',
    'Kendala internet/perangkat',
    'Lainnya',
];

type StudentSession = {
    canRequestReschedule: boolean;
    endAt: string;
    id: string;
    mentor: string;
    program: string;
    rescheduleRequest: {
        id: string;
        reason: string;
        requested: string;
        status: string;
    } | null;
    rescheduleSlots: {
        label: string;
        value: string;
    }[];
    startAt: string;
    status: string;
    subjectIcon?: IconName | null;
    time: string;
    title: string;
    zoomLink: string | null;
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

function formatGroupLabel(dateValue: string) {
    const relativeDay = formatRelativeSessionDay(dateValue);

    if (relativeDay) {
        return relativeDay;
    }

    const sessionDate = new Date(dateValue);

    return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'long',
        weekday: 'long',
    }).format(sessionDate);
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

function formatDateInputValue(dateValue: string) {
    const date = new Date(dateValue);

    return [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, '0'),
        String(date.getDate()).padStart(2, '0'),
    ].join('-');
}

function formatTimeInputValue(dateValue: string) {
    const date = new Date(dateValue);

    return [
        String(date.getHours()).padStart(2, '0'),
        String(date.getMinutes()).padStart(2, '0'),
    ].join(':');
}

export default function StudentSchedules({
    sessions,
    subjects,
}: {
    sessions: StudentSession[];
    subjects: BookingSubjectOption[];
}) {
    const [searchQuery, setSearchQuery] = useState('');
    const [reschedulingSession, setReschedulingSession] =
        useState<StudentSession | null>(null);
    const [editingSession, setEditingSession] = useState<StudentSession | null>(
        null,
    );

    const canBookSession = subjects.some(
        (subject) =>
            Boolean(subject.enrollmentId) && subject.sessionsRemaining !== 0,
    );
    const heroSession =
        sessions.find((session) => formatRelativeSessionDay(session.startAt)) ??
        null;
    const currentTime = new Date();
    const canJoinHeroSession =
        heroSession !== null &&
        Boolean(heroSession.zoomLink) &&
        currentTime >= new Date(heroSession.startAt) &&
        currentTime <= new Date(heroSession.endAt);
    const filteredSessions = useMemo(() => {
        const normalizedSearch = searchQuery.trim().toLowerCase();

        if (!normalizedSearch) {
            return sessions;
        }

        return sessions.filter((session) =>
            [
                session.title,
                session.mentor,
                session.program,
                session.time,
                session.status,
            ].some((value) => value.toLowerCase().includes(normalizedSearch)),
        );
    }, [searchQuery, sessions]);

    const groupedSessions = useMemo(() => {
        const groups = new Map<string, StudentSession[]>();

        filteredSessions.forEach((session) => {
            const groupKey = new Date(session.startAt).toDateString();
            groups.set(groupKey, [...(groups.get(groupKey) ?? []), session]);
        });

        return Array.from(groups.entries()).map(([key, groupSessions]) => ({
            key,
            label: formatGroupLabel(groupSessions[0].startAt),
            sessions: groupSessions,
        }));
    }, [filteredSessions]);

    return (
        <>
            <Head title="Schedules" />
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
                                <h1 className="font-heading text-2xl leading-tight font-semibold md:text-4xl">
                                    Atur jadwal belajarmu sekarang!
                                </h1>
                                <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
                                    Lihat jadwal, ajukan reschedule saat
                                    dibutuhkan, dan tambah sesi baru di sini.
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
                                        <a href="/enrollments">
                                            Lihat paket belajar
                                        </a>
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

                <Card>
                    <CardHeader className="pb-0">
                        <CardTitle>Sesi terjadwal</CardTitle>
                        <CardAction>
                            <div className="flex h-10 min-w-64 items-center gap-2 rounded-xl border bg-background px-3 text-sm text-muted-foreground">
                                <Search className="size-4" />
                                <Input
                                    value={searchQuery}
                                    onChange={(event) =>
                                        setSearchQuery(event.target.value)
                                    }
                                    placeholder="Cari sesi..."
                                    className="h-auto border-0 bg-transparent px-0 py-0 shadow-none focus-visible:ring-0"
                                />
                            </div>
                        </CardAction>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {groupedSessions.length > 0 ? (
                            groupedSessions.map((group) => (
                                <section key={group.key} className="space-y-3">
                                    <h2 className="font-semibold">
                                        {group.label}
                                    </h2>

                                    <div className="space-y-2">
                                        {group.sessions.map((session) => (
                                            <div
                                                key={session.id}
                                                className="grid gap-3 rounded-xl border bg-card p-4 transition-colors hover:border-primary/30 md:grid-cols-[12rem_minmax(0,1fr)_auto]"
                                            >
                                                <div className="flex flex-wrap items-center gap-2 self-center">
                                                    <p className="text-sm font-semibold text-primary">
                                                        {formatSessionTimeRange(
                                                            session.startAt,
                                                            session.endAt,
                                                        )}
                                                    </p>
                                                    <Badge
                                                        {...getBadgeProps(
                                                            getStatusBadgeTone(
                                                                session.status,
                                                            ),
                                                        )}
                                                    >
                                                        {formatBadgeLabel(
                                                            session.status,
                                                        )}
                                                    </Badge>
                                                    {session.rescheduleRequest ? (
                                                        <Badge variant="outline">
                                                            Menunggu reschedule
                                                        </Badge>
                                                    ) : null}
                                                </div>

                                                <div className="min-w-0 self-center">
                                                    <p className="truncate font-semibold">
                                                        {session.title}{' '}
                                                        <span className="font-normal text-muted-foreground">
                                                            · {session.mentor}
                                                        </span>
                                                    </p>
                                                </div>

                                                <div className="flex items-center justify-start gap-2 md:justify-end">
                                                    {session.rescheduleRequest ? (
                                                        <div className="text-left text-sm md:text-right">
                                                            <p className="font-medium">
                                                                Menunggu
                                                                persetujuan
                                                                admin
                                                            </p>
                                                            <p className="mt-1 text-xs text-muted-foreground">
                                                                {
                                                                    session
                                                                        .rescheduleRequest
                                                                        .requested
                                                                }
                                                            </p>
                                                        </div>
                                                    ) : session.status ===
                                                      'Pending' ? (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="gap-2"
                                                            onClick={() =>
                                                                setEditingSession(
                                                                    session,
                                                                )
                                                            }
                                                        >
                                                            <Pencil className="size-4" />
                                                            Edit
                                                        </Button>
                                                    ) : [
                                                          'Assigned',
                                                          'Rescheduled',
                                                      ].includes(
                                                          session.status,
                                                      ) ? (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            disabled={
                                                                !session.canRequestReschedule
                                                            }
                                                            className="gap-2"
                                                            onClick={() =>
                                                                setReschedulingSession(
                                                                    session,
                                                                )
                                                            }
                                                        >
                                                            <Repeat2 className="size-4" />
                                                            Reschedule
                                                        </Button>
                                                    ) : (
                                                        <span className="text-sm text-muted-foreground">
                                                            -
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            ))
                        ) : (
                            <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                                Tidak ada sesi yang cocok.
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Dialog
                open={!!editingSession}
                onOpenChange={(open) => {
                    if (!open) {
                        setEditingSession(null);
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit jadwal</DialogTitle>
                        <DialogDescription>
                            Jadwal masih pending, jadi kamu bisa mengubah
                            tanggal dan jam sebelum mentor ditentukan.
                        </DialogDescription>
                    </DialogHeader>
                    {editingSession && (
                        <Form
                            key={editingSession.id}
                            action={`/schedules/${editingSession.id}`}
                            method="put"
                            onSuccess={() => {
                                setEditingSession(null);
                                toast.success('Jadwal berhasil diperbarui.');
                            }}
                            onError={() => {
                                toast.error('Gagal memperbarui jadwal.');
                            }}
                            className="space-y-4"
                        >
                            {({ errors, processing }) => (
                                <>
                                    <div className="rounded-lg border p-3 text-sm">
                                        <p className="font-medium">
                                            {editingSession.title}
                                        </p>
                                        <p className="mt-1 text-muted-foreground">
                                            Saat ini: {editingSession.time}
                                        </p>
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="grid gap-2">
                                            <Label htmlFor="edit_date">
                                                Tanggal
                                            </Label>
                                            <Input
                                                id="edit_date"
                                                name="date"
                                                type="date"
                                                required
                                                defaultValue={formatDateInputValue(
                                                    editingSession.startAt,
                                                )}
                                            />
                                            <InputError message={errors.date} />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="edit_time">
                                                Jam
                                            </Label>
                                            <Input
                                                id="edit_time"
                                                name="time"
                                                type="time"
                                                required
                                                defaultValue={formatTimeInputValue(
                                                    editingSession.startAt,
                                                )}
                                            />
                                            <InputError message={errors.time} />
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        className="w-full"
                                    >
                                        {processing
                                            ? 'Menyimpan...'
                                            : 'Simpan perubahan'}
                                    </Button>
                                </>
                            )}
                        </Form>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog
                open={!!reschedulingSession}
                onOpenChange={(open) => {
                    if (!open) {
                        setReschedulingSession(null);
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Ajukan reschedule</DialogTitle>
                        <DialogDescription>
                            Admin akan meninjau permintaanmu sebelum jadwal
                            berubah.
                        </DialogDescription>
                    </DialogHeader>
                    {reschedulingSession && (
                        <Form
                            action={`/schedules/${reschedulingSession.id}/reschedule-requests`}
                            method="post"
                            onSuccess={() => {
                                setReschedulingSession(null);
                                toast.success('Permintaan reschedule dikirim.');
                            }}
                            onError={() => {
                                toast.error(
                                    'Gagal mengirim permintaan reschedule.',
                                );
                            }}
                            className="space-y-4"
                        >
                            {({ errors, processing }) => (
                                <>
                                    <div className="rounded-lg border p-3 text-sm">
                                        <p className="font-medium">
                                            {reschedulingSession.title}
                                        </p>
                                        <p className="mt-1 text-muted-foreground">
                                            Saat ini: {reschedulingSession.time}
                                        </p>
                                        <p className="text-muted-foreground">
                                            Mentor: {reschedulingSession.mentor}
                                        </p>
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="reason">Alasan</Label>
                                        <Select name="reason" required>
                                            <SelectTrigger id="reason">
                                                <SelectValue placeholder="Pilih alasan" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {rescheduleReasons.map(
                                                    (reason) => (
                                                        <SelectItem
                                                            key={reason}
                                                            value={reason}
                                                        >
                                                            {reason}
                                                        </SelectItem>
                                                    ),
                                                )}
                                            </SelectContent>
                                        </Select>
                                        <InputError message={errors.reason} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="requested_scheduled_at">
                                            Jadwal baru
                                        </Label>
                                        <Select
                                            name="requested_scheduled_at"
                                            required
                                        >
                                            <SelectTrigger id="requested_scheduled_at">
                                                <SelectValue placeholder="Pilih slot tersedia" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {reschedulingSession
                                                    .rescheduleSlots.length >
                                                0 ? (
                                                    reschedulingSession.rescheduleSlots.map(
                                                        (slot) => (
                                                            <SelectItem
                                                                key={slot.value}
                                                                value={
                                                                    slot.value
                                                                }
                                                            >
                                                                {slot.label}
                                                            </SelectItem>
                                                        ),
                                                    )
                                                ) : (
                                                    <SelectItem
                                                        value="none"
                                                        disabled
                                                    >
                                                        Belum ada slot tersedia
                                                    </SelectItem>
                                                )}
                                            </SelectContent>
                                        </Select>
                                        <InputError
                                            message={
                                                errors.requested_scheduled_at
                                            }
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="notes">
                                            Catatan opsional
                                        </Label>
                                        <Textarea
                                            id="notes"
                                            name="notes"
                                            rows={3}
                                            placeholder="Tambahkan konteks singkat untuk admin"
                                        />
                                        <InputError message={errors.notes} />
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={
                                            processing ||
                                            reschedulingSession.rescheduleSlots
                                                .length === 0
                                        }
                                        className="w-full"
                                    >
                                        {processing
                                            ? 'Mengirim...'
                                            : 'Kirim permintaan'}
                                    </Button>
                                </>
                            )}
                        </Form>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}

StudentSchedules.layout = {
    breadcrumbs: [
        {
            title: 'Schedules',
            href: '/schedules',
        },
    ],
};
