import { Form } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

type WorkingHour = {
    dayOfWeek: number;
    endTime: string | null;
    isActive: boolean;
    startTime: string | null;
};

type EditDialogWorkingHoursProps = {
    onOpenChange: (open: boolean) => void;
    open: boolean;
    workingHours: WorkingHour[];
};

const days = [
    { label: 'Monday', shortLabel: 'Mon', value: 1 },
    { label: 'Tuesday', shortLabel: 'Tue', value: 2 },
    { label: 'Wednesday', shortLabel: 'Wed', value: 3 },
    { label: 'Thursday', shortLabel: 'Thu', value: 4 },
    { label: 'Friday', shortLabel: 'Fri', value: 5 },
    { label: 'Saturday', shortLabel: 'Sat', value: 6 },
    { label: 'Sunday', shortLabel: 'Sun', value: 7 },
];

function initialFormValues(workingHours: WorkingHour[]) {
    const activeWorkingHour = workingHours.find(
        (workingHour) =>
            workingHour.isActive &&
            workingHour.startTime &&
            workingHour.endTime,
    );

    return {
        days: workingHours
            .filter((workingHour) => workingHour.isActive)
            .map((workingHour) => workingHour.dayOfWeek),
        endTime: activeWorkingHour?.endTime ?? '20:00',
        startTime: activeWorkingHour?.startTime ?? '09:00',
    };
}

export function EditDialogWorkingHours({
    onOpenChange,
    open,
    workingHours,
}: EditDialogWorkingHoursProps) {
    const initialValues = initialFormValues(workingHours);
    const [selectedDays, setSelectedDays] = useState(initialValues.days);
    const [startTime, setStartTime] = useState(initialValues.startTime);
    const [endTime, setEndTime] = useState(initialValues.endTime);

    const toggleDay = (day: number, checked: boolean) => {
        setSelectedDays((currentDays) =>
            checked
                ? [...currentDays, day].sort((first, second) => first - second)
                : currentDays.filter((currentDay) => currentDay !== day),
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Edit working hours</DialogTitle>
                </DialogHeader>

                <Form
                    action="/scheduling/working-hours"
                    method="put"
                    disableWhileProcessing
                    className="space-y-6"
                    onSuccess={() => {
                        onOpenChange(false);
                        toast.success('Working hours updated.');
                    }}
                    onError={() =>
                        toast.error('Please check the working hours form.')
                    }
                >
                    {({ errors, processing }) => (
                        <>
                            {selectedDays.map((day) => (
                                <input
                                    key={day}
                                    type="hidden"
                                    name="days[]"
                                    value={day}
                                />
                            ))}

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="working-start">
                                        Start time
                                    </Label>
                                    <Input
                                        id="working-start"
                                        name="start_time"
                                        type="time"
                                        value={startTime}
                                        onChange={(event) =>
                                            setStartTime(event.target.value)
                                        }
                                    />
                                    {errors.start_time && (
                                        <p className="text-sm text-destructive">
                                            {errors.start_time}
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="working-end">
                                        End time
                                    </Label>
                                    <Input
                                        id="working-end"
                                        name="end_time"
                                        type="time"
                                        value={endTime}
                                        onChange={(event) =>
                                            setEndTime(event.target.value)
                                        }
                                    />
                                    {errors.end_time && (
                                        <p className="text-sm text-destructive">
                                            {errors.end_time}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label>Active days</Label>
                                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
                                    {days.map((day) => {
                                        const selected = selectedDays.includes(
                                            day.value,
                                        );

                                        return (
                                            <label
                                                key={day.value}
                                                className={cn(
                                                    'flex h-11 cursor-pointer items-center gap-2 rounded-lg border px-3 text-sm transition-colors',
                                                    selected
                                                        ? 'border-primary bg-primary/5 text-foreground'
                                                        : 'border-border text-muted-foreground hover:bg-muted/50',
                                                )}
                                            >
                                                <Checkbox
                                                    checked={selected}
                                                    onCheckedChange={(
                                                        checked,
                                                    ) =>
                                                        toggleDay(
                                                            day.value,
                                                            checked === true,
                                                        )
                                                    }
                                                />
                                                <span className="hidden lg:inline">
                                                    {day.shortLabel}
                                                </span>
                                                <span className="lg:hidden">
                                                    {day.label}
                                                </span>
                                            </label>
                                        );
                                    })}
                                </div>
                                {errors.days && (
                                    <p className="text-sm text-destructive">
                                        {errors.days}
                                    </p>
                                )}
                            </div>

                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => onOpenChange(false)}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    Save changes
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}
