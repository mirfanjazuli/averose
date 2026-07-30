import { Form, Head } from '@inertiajs/react';
import {
    ArrowUpRight,
    CalendarIcon,
    Clock3,
    Eye,
    MessageSquareText,
    Pencil,
    Repeat2,
    Search,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { ActionMenu } from '@/components/admin/action-menu';
import { TablePagination } from '@/components/admin/table-pagination';
import InputError from '@/components/input-error';
import { JournalAttachmentList } from '@/components/journal-attachment-list';
import type { JournalAttachment } from '@/components/journal-attachment-list';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenuItem,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useClientPagination } from '@/hooks/use-client-pagination';
import {
    formatBadgeLabel,
    getBadgeProps,
    getStatusBadgeTone,
} from '@/lib/badge';
import { ScheduleFeedbackDialog } from '@/pages/student/schedules/components/schedule-feedback-dialog';
import { StudentBookSessionDialog } from '@/pages/student/schedules/components/student-book-session-dialog';
import type { BookingSubjectOption } from '@/pages/student/schedules/components/student-book-session-dialog';

const rescheduleReasons = [
    'Sakit',
    'Bentrok sekolah/kampus',
    'Kegiatan keluarga',
    'Kendala internet/perangkat',
    'Lainnya',
];

type StudentSession = {
    attachments: JournalAttachment[];
    canRequestReschedule: boolean;
    canGiveFeedback: boolean;
    deliveryMode: string;
    endAt: string;
    feedback: {
        audioQualityRating: number;
        comment: string | null;
        interactivityRating: number;
        materialClarityRating: number;
        visualQualityRating: number;
    } | null;
    id: string;
    mentor: string;
    mentorRating: number | null;
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
    time: string;
    title: string;
    zoomLink: string | null;
};

function formatSessionTimeRange(startAt: string, endAt: string) {
    const formatter = new Intl.DateTimeFormat('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
    });

    return `${formatter.format(new Date(startAt))} - ${formatter.format(
        new Date(endAt),
    )} WIB`;
}

function formatSessionDateLabel(dateValue: string) {
    return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    }).format(new Date(dateValue));
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

function dateKey(dateValue: Date) {
    return [
        dateValue.getFullYear(),
        String(dateValue.getMonth() + 1).padStart(2, '0'),
        String(dateValue.getDate()).padStart(2, '0'),
    ].join('-');
}

function selectedDateLabel(dateValue: string) {
    if (!dateValue) {
        return 'Pilih tanggal';
    }

    return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'short',
        weekday: 'short',
        year: 'numeric',
    }).format(new Date(`${dateValue}T00:00:00`));
}

function addMinutes(time: string, minutes: number) {
    const [hour, minute] = time.split(':').map(Number);
    const totalMinutes = hour * 60 + minute + minutes;
    const endHour = Math.floor(totalMinutes / 60)
        .toString()
        .padStart(2, '0');
    const endMinute = (totalMinutes % 60).toString().padStart(2, '0');

    return `${endHour}:${endMinute}`;
}

function sessionDurationMinutes(session: StudentSession | null) {
    if (!session) {
        return 60;
    }

    return Math.max(
        1,
        Math.round(
            (new Date(session.endAt).getTime() -
                new Date(session.startAt).getTime()) /
                60000,
        ),
    );
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
    const [rescheduleDateTime, setRescheduleDateTime] = useState('');
    const [rescheduleNotes, setRescheduleNotes] = useState('');
    const [rescheduleReason, setRescheduleReason] = useState('');
    const [feedbackSession, setFeedbackSession] =
        useState<StudentSession | null>(null);
    const [detailSession, setDetailSession] = useState<StudentSession | null>(
        null,
    );
    const [bookingOpen, setBookingOpen] = useState(false);
    const [feedbackOpen, setFeedbackOpen] = useState(false);
    const [feedbackReminderOpen, setFeedbackReminderOpen] = useState(false);

    const openFeedbackDialog = (session: StudentSession) => {
        setFeedbackReminderOpen(false);
        setFeedbackSession(session);
        setFeedbackOpen(true);
    };
    const resetRescheduleForm = () => {
        setRescheduleDateTime('');
        setRescheduleNotes('');
        setRescheduleReason('');
    };
    const currentRescheduleDateLabel = reschedulingSession
        ? formatSessionDateLabel(reschedulingSession.startAt)
        : '';
    const currentRescheduleTimeLabel = reschedulingSession
        ? `${formatSessionTimeRange(
              reschedulingSession.startAt,
              reschedulingSession.endAt,
          )}`
        : '';
    const [newRescheduleDate, newRescheduleTime] = rescheduleDateTime
        ? rescheduleDateTime.split('T')
        : ['', ''];
    const newRescheduleTimeLabel =
        newRescheduleTime && reschedulingSession
            ? `${newRescheduleTime} - ${addMinutes(
                  newRescheduleTime,
                  sessionDurationMinutes(reschedulingSession),
              )} WIB`
            : '';

    const canBookSession = subjects.some(
        (subject) =>
            Boolean(subject.enrollmentId) && subject.sessionsRemaining !== 0,
    );
    const primaryPendingFeedback =
        sessions.find((session) => session.canGiveFeedback) ?? null;
    const requestBooking = () => {
        if (primaryPendingFeedback) {
            setFeedbackReminderOpen(true);

            return;
        }

        setBookingOpen(true);
    };
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
                session.deliveryMode,
                session.time,
                session.status,
            ].some((value) => value.toLowerCase().includes(normalizedSearch)),
        );
    }, [searchQuery, sessions]);
    const {
        changeRowsPerPage,
        firstItemIndex,
        goToPage,
        resetPage,
        rowsPerPage,
        safeCurrentPage,
        totalPages,
        visibleItems: visibleSessions,
    } = useClientPagination({ items: filteredSessions });
    const renderSessionActions = (session: StudentSession) => {
        const canEdit = session.status === 'Pending';
        const canReschedule = ['Assigned', 'Rescheduled'].includes(
            session.status,
        );
        const hasPrimaryActions =
            session.canGiveFeedback || canEdit || canReschedule;

        return (
            <ActionMenu label="Buka aksi jadwal">
                {session.canGiveFeedback ? (
                    <DropdownMenuItem
                        onClick={() => openFeedbackDialog(session)}
                    >
                        <MessageSquareText className="size-4" />
                        Nilai sesi
                    </DropdownMenuItem>
                ) : null}
                {canEdit ? (
                    <DropdownMenuItem
                        onClick={() => setEditingSession(session)}
                    >
                        <Pencil className="size-4" />
                        Edit
                    </DropdownMenuItem>
                ) : null}
                {canReschedule ? (
                    <DropdownMenuItem
                        disabled={!session.canRequestReschedule}
                        onClick={() => setReschedulingSession(session)}
                    >
                        <Repeat2 className="size-4" />
                        Reschedule
                    </DropdownMenuItem>
                ) : null}
                {hasPrimaryActions && <DropdownMenuSeparator />}
                <DropdownMenuItem onClick={() => setDetailSession(session)}>
                    <Eye className="size-4" />
                    Lihat detail
                </DropdownMenuItem>
            </ActionMenu>
        );
    };

    return (
        <>
            <Head title="Schedules" />
            <div className="flex h-full max-w-full min-w-0 flex-1 flex-col gap-8 py-4 text-[#102a3a] md:gap-10 md:py-6">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h1 className="font-heading text-2xl leading-tight font-semibold tracking-tight text-[#102a3a] md:text-4xl">
                            Jadwal belajar
                        </h1>
                        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#526b7b]">
                            Kelola jadwal, reschedule, dan sesi yang akan
                            datang.
                        </p>
                    </div>
                    <div className="shrink-0">
                        {canBookSession ? (
                            <>
                                <Button
                                    className="w-full gap-2 rounded-2xl bg-[#d9a441] text-[#102a3a] shadow-lg shadow-[#d9a441]/20 hover:bg-[#c89532] sm:w-auto"
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
                                className="w-full rounded-2xl bg-[#d9a441] text-[#102a3a] shadow-lg shadow-[#d9a441]/20 hover:bg-[#c89532] sm:w-auto"
                            >
                                <a href="/enrollments">Lihat paket belajar</a>
                            </Button>
                        )}
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="flex justify-end">
                        <div className="flex h-10 w-full items-center gap-2 rounded-xl border border-[#dcece7] bg-white px-3 text-sm text-[#526b7b] shadow-sm shadow-[#102a3a]/[0.03] sm:w-72">
                            <Search className="size-4" />
                            <Input
                                value={searchQuery}
                                onChange={(event) => {
                                    setSearchQuery(event.target.value);
                                    resetPage();
                                }}
                                placeholder="Cari sesi..."
                                className="h-auto border-0 bg-transparent px-0 py-0 shadow-none focus-visible:ring-0"
                            />
                        </div>
                    </div>
                    {filteredSessions.length > 0 ? (
                        <>
                            <div className="divide-y divide-[#edf3f1] overflow-hidden rounded-md bg-white shadow-sm ring-1 shadow-[#102a3a]/[0.03] ring-[#dcece7] md:hidden">
                                {visibleSessions.map((session) => (
                                    <div
                                        key={session.id}
                                        className="space-y-3 px-4 py-4"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-semibold text-[#102a3a]">
                                                    {session.title}
                                                </p>
                                                <p className="mt-0.5 truncate text-sm text-[#526b7b]">
                                                    {session.mentor}
                                                </p>
                                            </div>
                                            {renderSessionActions(session)}
                                        </div>

                                        <div className="flex items-center justify-between gap-3 text-sm">
                                            <span className="text-[#526b7b]">
                                                {formatSessionDateLabel(
                                                    session.startAt,
                                                )}
                                            </span>
                                            <span className="font-semibold text-[#0f8f7a] tabular-nums">
                                                {formatSessionTimeRange(
                                                    session.startAt,
                                                    session.endAt,
                                                )}
                                            </span>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2">
                                            <Badge
                                                variant="outline"
                                                className="rounded-full"
                                            >
                                                {formatBadgeLabel(
                                                    session.deliveryMode,
                                                )}
                                            </Badge>
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
                                                <Badge
                                                    variant="outline"
                                                    className="rounded-full border-amber-200 bg-amber-50 px-2.5 text-amber-700"
                                                >
                                                    Menunggu admin
                                                </Badge>
                                            ) : null}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="hidden overflow-hidden rounded-md bg-white shadow-sm ring-1 shadow-[#102a3a]/[0.03] ring-[#dcece7] md:block">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="hover:bg-transparent">
                                            <TableHead>
                                                Mata pelajaran
                                            </TableHead>
                                            <TableHead>Tanggal</TableHead>
                                            <TableHead>Jam</TableHead>
                                            <TableHead>Mentor</TableHead>
                                            <TableHead>Delivery</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="w-12 text-right" />
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {visibleSessions.map((session) => (
                                            <TableRow
                                                key={session.id}
                                                className="hover:bg-[#f8fbfa]"
                                            >
                                                <TableCell>
                                                    <div className="max-w-72 min-w-0">
                                                        <p className="truncate font-semibold text-[#102a3a]">
                                                            {session.title}
                                                        </p>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="font-medium text-[#102a3a]">
                                                    {formatSessionDateLabel(
                                                        session.startAt,
                                                    )}
                                                </TableCell>
                                                <TableCell className="font-semibold text-[#0f8f7a] tabular-nums">
                                                    {formatSessionTimeRange(
                                                        session.startAt,
                                                        session.endAt,
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-[#526b7b]">
                                                    {session.mentor}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">
                                                        {formatBadgeLabel(
                                                            session.deliveryMode,
                                                        )}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col items-start gap-1.5">
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
                                                            <div className="min-w-0">
                                                                <Badge
                                                                    variant="outline"
                                                                    className="w-fit rounded-full border-amber-200 bg-amber-50 px-2.5 text-amber-700"
                                                                >
                                                                    Menunggu
                                                                    admin
                                                                </Badge>
                                                                <p className="mt-1 max-w-40 truncate text-xs text-[#526b7b]">
                                                                    {
                                                                        session
                                                                            .rescheduleRequest
                                                                            .requested
                                                                    }
                                                                </p>
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {renderSessionActions(
                                                        session,
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                            <TablePagination
                                entity="sessions"
                                firstItemIndex={firstItemIndex}
                                onPageChange={goToPage}
                                onRowsPerPageChange={changeRowsPerPage}
                                rowsPerPage={rowsPerPage}
                                safeCurrentPage={safeCurrentPage}
                                totalItems={filteredSessions.length}
                                totalPages={totalPages}
                            />
                        </>
                    ) : (
                        <div className="rounded-md border border-dashed border-[#dcece7] bg-white p-8 text-center text-sm text-[#526b7b]">
                            Tidak ada sesi yang cocok.
                        </div>
                    )}
                </div>
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
                        resetRescheduleForm();
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Ajukan reschedule</DialogTitle>
                        <DialogDescription>
                            Admin akan meninjau permintaanmu.
                        </DialogDescription>
                    </DialogHeader>
                    {reschedulingSession && (
                        <Form
                            action={`/schedules/${reschedulingSession.id}/reschedule-requests`}
                            method="post"
                            onSuccess={() => {
                                setReschedulingSession(null);
                                resetRescheduleForm();
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
                                <div className="space-y-5">
                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between gap-3 text-xs font-semibold text-primary">
                                            <span className="min-w-0 truncate">
                                                {currentRescheduleDateLabel}
                                            </span>
                                            <span className="shrink-0 whitespace-nowrap tabular-nums">
                                                {currentRescheduleTimeLabel}
                                            </span>
                                        </div>
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-semibold">
                                                {reschedulingSession.title}
                                                <span className="font-normal text-muted-foreground">
                                                    {' '}
                                                    ·{' '}
                                                    {reschedulingSession.mentor}
                                                </span>
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="requested_scheduled_at">
                                                Jadwal baru
                                            </Label>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        id="requested_scheduled_at"
                                                        type="button"
                                                        variant="outline"
                                                        className="h-11 min-w-0 justify-start gap-2 rounded-xl bg-background text-left font-normal"
                                                    >
                                                        <CalendarIcon className="size-4 shrink-0" />
                                                        <span className="min-w-0 truncate">
                                                            {newRescheduleDate &&
                                                            newRescheduleTime
                                                                ? `${selectedDateLabel(
                                                                      newRescheduleDate,
                                                                  )} · ${newRescheduleTime}`
                                                                : 'Pilih tanggal dan jam'}
                                                        </span>
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent
                                                    align="start"
                                                    collisionPadding={16}
                                                    side="right"
                                                    sideOffset={8}
                                                    className="w-auto p-0"
                                                >
                                                    <div className="space-y-3 p-3">
                                                        <Calendar
                                                            mode="single"
                                                            selected={
                                                                newRescheduleDate
                                                                    ? new Date(
                                                                          `${newRescheduleDate}T00:00:00`,
                                                                      )
                                                                    : undefined
                                                            }
                                                            disabled={{
                                                                before: new Date(),
                                                            }}
                                                            onSelect={(
                                                                selectedDate,
                                                            ) => {
                                                                const nextDate =
                                                                    selectedDate
                                                                        ? dateKey(
                                                                              selectedDate,
                                                                          )
                                                                        : '';
                                                                setRescheduleDateTime(
                                                                    nextDate
                                                                        ? `${nextDate}T${newRescheduleTime}`
                                                                        : '',
                                                                );
                                                            }}
                                                            className="p-0"
                                                        />

                                                        <div className="grid gap-2 border-t pt-3">
                                                            <Label htmlFor="reschedule_time">
                                                                Jam mulai
                                                            </Label>
                                                            <div className="relative">
                                                                <Input
                                                                    id="reschedule_time"
                                                                    type="time"
                                                                    step="300"
                                                                    value={
                                                                        newRescheduleTime
                                                                    }
                                                                    disabled={
                                                                        !newRescheduleDate
                                                                    }
                                                                    onChange={(
                                                                        event,
                                                                    ) =>
                                                                        setRescheduleDateTime(
                                                                            newRescheduleDate
                                                                                ? `${newRescheduleDate}T${event.target.value}`
                                                                                : '',
                                                                        )
                                                                    }
                                                                    className="h-10 rounded-xl pr-10"
                                                                />
                                                                <Clock3 className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </PopoverContent>
                                            </Popover>
                                            <input
                                                type="hidden"
                                                name="requested_scheduled_at"
                                                value={
                                                    newRescheduleDate &&
                                                    newRescheduleTime
                                                        ? `${newRescheduleDate} ${newRescheduleTime}`
                                                        : ''
                                                }
                                            />
                                            {newRescheduleDate &&
                                            newRescheduleTime ? (
                                                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 rounded-xl bg-primary/5 px-3 py-2 text-sm text-primary">
                                                    <span className="min-w-0">
                                                        {selectedDateLabel(
                                                            newRescheduleDate,
                                                        )}
                                                    </span>
                                                    <span className="text-right font-semibold whitespace-nowrap tabular-nums">
                                                        {newRescheduleTimeLabel}
                                                    </span>
                                                </div>
                                            ) : null}
                                            <InputError
                                                message={
                                                    errors.requested_scheduled_at
                                                }
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="reason">
                                                Alasan
                                            </Label>
                                            <Select
                                                name="reason"
                                                value={rescheduleReason}
                                                required
                                                onValueChange={
                                                    setRescheduleReason
                                                }
                                            >
                                                <SelectTrigger
                                                    id="reason"
                                                    className="!h-11 w-full rounded-xl py-0"
                                                >
                                                    <SelectValue placeholder="Pilih alasan" />
                                                </SelectTrigger>
                                                <SelectContent className="p-1.5">
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
                                            <InputError
                                                message={errors.reason}
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="notes">
                                                Catatan
                                            </Label>
                                            <Textarea
                                                id="notes"
                                                name="notes"
                                                rows={3}
                                                required
                                                value={rescheduleNotes}
                                                onChange={(event) =>
                                                    setRescheduleNotes(
                                                        event.target.value,
                                                    )
                                                }
                                                placeholder="Tambahkan konteks singkat untuk admin"
                                                className="resize-none rounded-xl"
                                            />
                                            <InputError
                                                message={errors.notes}
                                            />
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={
                                            processing ||
                                            !rescheduleReason ||
                                            !rescheduleDateTime ||
                                            !rescheduleNotes.trim()
                                        }
                                        className="w-full rounded-xl"
                                    >
                                        {processing
                                            ? 'Mengirim...'
                                            : 'Kirim permintaan'}
                                    </Button>
                                </div>
                            )}
                        </Form>
                    )}
                </DialogContent>
            </Dialog>

            <ScheduleFeedbackDialog
                open={feedbackOpen}
                onOpenChange={setFeedbackOpen}
                session={feedbackSession}
            />

            <Dialog
                open={!!detailSession}
                onOpenChange={(open) => {
                    if (!open) {
                        setDetailSession(null);
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Detail sesi</DialogTitle>
                    </DialogHeader>
                    {detailSession && (
                        <div className="space-y-5">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div className="min-w-0">
                                    <p className="truncate font-heading text-xl font-semibold text-[#102a3a]">
                                        {detailSession.title}
                                    </p>
                                    <p className="mt-1 text-sm text-[#526b7b]">
                                        {detailSession.mentor}
                                    </p>
                                </div>
                                <Badge
                                    {...getBadgeProps(
                                        getStatusBadgeTone(
                                            detailSession.status,
                                        ),
                                        'w-fit',
                                    )}
                                >
                                    {formatBadgeLabel(detailSession.status)}
                                </Badge>
                            </div>

                            <div className="grid gap-3 text-sm sm:grid-cols-2">
                                <div>
                                    <p className="text-xs font-semibold tracking-wide text-[#526b7b] uppercase">
                                        Tanggal
                                    </p>
                                    <p className="mt-1 font-medium text-[#102a3a]">
                                        {formatSessionDateLabel(
                                            detailSession.startAt,
                                        )}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold tracking-wide text-[#526b7b] uppercase">
                                        Jam
                                    </p>
                                    <p className="mt-1 font-semibold text-[#0f8f7a] tabular-nums">
                                        {formatSessionTimeRange(
                                            detailSession.startAt,
                                            detailSession.endAt,
                                        )}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold tracking-wide text-[#526b7b] uppercase">
                                        Program
                                    </p>
                                    <p className="mt-1 font-medium text-[#102a3a]">
                                        {detailSession.program}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold tracking-wide text-[#526b7b] uppercase">
                                        Durasi
                                    </p>
                                    <p className="mt-1 font-medium text-[#102a3a]">
                                        {sessionDurationMinutes(detailSession)}{' '}
                                        menit
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold tracking-wide text-[#526b7b] uppercase">
                                        Delivery
                                    </p>
                                    <p className="mt-1 font-medium text-[#102a3a]">
                                        {formatBadgeLabel(
                                            detailSession.deliveryMode,
                                        )}
                                    </p>
                                </div>
                            </div>

                            {detailSession.attachments.length > 0 && (
                                <div className="space-y-3">
                                    <p className="font-medium text-[#102a3a]">
                                        Materi sesi
                                    </p>
                                    <JournalAttachmentList
                                        attachments={detailSession.attachments}
                                    />
                                </div>
                            )}

                            {detailSession.rescheduleRequest ? (
                                <div className="rounded-md bg-[#f8fbfa] px-4 py-3 text-sm">
                                    <p className="font-semibold text-[#102a3a]">
                                        Reschedule menunggu persetujuan
                                    </p>
                                    <p className="mt-1 text-[#526b7b]">
                                        {
                                            detailSession.rescheduleRequest
                                                .requested
                                        }
                                    </p>
                                </div>
                            ) : null}

                            {detailSession.feedback ? (
                                <div className="rounded-md bg-[#f8fbfa] px-4 py-3 text-sm">
                                    <p className="font-semibold text-[#102a3a]">
                                        Feedback sudah terkirim
                                    </p>
                                    {detailSession.feedback.comment ? (
                                        <p className="mt-1 text-[#526b7b]">
                                            {detailSession.feedback.comment}
                                        </p>
                                    ) : null}
                                </div>
                            ) : null}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

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
