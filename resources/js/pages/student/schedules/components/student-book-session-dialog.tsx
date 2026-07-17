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
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
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
    subjects: BookingSubjectOption[];
    trigger?: ReactNode;
};

const bookingSteps = [
    { label: 'Subject' },
    { label: 'Schedule' },
    { label: 'Review' },
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
        return 'Pick date';
    }

    return new Intl.DateTimeFormat('en-US', {
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

function dateTimeLabel(dateValue: string, timeValue: string): string {
    if (!dateValue && !timeValue) {
        return 'Pick date & time';
    }

    if (!dateValue) {
        return timeValue;
    }

    return `${selectedDateLabel(dateValue)}${timeValue ? ` · ${timeValue}` : ''}`;
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
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    className={cn(
                        'h-11 w-full justify-start rounded-xl bg-background text-left font-normal',
                        !date && !time && 'text-muted-foreground',
                    )}
                >
                    <CalendarIcon className="size-4" />
                    {dateTimeLabel(date, time)}
                </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-auto p-0">
                <Card size="sm" className="w-fit gap-0 rounded-xl py-0">
                    <CardContent className="p-3">
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
                    </CardContent>
                    <CardFooter className="border-t bg-card p-3">
                        <FieldGroup className="w-full">
                            <Field>
                                <FieldLabel htmlFor={id}>Start time</FieldLabel>
                                <InputGroup>
                                    <InputGroupInput
                                        id={id}
                                        type="time"
                                        step="300"
                                        value={time}
                                        disabled={!date}
                                        onChange={(event) =>
                                            onTimeChange(event.target.value)
                                        }
                                        className="appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                                    />
                                    <InputGroupAddon>
                                        <Clock2Icon className="text-muted-foreground" />
                                    </InputGroupAddon>
                                </InputGroup>
                            </Field>
                        </FieldGroup>
                    </CardFooter>
                </Card>
            </PopoverContent>
        </Popover>
    );
}

export function StudentBookSessionDialog({
    subjects,
    trigger,
}: StudentBookSessionDialogProps) {
    const submitAllowedRef = useRef(false);
    const [bookingOpen, setBookingOpen] = useState(false);
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
                    const program = subject.program ?? 'No program';

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
    const totalDuration = selectedSubject
        ? selectedSubject.duration * sessions.length
        : 0;

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
            <DialogTrigger asChild>
                {trigger ?? (
                    <Button className="gap-2" disabled={!hasBookableSubjects}>
                        Book session
                        <ArrowUpRight className="size-4" />
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="scrollbar-stable max-h-[92vh] overflow-y-auto sm:max-w-5xl">
                <DialogHeader>
                    <DialogTitle>Book sessions</DialogTitle>
                    <DialogDescription>
                        {hasBookableSubjects
                            ? 'Select one subject, arrange schedules, then review before confirming.'
                            : 'You need an active program before booking a session.'}
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
                            toast.success('Session booked.');
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
                        className="space-y-5"
                    >
                        {({ errors, processing }) => (
                            <>
                                <div className="overflow-hidden rounded-xl border">
                                    <div className="p-4">
                                        <div className="grid grid-cols-3 gap-5">
                                            {bookingSteps.map((step, index) => {
                                                const isActive =
                                                    currentStep === index;
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
                                                                    'bg-foreground',
                                                            )}
                                                        />
                                                        <span className="mt-3 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                                            {isCompleted && (
                                                                <Check className="size-3.5 text-primary" />
                                                            )}
                                                            <span
                                                                className={cn(
                                                                    isActive &&
                                                                        'text-foreground',
                                                                )}
                                                            >
                                                                {step.label}
                                                            </span>
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="border-t p-4">
                                        {currentStep === 0 && (
                                            <div className="space-y-5">
                                                <div>
                                                    <p className="text-sm font-medium">
                                                        Select subject
                                                    </p>
                                                </div>

                                                <div className="scrollbar-stable max-h-[56vh] space-y-5 overflow-y-auto pr-1">
                                                    {Object.entries(
                                                        subjectsByProgram,
                                                    ).map(
                                                        ([
                                                            program,
                                                            programSubjects,
                                                        ]) => (
                                                            <div
                                                                key={program}
                                                                className="space-y-3"
                                                            >
                                                                <p className="text-xs font-medium text-muted-foreground uppercase">
                                                                    {program}
                                                                </p>
                                                                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
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
                                                                                        'flex aspect-square w-full flex-col items-center justify-center gap-3 rounded-xl border bg-background p-4 text-center transition-colors',
                                                                                        checked
                                                                                            ? 'border-foreground bg-muted/35 shadow-sm'
                                                                                            : 'border-border hover:border-foreground/40',
                                                                                        disabled &&
                                                                                            'cursor-not-allowed opacity-50',
                                                                                    )}
                                                                                >
                                                                                    <span
                                                                                        className={cn(
                                                                                            'flex size-8 items-center justify-center rounded-lg bg-muted',
                                                                                            checked &&
                                                                                                'bg-primary/10 text-primary',
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
                                                                                    <p className="line-clamp-2 text-sm leading-snug font-medium">
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
                                                <div className="space-y-4">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div>
                                                            <p className="text-sm font-medium">
                                                                Add date & time
                                                            </p>
                                                        </div>
                                                        {selectedSubject.sessionsRemaining !==
                                                            null && (
                                                            <Badge variant="outline">
                                                                {
                                                                    selectedSubject.sessionsRemaining
                                                                }{' '}
                                                                remaining
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
                                                                                    Session{' '}
                                                                                    {sessionIndex +
                                                                                        1}
                                                                                </p>
                                                                                {endTime && (
                                                                                    <span className="text-xs text-muted-foreground">
                                                                                        Ends
                                                                                        at{' '}
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
                                                                                    Remove
                                                                                    session
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
                                                            className="gap-2"
                                                            onClick={addSession}
                                                        >
                                                            <Plus className="size-4" />
                                                            Add schedule
                                                        </Button>
                                                    )}
                                                </div>
                                            )}

                                        {currentStep === 2 &&
                                            selectedSubject && (
                                                <div className="space-y-4">
                                                    <div>
                                                        <p className="text-sm font-medium">
                                                            Review booking
                                                        </p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {sessions.length}{' '}
                                                            session
                                                            {sessions.length > 1
                                                                ? 's'
                                                                : ''}{' '}
                                                            · {totalDuration}{' '}
                                                            min total
                                                        </p>
                                                    </div>

                                                    <div className="scrollbar-stable max-h-[42vh] divide-y overflow-y-auto rounded-xl border">
                                                        {flattenedSessions.map(
                                                            (
                                                                session,
                                                                index,
                                                            ) => (
                                                                <div
                                                                    key={
                                                                        session.id
                                                                    }
                                                                    className="flex items-center justify-between gap-3 p-3"
                                                                >
                                                                    <div className="min-w-0">
                                                                        <p className="text-xs font-medium text-muted-foreground">
                                                                            Session{' '}
                                                                            {index +
                                                                                1}
                                                                        </p>
                                                                        <p className="truncate text-sm">
                                                                            {session.date
                                                                                ? selectedDateLabel(
                                                                                      session.date,
                                                                                  )
                                                                                : 'No date'}{' '}
                                                                            ·{' '}
                                                                            {session.time ||
                                                                                'No time'}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            ),
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                    </div>
                                </div>

                                {(errors.sessions ||
                                    errors.subject_id ||
                                    errors.program_enrollment_id) && (
                                    <p className="text-sm text-destructive">
                                        {errors.sessions ??
                                            errors.subject_id ??
                                            errors.program_enrollment_id}
                                    </p>
                                )}

                                <div className="flex flex-wrap items-center justify-between gap-2">
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
                                        Back
                                    </Button>
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() =>
                                                setBookingOpen(false)
                                            }
                                        >
                                            Cancel
                                        </Button>
                                        {currentStep <
                                        bookingSteps.length - 1 ? (
                                            <Button
                                                type="button"
                                                disabled={!canGoNext}
                                                onClick={goNext}
                                            >
                                                Continue
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
                                                    ? 'Booking...'
                                                    : `Confirm ${sessions.length} session${sessions.length > 1 ? 's' : ''}`}
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
