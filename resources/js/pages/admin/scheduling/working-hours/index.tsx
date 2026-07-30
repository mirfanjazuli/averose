import { Head } from '@inertiajs/react';
import { Clock3, Pencil, TimerReset } from 'lucide-react';
import { useState } from 'react';

import { SummaryCard } from '@/components/admin/summary-card';
import { TableScrollArea } from '@/components/admin/table-scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { formatBadgeLabel, getBadgeProps } from '@/lib/badge';
import { EditDialogWorkingHours } from '@/pages/admin/scheduling/working-hours/edit-dialog-working-hours';

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

    return Math.max(
        0,
        (endHour * 60 + endMinute - (startHour * 60 + startMinute)) / 60,
    );
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
    const [editOpen, setEditOpen] = useState(false);
    const activeDays = workingHours.filter((item) => item.isActive).length;
    const weeklyCapacity = workingHours.reduce(
        (total, item) => total + durationInHours(item),
        0,
    );

    return (
        <>
            <Head title="Working Hours" />
            <div className="flex min-h-full max-w-full min-w-0 flex-1 flex-col gap-6 p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="font-heading text-2xl font-semibold">
                            Working Hours
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Set the weekly availability for scheduling sessions.
                        </p>
                    </div>
                    <Button type="button" onClick={() => setEditOpen(true)}>
                        <Pencil className="size-4" />
                        Edit working hours
                    </Button>
                </div>

                {editOpen && (
                    <EditDialogWorkingHours
                        open
                        onOpenChange={setEditOpen}
                        workingHours={workingHours}
                    />
                )}

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

                <section className="space-y-3">
                    <h2 className="font-heading text-lg font-semibold">
                        Weekly availability
                    </h2>
                    <TableScrollArea>
                        <Table className="w-full">
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Day</TableHead>
                                    <TableHead>Hours</TableHead>
                                    <TableHead>Duration</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {workingHours.map((workingHour) => (
                                    <TableRow key={workingHour.id}>
                                        <TableCell className="font-medium">
                                            {dayLabels[workingHour.dayOfWeek]}
                                        </TableCell>
                                        <TableCell>
                                            {workingHour.isActive &&
                                            workingHour.startTime &&
                                            workingHour.endTime
                                                ? `${workingHour.startTime} - ${workingHour.endTime}`
                                                : '-'}
                                        </TableCell>
                                        <TableCell>
                                            {workingHour.isActive
                                                ? formatDuration(
                                                      durationInHours(
                                                          workingHour,
                                                      ),
                                                  )
                                                : '-'}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                {...getBadgeProps(
                                                    workingHour.isActive
                                                        ? 'success'
                                                        : 'muted',
                                                )}
                                            >
                                                {formatBadgeLabel(
                                                    workingHour.isActive
                                                        ? 'Active'
                                                        : 'Inactive',
                                                )}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableScrollArea>
                </section>
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
