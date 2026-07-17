import { Form, Head } from '@inertiajs/react';
import { Clock3, Pencil, TimerReset } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { ActionMenu } from '@/components/admin/action-menu';
import { formatBadgeLabel, getBadgeProps } from '@/lib/badge';
import { SummaryCard } from '@/components/admin/summary-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

type WorkingHour = {
    dayOfWeek: number;
    endTime: string | null;
    id: number;
    isActive: boolean;
    startTime: string | null;
};

const dayLabels: Record<number, string> = {
    1: 'Monday',
    2: 'Tuesday',
    3: 'Wednesday',
    4: 'Thursday',
    5: 'Friday',
    6: 'Saturday',
    7: 'Sunday',
};

function durationInHours(workingHour: WorkingHour) {
    if (
        !workingHour.isActive ||
        !workingHour.startTime ||
        !workingHour.endTime
    ) {
        return 0;
    }

    const [startHour, startMinute] = workingHour.startTime
        .split(':')
        .map(Number);
    const [endHour, endMinute] = workingHour.endTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;

    return Math.max(0, (endMinutes - startMinutes) / 60);
}

function formatDuration(hours: number) {
    return Number.isInteger(hours)
        ? `${hours} hours`
        : `${hours.toFixed(1)} hours`;
}

export default function WorkingHours({
    workingHours,
}: {
    workingHours: WorkingHour[];
}) {
    const [editingWorkingHour, setEditingWorkingHour] =
        useState<WorkingHour | null>(null);
    const [editIsActive, setEditIsActive] = useState(false);
    const activeDays = workingHours.filter((item) => item.isActive).length;
    const weeklyCapacity = workingHours.reduce(
        (total, item) => total + durationInHours(item),
        0,
    );

    const openEditDialog = (workingHour: WorkingHour) => {
        setEditingWorkingHour(workingHour);
        setEditIsActive(workingHour.isActive);
    };

    return (
        <>
            <Head title="Working Hours" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="font-heading text-2xl font-semibold">
                            Working Hours
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Manage available hours for classes, mentoring, and
                            reschedule slots.
                        </p>
                    </div>
                </div>

                <Dialog
                    open={!!editingWorkingHour}
                    onOpenChange={(open) =>
                        !open && setEditingWorkingHour(null)
                    }
                >
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Edit working hours</DialogTitle>
                            <DialogDescription>
                                Update availability for{' '}
                                {editingWorkingHour
                                    ? dayLabels[editingWorkingHour.dayOfWeek]
                                    : 'this day'}
                                .
                            </DialogDescription>
                        </DialogHeader>
                        {editingWorkingHour && (
                            <Form
                                action={`/scheduling/working-hours/${editingWorkingHour.id}`}
                                method="put"
                                disableWhileProcessing
                                onSuccess={() => {
                                    setEditingWorkingHour(null);
                                    toast.success('Working hours updated.');
                                }}
                                onError={() =>
                                    toast.error(
                                        'Please check the working hours form.',
                                    )
                                }
                                className="grid gap-4"
                            >
                                {({ errors, processing }) => (
                                    <>
                                        <input
                                            type="hidden"
                                            name="is_active"
                                            value={editIsActive ? '1' : '0'}
                                        />
                                        <label className="flex items-center justify-between rounded-2xl border p-4">
                                            <span>
                                                <span className="block text-sm font-medium">
                                                    Active
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    Allow schedule booking on
                                                    this day.
                                                </span>
                                            </span>
                                            <input
                                                type="checkbox"
                                                checked={editIsActive}
                                                onChange={(event) =>
                                                    setEditIsActive(
                                                        event.target.checked,
                                                    )
                                                }
                                                className="size-4 accent-primary"
                                            />
                                        </label>
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <div className="grid gap-2">
                                                <Label htmlFor="working-start">
                                                    Start time
                                                </Label>
                                                <Input
                                                    id="working-start"
                                                    name="start_time"
                                                    type="time"
                                                    defaultValue={
                                                        editingWorkingHour.startTime ??
                                                        '09:00'
                                                    }
                                                    disabled={!editIsActive}
                                                />
                                                {errors.start_time && (
                                                    <p className="text-sm text-destructive">
                                                        {errors.start_time}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="working-end">
                                                    End time
                                                </Label>
                                                <Input
                                                    id="working-end"
                                                    name="end_time"
                                                    type="time"
                                                    defaultValue={
                                                        editingWorkingHour.endTime ??
                                                        '20:00'
                                                    }
                                                    disabled={!editIsActive}
                                                />
                                                {errors.end_time && (
                                                    <p className="text-sm text-destructive">
                                                        {errors.end_time}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button
                                                type="submit"
                                                disabled={processing}
                                            >
                                                Save changes
                                            </Button>
                                        </DialogFooter>
                                    </>
                                )}
                            </Form>
                        )}
                    </DialogContent>
                </Dialog>

                <div className="grid gap-4 md:grid-cols-2">
                    <SummaryCard
                        icon={Clock3}
                        label="Active days"
                        value={activeDays}
                    />
                    <SummaryCard
                        icon={TimerReset}
                        label="Weekly capacity"
                        value={formatDuration(weeklyCapacity)}
                    />
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Weekly schedule</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-2xl border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Day</TableHead>
                                        <TableHead>Hours</TableHead>
                                        <TableHead>Duration</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="w-12 text-right" />
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {workingHours.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium">
                                                {dayLabels[item.dayOfWeek]}
                                            </TableCell>
                                            <TableCell>
                                                {item.isActive &&
                                                item.startTime &&
                                                item.endTime
                                                    ? `${item.startTime} - ${item.endTime}`
                                                    : '-'}
                                            </TableCell>
                                            <TableCell>
                                                {formatDuration(
                                                    durationInHours(item),
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    {...getBadgeProps(
                                                        item.isActive
                                                            ? 'success'
                                                            : 'muted',
                                                    )}
                                                >
                                                    {formatBadgeLabel(
                                                        item.isActive
                                                            ? 'Active'
                                                            : 'Inactive',
                                                    )}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <ActionMenu label="Open working hour actions">
                                                    <DropdownMenuItem
                                                        onClick={() =>
                                                            openEditDialog(item)
                                                        }
                                                    >
                                                        <Pencil className="size-4" />
                                                        Edit
                                                    </DropdownMenuItem>
                                                </ActionMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

WorkingHours.layout = {
    breadcrumbs: [
        {
            title: 'Scheduling',
            href: '/scheduling/schedules',
        },
        {
            title: 'Working Hours',
            href: '/scheduling/working-hours',
        },
    ],
};
