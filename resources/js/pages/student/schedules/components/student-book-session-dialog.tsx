import { Form } from '@inertiajs/react';
import {
    ArrowUpRight,
    BookOpen,
    CalendarIcon,
    Check,
    Clock2Icon,
    Plus,
    Trash2,
} from 'lucide-react';
import { DynamicIcon } from 'lucide-react/dynamic';
import type { IconName } from 'lucide-react/dynamic';
import type { ReactNode } from 'react';
import { useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Field, FieldLabel } from '@/components/ui/field';
import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
} from '@/components/ui/input-group';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

export type BookingSubjectOption = {
    duration: number;
    enrollmentId: string | null;
    icon?: IconName | null;
    label: string;
    program: string | null;
    sessionsRemaining: number | null;
    subjectId: string;
    value: string;
};

type BookingSessionRow = {
    date: string;
    id: string;
    time: string;
};

type FlattenedBookingSession = BookingSessionRow & {
    enrollmentId: string | null;
    program: string | null;
    subjectId: string;
    subjectLabel: string;
};

type StudentBookSessionDialogProps = {
    onOpenChange?: (open: boolean) => void;
    open?: boolean;
    subjects: BookingSubjectOption[];
    trigger?: ReactNode;
};

const bookingSteps = [
    { label: 'Mata pelajaran' },
    { label: 'Jadwal' },
    { label: 'Tinjau' },
] as const;

function uid(prefix: string): string {
    return (
        globalThis.crypto?.randomUUID?.() ??
        `${prefix}-${Date.now()}-${Math.random()}`
    );
}

function addMinutes(time: string, minutes: number): string {
    const [hour, minute] = time.split(':').map(Number);
    const totalMinutes = hour * 60 + minute + minutes;
    const endHour = Math.floor(totalMinutes / 60)
        .toString()
        .padStart(2, '0');
    const endMinute = (totalMinutes % 60).toString().padStart(2, '0');

    return `${endHour}:${endMinute}`;
}

function dateKey(dateValue: Date): string {
    const year = dateValue.getFullYear();
    const month = String(dateValue.getMonth() + 1).padStart(2, '0');
    const day = String(dateValue.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

function selectedDateLabel(dateValue: string): string {
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

function createSessionRow(): BookingSessionRow {
    return {
        date: '',
        id: uid('session'),
        time: '',
    };
}

function DateTimePicker({
    date,
    disabledDate,
    id,
    onDateChange,
    onTimeChange,
    time,
}: {
    date: string;
    disabledDate: Date;
    id: string;
    onDateChange: (date: string) => void;
    onTimeChange: (time: string) => void;
    time: string;
}) {
    return (
        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_10rem]">
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        type="button"
                        variant="outline"
                        className={cn(
                            'h-11 w-full min-w-0 justify-start gap-2 rounded-xl bg-background text-left font-normal',
                            !date && 'text-muted-foreground',
                        )}
                    >
                        <CalendarIcon className="size-4 shrink-0" />
                        <span className="min-w-0 truncate">
                            {selectedDateLabel(date)}
                        </span>
                    </Button>
                </PopoverTrigger>
                <PopoverContent
                    align="start"
                    collisionPadding={16}
                    sideOffset={8}
                    className="max-h-[min(var(--radix-popover-content-available-height),calc(100vh-2rem))] w-auto overflow-y-auto p-0"
                >
                    <div className="p-3">
                        <Calendar
                            mode="single"
                            selected={
                                date ? new Date(`${date}T00:00:00`) : undefined
                            }
                            disabled={{ before: disabledDate }}
                            onSelect={(selectedDate) =>
                                onDateChange(
                                    selectedDate ? dateKey(selectedDate) : '',
                                )
                            }
                            className="p-0"
                        />
                    </div>
                </PopoverContent>
            </Popover>

            <Field>
                <FieldLabel htmlFor={id} className="sr-only">
                    Jam mulai
                </FieldLabel>
                <InputGroup className="h-11 rounded-xl">
                    <InputGroupInput
                        id={id}
                        type="time"
                        step="300"
                        value={time}
                        disabled={!date}
                        onChange={(event) => onTimeChange(event.target.value)}
                        className="appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                    />
                    <InputGroupAddon>
                        <Clock2Icon className="text-muted-foreground" />
                    </InputGroupAddon>
                </InputGroup>
            </Field>
        </div>
    );
}

export function StudentBookSessionDialog({
    onOpenChange,
    open,
    subjects,
    trigger,
}: StudentBookSessionDialogProps) {
    const submitAllowedRef = useRef(false);
    const [internalBookingOpen, setInternalBookingOpen] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [selectedSubjectValue, setSelectedSubjectValue] = useState('');
    const [sessions, setSessions] = useState<BookingSessionRow[]>(() => [
        createSessionRow(),
    ]);
    const today = useMemo(() => {
        const date = new Date();

        date.setHours(0, 0, 0, 0);

        return date;
    }, []);
    const subjectsByProgram = useMemo(
        () =>
            subjects.reduce<Record<string, BookingSubjectOption[]>>(
                (groups, subject) => {
                    const program = subject.program ?? 'Tanpa program';

                    groups[program] = [...(groups[program] ?? []), subject];

                    return groups;
                },
                {},
            ),
        [subjects],
    );
    const selectedSubject = useMemo(
        () =>
            subjects.find((subject) => subject.value === selectedSubjectValue),
        [selectedSubjectValue, subjects],
    );
    const hasBookableSubjects = subjects.some(
        (subject) =>
            Boolean(subject.enrollmentId) && subject.sessionsRemaining !== 0,
    );
    const flattenedSessions = useMemo<FlattenedBookingSession[]>(
        () =>
            sessions.map((session) => ({
                ...session,
                enrollmentId: selectedSubject?.enrollmentId ?? null,
                program: selectedSubject?.program ?? null,
                subjectId: selectedSubject?.subjectId ?? '',
                subjectLabel: selectedSubject?.label ?? '',
            })),
        [selectedSubject, sessions],
    );
    const hasEnoughSessions =
        selectedSubject?.sessionsRemaining === null ||
        (selectedSubject?.sessionsRemaining ?? 0) >= sessions.length;
    const canAddSchedule =
        selectedSubject?.sessionsRemaining === null ||
        (selectedSubject?.sessionsRemaining ?? 0) > sessions.length;
    const hasCompleteSchedule =
        Boolean(selectedSubject) &&
        sessions.length > 0 &&
        sessions.every((session) => session.date && session.time);
    const canConfirm =
        hasCompleteSchedule &&
        Boolean(selectedSubject?.enrollmentId && selectedSubject?.subjectId) &&
        hasEnoughSessions;
    const canGoNext =
        currentStep === 0
            ? Boolean(selectedSubject)
            : hasCompleteSchedule && hasEnoughSessions;
    const bookingOpen = open ?? internalBookingOpen;
    const setBookingOpen = onOpenChange ?? setInternalBookingOpen;

    const resetBooking = () => {
        submitAllowedRef.current = false;
        setCurrentStep(0);
        setSelectedSubjectValue('');
        setSessions([createSessionRow()]);
    };

    const selectSubject = (subject: BookingSubjectOption) => {
        if (!subject.enrollmentId || subject.sessionsRemaining === 0) {
            return;
        }

        if (selectedSubjectValue === subject.value) {
            setSelectedSubjectValue('');
            setSessions([createSessionRow()]);

            return;
        }

        setSelectedSubjectValue(subject.value);
        setSessions([createSessionRow()]);
    };

    const updateSession = (
        sessionId: string,
        data: Partial<BookingSessionRow>,
    ) => {
        setSessions((currentSessions) =>
            currentSessions.map((session) =>
                session.id === sessionId
                    ? {
                          ...session,
                          ...data,
                      }
                    : session,
            ),
        );
    };

    const addSession = () => {
        if (
            selectedSubject?.sessionsRemaining !== null &&
            (selectedSubject?.sessionsRemaining ?? 0) <= sessions.length
        ) {
            return;
        }

        setSessions((currentSessions) => [
            ...currentSessions,
            createSessionRow(),
        ]);
    };

    const removeSession = (sessionId: string) => {
        setSessions((currentSessions) =>
            currentSessions.length === 1
                ? currentSessions
                : currentSessions.filter((session) => session.id !== sessionId),
        );
    };

    const goNext = () => {
        if (!canGoNext) {
            return;
        }

        setCurrentStep((step) => Math.min(step + 1, bookingSteps.length - 1));
    };

    return (
        <Dialog
            open={bookingOpen}
            onOpenChange={(open) => {
                setBookingOpen(open);

                if (!open) {
                    resetBooking();
                }
            }}
        >
            {trigger !== null ? (
                <DialogTrigger asChild>
                    {trigger ?? (
                        <Button
                            className="gap-2"
                            disabled={!hasBookableSubjects}
                        >
                            Jadwalkan sesi
                            <ArrowUpRight className="size-4" />
                        </Button>
                    )}
                </DialogTrigger>
            ) : null}
            <DialogContent className="flex h-[92vh] max-h-[92vh] flex-col overflow-hidden p-0 sm:max-w-4xl">
                <DialogHeader className="shrink-0">
                    <DialogTitle className="px-6 pt-6">
                        Jadwalkan sesi belajar
                    </DialogTitle>
                    <DialogDescription>
                        <span className="block px-6">
                            {hasBookableSubjects
                                ? 'Pilih mata pelajaran, tentukan jadwal, lalu tinjau sebelum dikonfirmasi.'
                                : 'Kamu perlu memiliki program aktif sebelum menjadwalkan sesi.'}
                        </span>
                    </DialogDescription>
                </DialogHeader>

                {!hasBookableSubjects ? (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center">
                        <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <BookOpen className="size-5" />
                        </div>
                        <p className="mt-4 font-medium">
                            Belum ada program aktif
                        </p>
                        <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
                            Kamu perlu terdaftar di program terlebih dahulu
                            sebelum bisa memilih mata pelajaran dan menjadwalkan
                            sesi belajar.
                        </p>
                    </div>
                ) : (
                    <Form
                        action="/schedules"
                        method="post"
                        disableWhileProcessing
                        onSuccess={() => {
                            toast.success('Sesi berhasil dijadwalkan.');
                            setBookingOpen(false);
                            resetBooking();
                        }}
                        onError={() => {
                            submitAllowedRef.current = false;
                        }}
                        onSubmitCapture={(event) => {
                            if (submitAllowedRef.current) {
                                window.setTimeout(() => {
                                    submitAllowedRef.current = false;
                                }, 0);

                                return;
                            }

                            event.preventDefault();
                            event.stopPropagation();

                            if (
                                currentStep < bookingSteps.length - 1 &&
                                canGoNext
                            ) {
                                goNext();
                            }
                        }}
                        className="flex min-h-0 flex-1 flex-col overflow-hidden"
                    >
                        {({ errors, processing }) => (
                            <>
                                <div className="min-h-0 flex-1 px-6 pb-2">
                                    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border bg-background">
                                        <div className="border-b bg-muted/20 p-4">
                                            <div className="grid grid-cols-3 gap-3">
                                                {bookingSteps.map(
                                                    (step, index) => {
                                                        const isActive =
                                                            currentStep ===
                                                            index;
                                                        const isCompleted =
                                                            currentStep > index;

                                                        return (
                                                            <button
                                                                key={step.label}
                                                                type="button"
                                                                className="min-w-0 text-left"
                                                                disabled={
                                                                    index >
                                                                        currentStep &&
                                                                    !canGoNext
                                                                }
                                                                onClick={() => {
                                                                    if (
                                                                        index <=
                                                                        currentStep
                                                                    ) {
                                                                        setCurrentStep(
                                                                            index,
                                                                        );
                                                                    }
                                                                }}
                                                            >
                                                                <span
                                                                    className={cn(
                                                                        'block h-1 rounded-full bg-muted',
                                                                        (isActive ||
                                                                            isCompleted) &&
                                                                            'bg-[#0f8f7a]',
                                                                    )}
                                                                />
                                                                <span className="mt-3 flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                                                                    <span
                                                                        className={cn(
                                                                            'flex size-6 items-center justify-center rounded-full bg-muted text-[11px]',
                                                                            isActive &&
                                                                                'bg-[#0f8f7a] text-white',
                                                                            isCompleted &&
                                                                                'bg-[#e4f5f0] text-[#0f8f7a]',
                                                                        )}
                                                                    >
                                                                        {isCompleted ? (
                                                                            <Check className="size-3.5" />
                                                                        ) : (
                                                                            index +
                                                                            1
                                                                        )}
                                                                    </span>
                                                                    <span
                                                                        className={cn(
                                                                            isActive &&
                                                                                'text-[#102a3a]',
                                                                        )}
                                                                    >
                                                                        {
                                                                            step.label
                                                                        }
                                                                    </span>
                                                                </span>
                                                            </button>
                                                        );
                                                    },
                                                )}
                                            </div>
                                        </div>

                                        <div className="min-h-0 flex-1 p-4 sm:p-5">
                                            {currentStep === 0 && (
                                                <div className="space-y-4">
                                                    <div className="flex items-center justify-between gap-3">
                                                        <p className="text-sm font-medium">
                                                            Pilih 1 mata
                                                            pelajaran
                                                        </p>
                                                        <span className="text-xs text-muted-foreground">
                                                            {subjects.length}{' '}
                                                            opsi
                                                        </span>
                                                    </div>

                                                    <div className="space-y-5">
                                                        {Object.entries(
                                                            subjectsByProgram,
                                                        ).map(
                                                            ([
                                                                program,
                                                                programSubjects,
                                                            ]) => (
                                                                <div
                                                                    key={
                                                                        program
                                                                    }
                                                                    className="space-y-3"
                                                                >
                                                                    <p className="text-xs font-medium text-muted-foreground uppercase">
                                                                        {
                                                                            program
                                                                        }
                                                                    </p>
                                                                    <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
                                                                        {programSubjects.map(
                                                                            (
                                                                                subject,
                                                                            ) => {
                                                                                const checked =
                                                                                    selectedSubjectValue ===
                                                                                    subject.value;
                                                                                const disabled =
                                                                                    !subject.enrollmentId ||
                                                                                    subject.sessionsRemaining ===
                                                                                        0;

                                                                                return (
                                                                                    <button
                                                                                        key={
                                                                                            subject.value
                                                                                        }
                                                                                        type="button"
                                                                                        disabled={
                                                                                            disabled
                                                                                        }
                                                                                        onClick={() =>
                                                                                            selectSubject(
                                                                                                subject,
                                                                                            )
                                                                                        }
                                                                                        className={cn(
                                                                                            'flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-xl border bg-background p-3 text-center transition-colors',
                                                                                            checked
                                                                                                ? 'border-[#0f8f7a] bg-[#edf7f4] shadow-sm'
                                                                                                : 'border-border hover:border-[#0f8f7a]/40',
                                                                                            disabled &&
                                                                                                'cursor-not-allowed opacity-50',
                                                                                        )}
                                                                                    >
                                                                                        <span
                                                                                            className={cn(
                                                                                                'flex size-8 items-center justify-center rounded-lg bg-muted',
                                                                                                checked &&
                                                                                                    'bg-white text-[#0f8f7a]',
                                                                                            )}
                                                                                        >
                                                                                            <DynamicIcon
                                                                                                name={
                                                                                                    subject.icon ??
                                                                                                    'book-open'
                                                                                                }
                                                                                                fallback={() => (
                                                                                                    <BookOpen className="size-4" />
                                                                                                )}
                                                                                                className="size-4"
                                                                                            />
                                                                                        </span>
                                                                                        <p className="line-clamp-2 text-xs leading-snug font-semibold">
                                                                                            {
                                                                                                subject.label
                                                                                            }
                                                                                        </p>
                                                                                    </button>
                                                                                );
                                                                            },
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ),
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {currentStep === 1 &&
                                                selectedSubject && (
                                                    <ScrollArea className="h-full min-h-0 pr-3">
                                                        <div className="space-y-4">
                                                            <div className="flex items-start justify-between gap-3">
                                                                <div>
                                                                    <p className="text-sm font-medium">
                                                                        Pilih
                                                                        tanggal
                                                                        dan jam
                                                                    </p>
                                                                </div>
                                                                {selectedSubject.sessionsRemaining !==
                                                                    null && (
                                                                    <Badge
                                                                        variant="outline"
                                                                        className="rounded-full"
                                                                    >
                                                                        {
                                                                            selectedSubject.sessionsRemaining
                                                                        }{' '}
                                                                        sesi
                                                                        tersisa
                                                                    </Badge>
                                                                )}
                                                            </div>

                                                            <div className="grid gap-2">
                                                                {sessions.map(
                                                                    (
                                                                        session,
                                                                        sessionIndex,
                                                                    ) => {
                                                                        const endTime =
                                                                            session.time
                                                                                ? addMinutes(
                                                                                      session.time,
                                                                                      selectedSubject.duration,
                                                                                  )
                                                                                : '';
                                                                        const dateError =
                                                                            errors[
                                                                                `sessions.${sessionIndex}.date`
                                                                            ];
                                                                        const timeError =
                                                                            errors[
                                                                                `sessions.${sessionIndex}.time`
                                                                            ];

                                                                        return (
                                                                            <div
                                                                                key={
                                                                                    session.id
                                                                                }
                                                                                className="grid gap-3 rounded-xl bg-muted/35 p-3 md:grid-cols-[minmax(0,1fr)_auto]"
                                                                            >
                                                                                <div className="space-y-2">
                                                                                    <div className="flex items-center justify-between gap-2">
                                                                                        <p className="text-xs font-medium text-muted-foreground">
                                                                                            Sesi{' '}
                                                                                            {sessionIndex +
                                                                                                1}
                                                                                        </p>
                                                                                        {endTime && (
                                                                                            <span className="text-xs text-muted-foreground">
                                                                                                Selesai{' '}
                                                                                                {
                                                                                                    endTime
                                                                                                }
                                                                                            </span>
                                                                                        )}
                                                                                    </div>
                                                                                    <DateTimePicker
                                                                                        id={`session-time-${session.id}`}
                                                                                        date={
                                                                                            session.date
                                                                                        }
                                                                                        time={
                                                                                            session.time
                                                                                        }
                                                                                        disabledDate={
                                                                                            today
                                                                                        }
                                                                                        onDateChange={(
                                                                                            date,
                                                                                        ) =>
                                                                                            updateSession(
                                                                                                session.id,
                                                                                                {
                                                                                                    date,
                                                                                                },
                                                                                            )
                                                                                        }
                                                                                        onTimeChange={(
                                                                                            time,
                                                                                        ) =>
                                                                                            updateSession(
                                                                                                session.id,
                                                                                                {
                                                                                                    time,
                                                                                                },
                                                                                            )
                                                                                        }
                                                                                    />
                                                                                    {(dateError ||
                                                                                        timeError) && (
                                                                                        <p className="text-xs text-destructive">
                                                                                            {dateError ??
                                                                                                timeError}
                                                                                        </p>
                                                                                    )}
                                                                                </div>
                                                                                <div className="flex items-end justify-end">
                                                                                    <Button
                                                                                        type="button"
                                                                                        variant="ghost"
                                                                                        size="icon"
                                                                                        className="rounded-full"
                                                                                        disabled={
                                                                                            sessions.length ===
                                                                                            1
                                                                                        }
                                                                                        onClick={() =>
                                                                                            removeSession(
                                                                                                session.id,
                                                                                            )
                                                                                        }
                                                                                    >
                                                                                        <Trash2 className="size-4" />
                                                                                        <span className="sr-only">
                                                                                            Hapus
                                                                                            sesi
                                                                                        </span>
                                                                                    </Button>
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    },
                                                                )}
                                                            </div>

                                                            {canAddSchedule && (
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="w-full gap-2 rounded-xl sm:w-auto"
                                                                    onClick={
                                                                        addSession
                                                                    }
                                                                >
                                                                    <Plus className="size-4" />
                                                                    Tambah
                                                                    jadwal
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </ScrollArea>
                                                )}

                                            {currentStep === 2 &&
                                                selectedSubject && (
                                                    <div className="flex h-full min-h-0 flex-col gap-4">
                                                        <div className="shrink-0">
                                                            <p className="text-sm font-medium">
                                                                {
                                                                    selectedSubject.label
                                                                }
                                                            </p>
                                                            <p className="mt-1 text-sm text-muted-foreground">
                                                                {
                                                                    sessions.length
                                                                }{' '}
                                                                sesi siap
                                                                dijadwalkan
                                                            </p>
                                                        </div>

                                                        <ScrollArea className="min-h-0 flex-1">
                                                            <Table>
                                                                <TableHeader>
                                                                    <TableRow>
                                                                        <TableHead className="h-11">
                                                                            Sesi
                                                                        </TableHead>
                                                                        <TableHead className="h-11">
                                                                            Tanggal
                                                                        </TableHead>
                                                                        <TableHead className="h-11">
                                                                            Jam
                                                                        </TableHead>
                                                                    </TableRow>
                                                                </TableHeader>
                                                                <TableBody>
                                                                    {flattenedSessions.map(
                                                                        (
                                                                            session,
                                                                            index,
                                                                        ) => (
                                                                            <TableRow
                                                                                key={
                                                                                    session.id
                                                                                }
                                                                            >
                                                                                <TableCell className="py-3 font-medium">
                                                                                    {index +
                                                                                        1}
                                                                                </TableCell>
                                                                                <TableCell className="py-3">
                                                                                    {session.date
                                                                                        ? selectedDateLabel(
                                                                                              session.date,
                                                                                          )
                                                                                        : 'Belum ada tanggal'}
                                                                                </TableCell>
                                                                                <TableCell className="py-3">
                                                                                    {session.time
                                                                                        ? `${session.time} - ${addMinutes(
                                                                                              session.time,
                                                                                              selectedSubject.duration,
                                                                                          )} WIB`
                                                                                        : 'Belum ada jam'}
                                                                                </TableCell>
                                                                            </TableRow>
                                                                        ),
                                                                    )}
                                                                </TableBody>
                                                            </Table>
                                                        </ScrollArea>
                                                    </div>
                                                )}
                                        </div>
                                    </div>

                                    {(errors.sessions ||
                                        errors.subject_id ||
                                        errors.program_enrollment_id) && (
                                        <p className="px-6 pb-5 text-sm text-destructive">
                                            {errors.sessions ??
                                                errors.subject_id ??
                                                errors.program_enrollment_id}
                                        </p>
                                    )}
                                </div>

                                <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 bg-background/95 px-6 pt-3 pb-4 backdrop-blur">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        disabled={currentStep === 0}
                                        onClick={() =>
                                            setCurrentStep((step) =>
                                                Math.max(step - 1, 0),
                                            )
                                        }
                                    >
                                        Kembali
                                    </Button>
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() =>
                                                setBookingOpen(false)
                                            }
                                        >
                                            Batal
                                        </Button>
                                        {currentStep <
                                        bookingSteps.length - 1 ? (
                                            <Button
                                                type="button"
                                                disabled={!canGoNext}
                                                onClick={goNext}
                                            >
                                                Lanjut
                                            </Button>
                                        ) : (
                                            <Button
                                                type="submit"
                                                disabled={
                                                    !canConfirm || processing
                                                }
                                                onClick={() => {
                                                    submitAllowedRef.current = true;
                                                }}
                                            >
                                                {processing
                                                    ? 'Menjadwalkan...'
                                                    : `Konfirmasi ${sessions.length} sesi`}
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                <div hidden>
                                    {flattenedSessions.map((session, index) => (
                                        <div key={session.id}>
                                            <input
                                                type="hidden"
                                                name={`sessions[${index}][date]`}
                                                value={session.date}
                                            />
                                            <input
                                                type="hidden"
                                                name={`sessions[${index}][time]`}
                                                value={session.time}
                                            />
                                            <input
                                                type="hidden"
                                                name={`sessions[${index}][program_enrollment_id]`}
                                                value={
                                                    session.enrollmentId ?? ''
                                                }
                                            />
                                            <input
                                                type="hidden"
                                                name={`sessions[${index}][subject_id]`}
                                                value={session.subjectId}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </Form>
                )}
            </DialogContent>
        </Dialog>
    );
}
