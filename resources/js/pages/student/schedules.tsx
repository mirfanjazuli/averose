import { Head } from '@inertiajs/react';
import {
    ArrowUpRight,
    CheckCircle2,
    Clock3,
    GraduationCap,
    MonitorUp,
    UserRoundCheck,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
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
    DialogTrigger,
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

const sessions = [
    {
        title: 'Responsive layout review',
        mentor: 'Megan Norton',
        program: 'Frontend Basics',
        time: 'Today, 09:00 - 10:00',
        status: 'Next',
    },
    {
        title: 'Component composition',
        mentor: 'Raka Mahendra',
        program: 'React Advanced',
        time: 'Wednesday, 14:00 - 15:00',
        status: 'Confirmed',
    },
    {
        title: 'Portfolio feedback',
        mentor: 'Nadia Putri',
        program: 'UI Design',
        time: 'Friday, 10:00 - 11:00',
        status: 'Confirmed',
    },
];

const week = [
    { day: 'Mon', date: '12', active: false },
    { day: 'Tue', date: '13', active: true },
    { day: 'Wed', date: '14', active: false },
    { day: 'Thu', date: '15', active: false },
    { day: 'Fri', date: '16', active: false },
];

const subjects = [
    {
        value: 'frontend-basics',
        label: 'Frontend Basics',
        mentor: 'Megan Norton',
    },
    {
        value: 'react-advanced',
        label: 'React Advanced',
        mentor: 'Raka Mahendra',
    },
    {
        value: 'ui-design',
        label: 'UI Design',
        mentor: 'Nadia Putri',
    },
];

const bookingSteps = ['Subject', 'Date & time', 'Confirm'] as const;

export default function StudentSchedules() {
    const [bookingOpen, setBookingOpen] = useState(false);
    const [bookingStep, setBookingStep] = useState(0);
    const [subject, setSubject] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');

    const selectedSubject = useMemo(
        () => subjects.find((item) => item.value === subject),
        [subject],
    );

    const canContinue =
        bookingStep === 0
            ? Boolean(subject)
            : bookingStep === 1
              ? Boolean(date && time)
              : true;

    const closeBooking = () => {
        setBookingOpen(false);
        setBookingStep(0);
    };

    const submitBooking = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSubject('');
        setDate('');
        setTime('');
        closeBooking();
    };

    return (
        <>
            <Head title="Schedules" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="font-heading text-2xl font-semibold">
                            Schedules
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            View your upcoming sessions, mentors, and program
                            timeline.
                        </p>
                    </div>
                    <Dialog
                        open={bookingOpen}
                        onOpenChange={(open) => {
                            setBookingOpen(open);

                            if (!open) {
                                setBookingStep(0);
                            }
                        }}
                    >
                        <DialogTrigger asChild>
                            <Button className="gap-2">
                                Book session
                                <ArrowUpRight className="size-4" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-xl">
                            <DialogHeader>
                                <DialogTitle>Book session</DialogTitle>
                                <DialogDescription>
                                    Choose a subject, pick your preferred time,
                                    then confirm the booking.
                                </DialogDescription>
                            </DialogHeader>

                            <form onSubmit={submitBooking} className="space-y-6">
                                <div className="grid grid-cols-3 gap-2">
                                    {bookingSteps.map((step, index) => (
                                        <div
                                            key={step}
                                            className={
                                                index <= bookingStep
                                                    ? 'rounded-xl border border-primary/30 bg-primary/10 px-3 py-2 text-primary'
                                                    : 'rounded-xl border px-3 py-2 text-muted-foreground'
                                            }
                                        >
                                            <p className="text-xs">
                                                Step {index + 1}
                                            </p>
                                            <p className="truncate text-sm font-medium">
                                                {step}
                                            </p>
                                        </div>
                                    ))}
                                </div>

                                {bookingStep === 0 && (
                                    <div className="space-y-3">
                                        <Label htmlFor="booking-subject">
                                            Subject
                                        </Label>
                                        <Select
                                            value={subject}
                                            onValueChange={setSubject}
                                        >
                                            <SelectTrigger
                                                id="booking-subject"
                                                className="w-full"
                                            >
                                                <SelectValue placeholder="Select subject" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {subjects.map((item) => (
                                                    <SelectItem
                                                        key={item.value}
                                                        value={item.value}
                                                    >
                                                        {item.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {selectedSubject && (
                                            <div className="rounded-lg border p-4 text-sm">
                                                <p className="font-medium">
                                                    {selectedSubject.label}
                                                </p>
                                                <p className="mt-1 text-muted-foreground">
                                                    Mentor:{' '}
                                                    {selectedSubject.mentor}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {bookingStep === 1 && (
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-3">
                                            <Label htmlFor="booking-date">
                                                Date
                                            </Label>
                                            <Input
                                                id="booking-date"
                                                type="date"
                                                value={date}
                                                onChange={(event) =>
                                                    setDate(event.target.value)
                                                }
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <Label htmlFor="booking-time">
                                                Time
                                            </Label>
                                            <Input
                                                id="booking-time"
                                                type="time"
                                                value={time}
                                                onChange={(event) =>
                                                    setTime(event.target.value)
                                                }
                                            />
                                        </div>
                                    </div>
                                )}

                                {bookingStep === 2 && (
                                    <div className="space-y-3 rounded-lg border p-4">
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <p className="text-sm text-muted-foreground">
                                                    Subject
                                                </p>
                                                <p className="font-medium">
                                                    {selectedSubject?.label}
                                                </p>
                                            </div>
                                            <Badge variant="secondary">
                                                Pending
                                            </Badge>
                                        </div>
                                        <div className="grid gap-3 text-sm sm:grid-cols-2">
                                            <div>
                                                <p className="text-muted-foreground">
                                                    Mentor
                                                </p>
                                                <p className="font-medium">
                                                    {selectedSubject?.mentor}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-muted-foreground">
                                                    Schedule
                                                </p>
                                                <p className="font-medium">
                                                    {date} at {time}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <DialogFooter>
                                    {bookingStep > 0 && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() =>
                                                setBookingStep(
                                                    (currentStep) =>
                                                        currentStep - 1,
                                                )
                                            }
                                        >
                                            Back
                                        </Button>
                                    )}
                                    {bookingStep < bookingSteps.length - 1 ? (
                                        <Button
                                            type="button"
                                            disabled={!canContinue}
                                            onClick={() =>
                                                setBookingStep(
                                                    (currentStep) =>
                                                        currentStep + 1,
                                                )
                                            }
                                        >
                                            Continue
                                        </Button>
                                    ) : (
                                        <Button type="submit">
                                            Confirm booking
                                        </Button>
                                    )}
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="grid gap-4 md:grid-cols-5">
                    {week.map((item) => (
                        <Card
                            key={item.day}
                            className={
                                item.active
                                    ? 'border-primary/30 bg-primary/10 py-4'
                                    : 'py-4'
                            }
                        >
                            <CardContent className="px-4 text-center">
                                <p className="text-xs text-muted-foreground">
                                    {item.day}
                                </p>
                                <p className="mt-1 text-2xl font-semibold">
                                    {item.date}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
                    <Card>
                        <CardHeader className="flex-row items-center justify-between gap-4">
                            <div>
                                <CardTitle>Upcoming sessions</CardTitle>
                                <CardDescription>
                                    Your scheduled learning sessions.
                                </CardDescription>
                            </div>
                            <Badge variant="secondary">
                                {sessions.length} sessions
                            </Badge>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {sessions.map((session) => (
                                <div
                                    key={`${session.title}-${session.time}`}
                                    className="grid gap-4 rounded-lg border p-4 md:grid-cols-[auto_minmax(0,1fr)_auto]"
                                >
                                    <div className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                        <GraduationCap className="size-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h2 className="font-semibold">
                                                {session.title}
                                            </h2>
                                            <Badge variant="outline">
                                                {session.status}
                                            </Badge>
                                        </div>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            {session.program}
                                        </p>
                                        <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
                                            <span className="flex items-center gap-1.5">
                                                <Clock3 className="size-4" />
                                                {session.time}
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                <UserRoundCheck className="size-4" />
                                                {session.mentor}
                                            </span>
                                        </div>
                                    </div>
                                    <Button variant="outline" size="sm">
                                        Details
                                    </Button>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Next session</CardTitle>
                            <CardDescription>
                                Quick overview before joining.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="rounded-lg border p-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                                        <MonitorUp className="size-5" />
                                    </div>
                                    <div>
                                        <p className="font-medium">
                                            Responsive layout review
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            Starts today at 09:00
                                        </p>
                                    </div>
                                </div>
                                <Button className="mt-4 w-full">
                                    Join session
                                </Button>
                            </div>
                            <div className="rounded-lg border p-4">
                                <p className="flex items-center gap-2 font-medium">
                                    <CheckCircle2 className="size-4 text-primary" />
                                    Preparation
                                </p>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    Bring your latest dashboard assignment and
                                    layout questions.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
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
