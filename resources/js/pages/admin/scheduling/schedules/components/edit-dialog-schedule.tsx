import { Form } from '@inertiajs/react';
import { useState } from 'react';

import { TimezoneIndicator } from '@/components/timezone-indicator';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useUserTimezone } from '@/hooks/use-user-timezone';
import { formatDateInput, formatTimeInput } from '@/lib/date-time';
import {
    ScheduleDatePicker,
    ScheduleTimePicker,
} from '@/pages/admin/scheduling/schedules/components/schedule-date-time-fields';

export type EditableSchedule = {
    id: string;
    startAt: string;
    student: string;
    title: string;
};

type EditDialogScheduleProps = {
    onError: () => void;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    open: boolean;
    schedule: EditableSchedule | null;
};

function scheduleDateParts(value: string | undefined, timezone: string) {
    if (!value) {
        return { date: '', time: '' };
    }

    return {
        date: formatDateInput(value, timezone),
        time: formatTimeInput(value, timezone),
    };
}

export function EditDialogSchedule({
    onError,
    onOpenChange,
    onSuccess,
    open,
    schedule,
}: EditDialogScheduleProps) {
    const timezone = useUserTimezone();
    const initialValue = scheduleDateParts(schedule?.startAt, timezone);
    const [date, setDate] = useState(initialValue.date);
    const [time, setTime] = useState(initialValue.time);

    if (!schedule) {
        return null;
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit schedule</DialogTitle>
                </DialogHeader>

                <Form
                    action={`/scheduling/schedules/${schedule.id}`}
                    method="put"
                    disableWhileProcessing
                    className="space-y-5"
                    onSuccess={onSuccess}
                    onError={onError}
                >
                    {({ errors, processing }) => (
                        <>
                            <input
                                type="hidden"
                                name="timezone"
                                value={timezone}
                            />
                            <div className="space-y-1">
                                <p className="font-medium">{schedule.title}</p>
                                <p className="text-sm text-muted-foreground">
                                    {schedule.student}
                                </p>
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
                                        onValueChange={setDate}
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
                                        onValueChange={setTime}
                                    />
                                    {errors.time && (
                                        <p className="text-xs text-destructive">
                                            {errors.time}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <TimezoneIndicator label="Time zone" />

                            <div className="flex justify-end gap-2 pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => onOpenChange(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={processing || !date || !time}
                                >
                                    Save changes
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}
