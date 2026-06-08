import { Form } from '@inertiajs/react';
import {
    ArrowUpRight,
    CalendarDays,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const hourOptions = Array.from({ length: 24 }, (_, index) =>
    String(index).padStart(2, '0'),
);
const minuteOptions = Array.from({ length: 60 }, (_, index) =>
    String(index).padStart(2, '0'),
);

export type BookingSubjectOption = {
    duration: number;
    enrollmentId: string | null;
    label: string;
    program: string | null;
    sessionsRemaining: number | null;
    subjectId: string;
    value: string;
};

type StudentBookSessionDialogProps = {
    subjects: BookingSubjectOption[];
    trigger?: ReactNode;
};

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

function todayKey(): string {
    return dateKey(new Date());
}

function isPastDate(dateValue: Date): boolean {
    return dateKey(dateValue) < todayKey();
}

function monthLabel(dateValue: Date): string {
    return new Intl.DateTimeFormat('en-US', {
        month: 'long',
        year: 'numeric',
    }).format(dateValue);
}

function selectedDateLabel(dateValue: string): string {
    if (!dateValue) {
        return '-';
    }

    return new Intl.DateTimeFormat('en-US', {
        day: 'numeric',
        month: 'short',
        weekday: 'short',
        year: 'numeric',
    }).format(new Date(`${dateValue}T00:00:00`));
}

function calendarMonthDays(monthDate: Date): (Date | null)[] {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: (Date | null)[] = Array.from(
        { length: firstDay.getDay() },
        () => null,
    );

    for (let day = 1; day <= daysInMonth; day++) {
        days.push(new Date(year, month, day));
    }

    return days;
}

function selectedDateTime(date: string, time: string): Date | null {
    if (!date || !time) {
        return null;
    }

    return new Date(`${date}T${time}:00`);
}

function TimePicker({
    disabled,
    onChange,
    value,
}: {
    disabled: boolean;
    onChange: (value: string) => void;
    value: string;
}) {
    const [selectedHour = '', selectedMinute = ''] = value.split(':');

    const updateTime = (hour: string, minute: string) => {
        onChange(`${hour || '00'}:${minute || '00'}`);
    };

    return (
        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
            <Select
                disabled={disabled}
                value={selectedHour}
                onValueChange={(hour) => updateTime(hour, selectedMinute)}
            >
                <SelectTrigger className="h-12 w-full rounded-2xl">
                    <SelectValue placeholder="Hour" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                    {hourOptions.map((hour) => (
                        <SelectItem key={hour} value={hour}>
                            {hour}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <span className="text-muted-foreground">:</span>
            <Select
                disabled={disabled}
                value={selectedMinute}
                onValueChange={(minute) => updateTime(selectedHour, minute)}
            >
                <SelectTrigger className="h-12 w-full rounded-2xl">
                    <SelectValue placeholder="Minute" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                    {minuteOptions.map((minute) => (
                        <SelectItem key={minute} value={minute}>
                            {minute}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}

export function StudentBookSessionDialog({
    subjects,
    trigger,
}: StudentBookSessionDialogProps) {
    const [bookingOpen, setBookingOpen] = useState(false);
    const [subject, setSubject] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [visibleMonth, setVisibleMonth] = useState(
        () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    );
    const [minimumBookingTime, setMinimumBookingTime] =
        useState<Date | null>(null);

    const selectedSubject = useMemo(
        () => subjects.find((item) => item.value === subject),
        [subject, subjects],
    );
    const calendarDays = useMemo(
        () => calendarMonthDays(visibleMonth),
        [visibleMonth],
    );
    const sessionDateTime = selectedDateTime(date, time);
    const isTooSoon = Boolean(
        sessionDateTime &&
            minimumBookingTime &&
            sessionDateTime < minimumBookingTime,
    );
    const hasRemainingSession =
        selectedSubject?.sessionsRemaining === null ||
        (selectedSubject?.sessionsRemaining ?? 0) > 0;
    const canConfirm = Boolean(
        date &&
            time &&
            selectedSubject?.enrollmentId &&
            hasRemainingSession &&
            !isTooSoon,
    );
    const endTime =
        selectedSubject && time ? addMinutes(time, selectedSubject.duration) : '';

    const resetBooking = () => {
        setSubject('');
        setDate('');
        setTime('');
    };

    const changeVisibleMonth = (offset: number) => {
        setVisibleMonth(
            (currentMonth) =>
                new Date(
                    currentMonth.getFullYear(),
                    currentMonth.getMonth() + offset,
                    1,
                ),
        );
        resetBooking();
    };

    return (
        <Dialog
            open={bookingOpen}
            onOpenChange={(open) => {
                setBookingOpen(open);

                if (open) {
                    setMinimumBookingTime(
                        new Date(Date.now() + 5 * 60 * 60 * 1000),
                    );
                }

                if (!open) {
                    resetBooking();
                }
            }}
        >
            <DialogTrigger asChild>
                {trigger ?? (
                    <Button className="gap-2">
                        Book session
                        <ArrowUpRight className="size-4" />
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Book session</DialogTitle>
                    <DialogDescription>
                        Pick a date and exact time, then choose a subject to
                        confirm.
                    </DialogDescription>
                </DialogHeader>

                <Form
                    action="/scheduling/schedules/bookings"
                    method="post"
                    disableWhileProcessing
                    onSuccess={() => {
                        toast.success('Session booked.');
                        setBookingOpen(false);
                        resetBooking();
                    }}
                    className="space-y-6"
                >
                    {({ errors, processing }) => (
                        <>
                            <input
                                type="hidden"
                                name="program_enrollment_id"
                                value={selectedSubject?.enrollmentId ?? ''}
                            />
                            <input
                                type="hidden"
                                name="subject_id"
                                value={selectedSubject?.subjectId ?? ''}
                            />
                            <input type="hidden" name="date" value={date} />
                            <input type="hidden" name="time" value={time} />

                            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
                                <div className="space-y-5">
                                    <div>
                                        <div className="mb-3 flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-2 text-sm font-medium">
                                                <CalendarDays className="size-4 text-primary" />
                                                {monthLabel(visibleMonth)}
                                            </div>
                                            <div className="flex gap-1">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="icon-sm"
                                                    className="rounded-full"
                                                    onClick={() =>
                                                        changeVisibleMonth(-1)
                                                    }
                                                >
                                                    <ChevronLeft className="size-4" />
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="icon-sm"
                                                    className="rounded-full"
                                                    onClick={() =>
                                                        changeVisibleMonth(1)
                                                    }
                                                >
                                                    <ChevronRight className="size-4" />
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
                                            {weekdayLabels.map((label) => (
                                                <span key={label}>
                                                    {label}
                                                </span>
                                            ))}
                                        </div>
                                        <div className="grid grid-cols-7 gap-1">
                                            {calendarDays.map(
                                                (item, index) =>
                                                    item ? (
                                                        <Button
                                                            key={dateKey(item)}
                                                            type="button"
                                                            variant={
                                                                date ===
                                                                dateKey(item)
                                                                    ? 'default'
                                                                    : 'outline'
                                                            }
                                                            disabled={isPastDate(
                                                                item,
                                                            )}
                                                            className="h-12 rounded-xl px-0 disabled:opacity-30"
                                                            onClick={() => {
                                                                setDate(
                                                                    dateKey(
                                                                        item,
                                                                    ),
                                                                );
                                                                setTime('');
                                                                setSubject('');
                                                            }}
                                                        >
                                                            {item.getDate()}
                                                        </Button>
                                                    ) : (
                                                        <div
                                                            key={`empty-${index}`}
                                                            className="h-12"
                                                        />
                                                    ),
                                            )}
                                        </div>
                                        {errors.date && (
                                            <p className="mt-2 text-xs text-destructive">
                                                {errors.date}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <p className="mb-3 text-sm font-medium">
                                            Preferred time
                                        </p>
                                        <TimePicker
                                            value={time}
                                            disabled={!date}
                                            onChange={(value) => {
                                                setTime(value);
                                                setSubject('');
                                            }}
                                        />
                                        {!date && (
                                            <p className="mt-2 text-xs text-muted-foreground">
                                                Select a date first.
                                            </p>
                                        )}
                                        {isTooSoon && (
                                            <p className="mt-2 text-xs text-destructive">
                                                Pick a time at least 5 hours
                                                from now.
                                            </p>
                                        )}
                                        {errors.time && (
                                            <p className="mt-2 text-xs text-destructive">
                                                {errors.time}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="rounded-2xl border bg-background">
                                    {!time ? (
                                        <div className="flex min-h-72 flex-col justify-between p-5">
                                            <div>
                                                <p className="text-sm font-medium">
                                                    Review
                                                </p>
                                                <p className="mt-1 text-sm text-muted-foreground">
                                                    Select a date and time to
                                                    continue with subject
                                                    selection.
                                                </p>
                                            </div>
                                            <div className="rounded-xl bg-muted/40 p-4 text-sm text-muted-foreground">
                                                Your selected schedule and
                                                duration will appear here.
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="divide-y">
                                            <div className="p-5">
                                                <div className="mb-3 flex items-center justify-between gap-3">
                                                    <div>
                                                        <p className="text-sm font-medium">
                                                            Subject
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            Search and choose
                                                            one enrolled
                                                            subject.
                                                        </p>
                                                    </div>
                                                    <Badge variant="secondary">
                                                        Required
                                                    </Badge>
                                                </div>
                                                <Command className="rounded-xl border">
                                                    <CommandInput placeholder="Search subject..." />
                                                    <CommandList className="max-h-56">
                                                        <CommandEmpty>
                                                            No subjects found.
                                                        </CommandEmpty>
                                                        <CommandGroup>
                                                            {subjects.map(
                                                                (item) => {
                                                                    const isEmpty =
                                                                        item.sessionsRemaining !==
                                                                            null &&
                                                                        item.sessionsRemaining <
                                                                            1;

                                                                    return (
                                                                        <CommandItem
                                                                            key={
                                                                                item.value
                                                                            }
                                                                            value={`${item.label} ${item.program ?? ''}`}
                                                                            disabled={
                                                                                isEmpty
                                                                            }
                                                                            onSelect={() =>
                                                                                setSubject(
                                                                                    item.value,
                                                                                )
                                                                            }
                                                                        >
                                                                            <div className="min-w-0">
                                                                                <p className="truncate font-medium">
                                                                                    {
                                                                                        item.label
                                                                                    }
                                                                                </p>
                                                                                <p className="truncate text-xs text-muted-foreground">
                                                                                    {item.program ??
                                                                                        'No enrollment'}{' '}
                                                                                    ·{' '}
                                                                                    {
                                                                                        item.duration
                                                                                    }{' '}
                                                                                    minutes
                                                                                </p>
                                                                            </div>
                                                                            <Badge
                                                                                variant={
                                                                                    subject ===
                                                                                    item.value
                                                                                        ? 'default'
                                                                                        : 'secondary'
                                                                                }
                                                                                className="ml-auto"
                                                                            >
                                                                                {item.sessionsRemaining ===
                                                                                null
                                                                                    ? 'Demo'
                                                                                    : isEmpty
                                                                                      ? 'Empty'
                                                                                      : `${item.sessionsRemaining} left`}
                                                                            </Badge>
                                                                        </CommandItem>
                                                                    );
                                                                },
                                                            )}
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                                {errors.subject_id && (
                                                    <p className="mt-2 text-xs text-destructive">
                                                        {errors.subject_id}
                                                    </p>
                                                )}
                                                {errors.program_enrollment_id && (
                                                    <p className="mt-2 text-xs text-destructive">
                                                        {
                                                            errors.program_enrollment_id
                                                        }
                                                    </p>
                                                )}
                                            </div>

                                            <div className="space-y-4 p-5 text-sm">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div>
                                                        <p className="text-xs text-muted-foreground">
                                                            Schedule
                                                        </p>
                                                        <p className="mt-1 font-medium">
                                                            {selectedDateLabel(
                                                                date,
                                                            )}{' '}
                                                            · {time}
                                                        </p>
                                                    </div>
                                                    <Badge variant="secondary">
                                                        Pending
                                                    </Badge>
                                                </div>
                                                <div className="rounded-xl bg-muted/40 p-4">
                                                    <p className="text-xs text-muted-foreground">
                                                        Summary
                                                    </p>
                                                    <div className="mt-2 space-y-1 font-medium">
                                                        <p>
                                                            {selectedSubject?.label ??
                                                                'Subject not selected'}
                                                        </p>
                                                        <p>
                                                            Total duration:{' '}
                                                            {selectedSubject?.duration ??
                                                                60}{' '}
                                                            minutes
                                                        </p>
                                                        {selectedSubject && (
                                                            <p>
                                                                Ends at{' '}
                                                                {endTime}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                {selectedSubject &&
                                                    selectedSubject.enrollmentId ===
                                                        null && (
                                                        <p className="text-xs text-destructive">
                                                            Enroll in a program
                                                            before booking this
                                                            subject.
                                                        </p>
                                                    )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 border-t pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setBookingOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button disabled={!canConfirm || processing}>
                                    {processing
                                        ? 'Booking...'
                                        : 'Confirm booking'}
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}
