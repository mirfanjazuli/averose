import { Form } from '@inertiajs/react';
import {
    Check,
    ChevronsUpDown,
    MapPin,
    Plus,
    Video,
} from 'lucide-react';
import { useMemo, useState } from 'react';

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
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
    ToggleGroup,
    ToggleGroupItem,
} from '@/components/ui/toggle-group';
import { MentorAvailabilitySelect } from '@/pages/admin/scheduling/schedules/components/mentor-availability-select';
import {
    ScheduleDatePicker,
    ScheduleTimePicker,
} from '@/pages/admin/scheduling/schedules/components/schedule-date-time-fields';

export type EnrollmentOption = {
    duration: number;
    id: string;
    label: string;
    program: string;
    remainingSessions: number;
    student: string;
    subjects: {
        icon: string | null;
        id: string;
        name: string;
    }[];
    userId: string;
};

type StudentOption = {
    id: string;
    name: string;
};

type CreateDialogScheduleProps = {
    enrollments: EnrollmentOption[];
    onError: () => void;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    open: boolean;
};

function StudentSearchSelect({
    onValueChange,
    students,
    value,
}: {
    onValueChange: (value: string) => void;
    students: StudentOption[];
    value: string;
}) {
    const [open, setOpen] = useState(false);
    const selectedStudent = students.find((student) => student.id === value);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="h-12 w-full justify-between rounded-2xl px-4 font-normal"
                >
                    <span
                        className={
                            selectedStudent
                                ? 'truncate'
                                : 'truncate text-muted-foreground'
                        }
                    >
                        {selectedStudent?.name ?? 'Select student'}
                    </span>
                    <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
                </Button>
            </PopoverTrigger>
            <PopoverContent
                align="start"
                className="w-(--radix-popover-trigger-width) p-0"
            >
                <Command>
                    <CommandInput placeholder="Search student..." />
                    <CommandList>
                        <CommandEmpty>No student found.</CommandEmpty>
                        <CommandGroup>
                            {students.map((student) => (
                                <CommandItem
                                    key={student.id}
                                    value={`${student.name} ${student.id}`}
                                    onSelect={() => {
                                        onValueChange(student.id);
                                        setOpen(false);
                                    }}
                                >
                                    <span className="truncate">
                                        {student.name}
                                    </span>
                                    <Check
                                        className={
                                            value === student.id
                                                ? 'ml-auto size-4 opacity-100'
                                                : 'ml-auto size-4 opacity-0'
                                        }
                                    />
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

function ProgramSearchSelect({
    disabled,
    enrollments,
    onValueChange,
    value,
}: {
    disabled?: boolean;
    enrollments: EnrollmentOption[];
    onValueChange: (value: string) => void;
    value: string;
}) {
    const [open, setOpen] = useState(false);
    const selectedEnrollment = enrollments.find(
        (enrollment) => enrollment.id === value,
    );

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    disabled={disabled}
                    className="h-12 w-full justify-between rounded-2xl px-4 font-normal"
                >
                    {selectedEnrollment ? (
                        <span className="flex min-w-0 flex-1 items-center justify-between gap-3">
                            <span className="truncate">
                                {selectedEnrollment.program}
                            </span>
                            <span className="shrink-0 text-xs text-muted-foreground">
                                {selectedEnrollment.remainingSessions} left ·{' '}
                                {selectedEnrollment.duration} min
                            </span>
                        </span>
                    ) : (
                        <span className="truncate text-muted-foreground">
                            Select program
                        </span>
                    )}
                    <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
                </Button>
            </PopoverTrigger>
            <PopoverContent
                align="start"
                className="w-(--radix-popover-trigger-width) p-0"
            >
                <Command>
                    <CommandInput placeholder="Search program..." />
                    <CommandList>
                        <CommandEmpty>No program found.</CommandEmpty>
                        <CommandGroup>
                            {enrollments.map((enrollment) => (
                                <CommandItem
                                    key={enrollment.id}
                                    value={`${enrollment.program} ${enrollment.id}`}
                                    onSelect={() => {
                                        onValueChange(enrollment.id);
                                        setOpen(false);
                                    }}
                                >
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate font-medium">
                                            {enrollment.program}
                                        </p>
                                        <p className="truncate text-xs text-muted-foreground sm:hidden">
                                            {enrollment.remainingSessions}{' '}
                                            sessions left ·{' '}
                                            {enrollment.duration} min
                                        </p>
                                    </div>
                                    <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">
                                        {enrollment.remainingSessions} left ·{' '}
                                        {enrollment.duration} min
                                    </span>
                                    <Check
                                        className={
                                            value === enrollment.id
                                                ? 'ml-auto size-4 opacity-100'
                                                : 'ml-auto size-4 opacity-0'
                                        }
                                    />
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

function SubjectSearchSelect({
    disabled,
    onValueChange,
    subjects,
    value,
}: {
    disabled?: boolean;
    onValueChange: (value: string) => void;
    subjects: EnrollmentOption['subjects'];
    value: string;
}) {
    const [open, setOpen] = useState(false);
    const selectedSubject = subjects.find((subject) => subject.id === value);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    disabled={disabled}
                    className="h-12 w-full justify-between rounded-2xl px-4 font-normal"
                >
                    <span
                        className={
                            selectedSubject
                                ? 'truncate'
                                : 'truncate text-muted-foreground'
                        }
                    >
                        {selectedSubject?.name ?? 'Select subject'}
                    </span>
                    <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
                </Button>
            </PopoverTrigger>
            <PopoverContent
                align="start"
                className="w-(--radix-popover-trigger-width) p-0"
            >
                <Command>
                    <CommandInput placeholder="Search subject..." />
                    <CommandList>
                        <CommandEmpty>No subject found.</CommandEmpty>
                        <CommandGroup>
                            {subjects.map((subject) => (
                                <CommandItem
                                    key={subject.id}
                                    value={`${subject.name} ${subject.id}`}
                                    onSelect={() => {
                                        onValueChange(subject.id);
                                        setOpen(false);
                                    }}
                                >
                                    <span className="truncate">
                                        {subject.name}
                                    </span>
                                    <Check
                                        className={
                                            value === subject.id
                                                ? 'ml-auto size-4 opacity-100'
                                                : 'ml-auto size-4 opacity-0'
                                        }
                                    />
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

export function CreateDialogSchedule({
    enrollments,
    onError,
    onOpenChange,
    onSuccess,
    open,
}: CreateDialogScheduleProps) {
    const [studentId, setStudentId] = useState('');
    const [enrollmentId, setEnrollmentId] = useState('');
    const [subjectId, setSubjectId] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [deliveryMode, setDeliveryMode] = useState('online');
    const [mentorId, setMentorId] = useState('');

    const studentOptions = useMemo(
        () =>
            Array.from(
                new Map(
                    enrollments.map((enrollment) => [
                        enrollment.userId,
                        {
                            id: enrollment.userId,
                            name: enrollment.student,
                        },
                    ]),
                ).values(),
            ).sort((firstStudent, secondStudent) =>
                firstStudent.name.localeCompare(secondStudent.name),
            ),
        [enrollments],
    );
    const studentEnrollments = useMemo(
        () =>
            enrollments.filter((enrollment) => enrollment.userId === studentId),
        [studentId, enrollments],
    );
    const selectedEnrollment = enrollments.find(
        (enrollment) => enrollment.id === enrollmentId,
    );
    const mentorOptionsEndpoint = useMemo(() => {
        if (!date || !time || !selectedEnrollment) {
            return null;
        }

        const query = new URLSearchParams({
            date,
            duration: String(selectedEnrollment.duration),
            time,
        });

        return `/scheduling/schedules/mentor-options?${query.toString()}`;
    }, [date, selectedEnrollment, time]);

    const resetForm = () => {
        setStudentId('');
        setEnrollmentId('');
        setSubjectId('');
        setDate('');
        setTime('');
        setDeliveryMode('online');
        setMentorId('');
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(nextOpen) => {
                onOpenChange(nextOpen);

                if (!nextOpen) {
                    resetForm();
                }
            }}
        >
            <DialogTrigger asChild>
                <Button type="button" className="gap-2">
                    <Plus className="size-4" />
                    Add schedule
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add schedule</DialogTitle>
                </DialogHeader>
                <Form
                    action="/scheduling/schedules"
                    method="post"
                    disableWhileProcessing
                    className="space-y-5"
                    onSuccess={() => {
                        resetForm();
                        onSuccess();
                    }}
                    onError={onError}
                >
                    {({ errors, processing }) => (
                        <>
                            <input
                                type="hidden"
                                name="program_enrollment_id"
                                value={enrollmentId}
                            />
                            <input
                                type="hidden"
                                name="subject_id"
                                value={subjectId}
                            />
                            <input
                                type="hidden"
                                name="user_id"
                                value={selectedEnrollment?.userId ?? ''}
                            />
                            <input
                                type="hidden"
                                name="delivery_mode"
                                value={deliveryMode}
                            />
                            <input
                                type="hidden"
                                name="mentor_id"
                                value={mentorId}
                            />
                            <div className="space-y-2">
                                <Label>Student</Label>
                                <StudentSearchSelect
                                    students={studentOptions}
                                    value={studentId}
                                    onValueChange={(value) => {
                                        setStudentId(value);
                                        setEnrollmentId('');
                                        setSubjectId('');
                                        setMentorId('');
                                    }}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Program</Label>
                                <ProgramSearchSelect
                                    disabled={!studentId}
                                    enrollments={studentEnrollments}
                                    value={enrollmentId}
                                    onValueChange={(value) => {
                                        setEnrollmentId(value);
                                        setSubjectId('');
                                        setMentorId('');
                                    }}
                                />
                                {errors.program_enrollment_id && (
                                    <p className="text-xs text-destructive">
                                        {errors.program_enrollment_id}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label>Subject</Label>
                                <SubjectSearchSelect
                                    value={subjectId}
                                    onValueChange={setSubjectId}
                                    disabled={!selectedEnrollment}
                                    subjects={selectedEnrollment?.subjects ?? []}
                                />
                                {errors.subject_id && (
                                    <p className="text-xs text-destructive">
                                        {errors.subject_id}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label>Delivery</Label>
                                <ToggleGroup
                                    type="single"
                                    variant="outline"
                                    spacing={0}
                                    value={deliveryMode}
                                    onValueChange={(value) => {
                                        if (value) {
                                            setDeliveryMode(value);
                                        }
                                    }}
                                    className="grid h-11 w-full grid-cols-2"
                                >
                                    <ToggleGroupItem
                                        value="online"
                                        className="h-11 w-full gap-2"
                                    >
                                        <Video className="size-4" />
                                        Online
                                    </ToggleGroupItem>
                                    <ToggleGroupItem
                                        value="offline"
                                        className="h-11 w-full gap-2"
                                    >
                                        <MapPin className="size-4" />
                                        Offline
                                    </ToggleGroupItem>
                                </ToggleGroup>
                                {errors.delivery_mode && (
                                    <p className="text-xs text-destructive">
                                        {errors.delivery_mode}
                                    </p>
                                )}
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Date</Label>
                                    <input
                                        type="hidden"
                                        name="date"
                                        value={date}
                                    />
                                    <ScheduleDatePicker
                                        value={date}
                                        onValueChange={(value) => {
                                            setDate(value);
                                            setMentorId('');
                                        }}
                                    />
                                    {errors.date && (
                                        <p className="text-xs text-destructive">
                                            {errors.date}
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label>Start time</Label>
                                    <input
                                        type="hidden"
                                        name="time"
                                        value={time}
                                    />
                                    <ScheduleTimePicker
                                        value={time}
                                        onValueChange={(value) => {
                                            setTime(value);
                                            setMentorId('');
                                        }}
                                    />
                                    {errors.time && (
                                        <p className="text-xs text-destructive">
                                            {errors.time}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Mentor</Label>
                                <MentorAvailabilitySelect
                                    key={mentorOptionsEndpoint ?? 'disabled'}
                                    endpoint={mentorOptionsEndpoint}
                                    value={mentorId}
                                    onValueChange={setMentorId}
                                />
                                {errors.mentor_id && (
                                    <p className="text-xs text-destructive">
                                        {errors.mentor_id}
                                    </p>
                                )}
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        onOpenChange(false);
                                        resetForm();
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    disabled={
                                        processing ||
                                        !enrollmentId ||
                                        !subjectId ||
                                        !date ||
                                        !time ||
                                        !mentorId
                                    }
                                >
                                    {processing ? 'Saving...' : 'Save schedule'}
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}
