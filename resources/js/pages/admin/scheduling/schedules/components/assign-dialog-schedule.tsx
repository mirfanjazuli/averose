import { Form } from '@inertiajs/react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useUserTimezone } from '@/hooks/use-user-timezone';
import { formatTimeRange } from '@/lib/date-time';
import { MentorAvailabilitySelect } from '@/pages/admin/scheduling/schedules/components/mentor-availability-select';

type AssignableSchedule = {
    endAt: string;
    id: string;
    startAt: string;
    student: string;
    title: string;
};

type AssignDialogScheduleProps = {
    onError: () => void;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    open: boolean;
    schedule: AssignableSchedule | null;
};

export function AssignDialogSchedule({
    onError,
    onOpenChange,
    onSuccess,
    open,
    schedule,
}: AssignDialogScheduleProps) {
    const timezone = useUserTimezone();
    const [mentorId, setMentorId] = useState('');

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Assign mentor</DialogTitle>
                    <DialogDescription>
                        Zoom account and meeting link will be allocated
                        automatically based on availability.
                    </DialogDescription>
                </DialogHeader>
                {schedule && (
                    <Form
                        action={`/scheduling/schedules/${schedule.id}/assignment`}
                        method="put"
                        disableWhileProcessing
                        onSuccess={onSuccess}
                        onError={onError}
                        className="space-y-5"
                    >
                        {({ errors, processing }) => (
                            <>
                                <input
                                    type="hidden"
                                    name="mentor_id"
                                    value={mentorId}
                                />
                                <div className="rounded-2xl border p-4 text-sm">
                                    <p className="font-medium">
                                        {schedule.title}
                                    </p>
                                    <p className="mt-1 text-muted-foreground">
                                        {schedule.student} ·{' '}
                                        {formatTimeRange(
                                            schedule.startAt,
                                            schedule.endAt,
                                            timezone,
                                        )}
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-sm font-medium">Mentor</p>
                                    <MentorAvailabilitySelect
                                        endpoint={`/scheduling/schedules/${schedule.id}/mentor-options`}
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
                                        onClick={() => onOpenChange(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        disabled={!mentorId || processing}
                                    >
                                        {processing
                                            ? 'Assigning...'
                                            : 'Assign mentor'}
                                    </Button>
                                </div>
                            </>
                        )}
                    </Form>
                )}
            </DialogContent>
        </Dialog>
    );
}
