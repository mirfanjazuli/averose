import { Form } from '@inertiajs/react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
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

function scheduleDateParts(value?: string) {
    if (!value) {
        return { date: '', time: '' };
    }

    const parts = new Intl.DateTimeFormat('en-CA', {
        day: '2-digit',
        hour: '2-digit',
        hour12: false,
        minute: '2-digit',
        month: '2-digit',
        timeZone: 'Asia/Jakarta',
        year: 'numeric',
    }).formatToParts(new Date(value));
    const part = (type: Intl.DateTimeFormatPartTypes) =>
        parts.find((item) => item.type === type)?.value ?? '';

    return {
        date: `${part('year')}-${part('month')}-${part('day')}`,
        time: `${part('hour')}:${part('minute')}`,
    };
}

export function EditDialogSchedule({
    onError,
    onOpenChange,
    onSuccess,
    open,
    schedule,
}: EditDialogScheduleProps) {
    const initialValue = scheduleDateParts(schedule?.startAt);
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
