import { Head } from '@inertiajs/react';
import { UserRoundCheck } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUserTimezone } from '@/hooks/use-user-timezone';
import { formatBadgeLabel, getBadgeProps, getStatusBadgeTone } from '@/lib/badge';
import {
    formatDate,
    formatDateTime,
    formatTimeRange,
} from '@/lib/date-time';

type ScheduleHistory = {
    action: string;
    createdAt: string;
    description: string;
    id: string;
};

type ScheduleDetail = {
    code: string;
    deliveryMode: string;
    duration: number;
    endAt: string;
    histories: ScheduleHistory[];
    id: string;
    mentor: string;
    program: string;
    startAt: string;
    status: string;
    student: string;
    title: string;
    zoomAccount: string | null;
    zoomLink: string | null;
};

function DetailItem({ label, value }: { label: string; value: string | null }) {
    return (
        <div className="grid min-h-9 gap-1 md:grid-cols-[9rem_1fr] md:items-start">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-sm font-medium">{value || '-'}</p>
        </div>
    );
}

export default function ScheduleDetail({
    schedule,
}: {
    schedule: ScheduleDetail;
}) {
    const timezone = useUserTimezone();

    return (
        <>
            <Head title={schedule.code} />
            <div className="flex min-h-full min-w-0 max-w-full flex-1 flex-col gap-6 p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <div className="flex flex-wrap items-center gap-3">
                            <h1 className="font-heading text-2xl font-semibold">
                                {schedule.code}
                            </h1>
                            <Badge
                                {...getBadgeProps(
                                    getStatusBadgeTone(schedule.status),
                                )}
                            >
                                {formatBadgeLabel(schedule.status)}
                            </Badge>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Track session information and every schedule change.
                        </p>
                    </div>
                </div>

                <section className="grid gap-8 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                    <div className="space-y-6">
                        <div className="space-y-3">
                            <h2 className="text-sm font-semibold">
                                Session
                            </h2>
                            <div className="space-y-2">
                                <DetailItem
                                    label="Student"
                                    value={schedule.student}
                                />
                                <DetailItem
                                    label="Program"
                                    value={schedule.program}
                                />
                                <DetailItem
                                    label="Subject"
                                    value={schedule.title}
                                />
                                <DetailItem
                                    label="Date"
                                    value={formatDate(schedule.startAt, timezone)}
                                />
                                <DetailItem
                                    label="Time"
                                    value={formatTimeRange(schedule.startAt, schedule.endAt, timezone)}
                                />
                                <DetailItem
                                    label="Duration"
                                    value={`${schedule.duration} minutes`}
                                />
                                <DetailItem
                                    label="Delivery"
                                    value={String(
                                        formatBadgeLabel(schedule.deliveryMode),
                                    )}
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h2 className="text-sm font-semibold">
                                Meeting
                            </h2>
                            <div className="space-y-2">
                                <DetailItem
                                    label="Mentor"
                                    value={schedule.mentor}
                                />
                                {schedule.deliveryMode === 'online' && (
                                    <>
                                        <DetailItem
                                            label="Zoom account"
                                            value={schedule.zoomAccount}
                                        />
                                        <DetailItem
                                            label="Zoom link"
                                            value={schedule.zoomLink}
                                        />
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <UserRoundCheck className="size-4 text-primary" />
                            <h2 className="text-sm font-semibold">
                                Schedule History
                            </h2>
                        </div>
                        {schedule.histories.length > 0 ? (
                            <ScrollArea className="max-h-[34rem] pr-4">
                                <div className="space-y-5">
                                    {schedule.histories.map((history) => (
                                        <div
                                            key={history.id}
                                            className="relative pl-6 before:absolute before:top-2 before:left-1.5 before:size-2 before:rounded-full before:bg-primary after:absolute after:top-5 after:bottom-[-1.25rem] after:left-[0.5625rem] after:w-px after:bg-border last:after:hidden"
                                        >
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <p className="text-sm font-semibold">
                                                    {formatBadgeLabel(
                                                        history.action,
                                                    )}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {formatDateTime(history.createdAt, timezone, {
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                        month: 'short',
                                                        timeZoneName: 'short',
                                                        year: 'numeric',
                                                    })}
                                                </p>
                                            </div>
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                {history.description}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                No schedule history has been recorded yet.
                            </p>
                        )}
                    </div>
                </section>
            </div>
        </>
    );
}

ScheduleDetail.layout = {
    breadcrumbs: [
        {
            title: 'Scheduling',
            href: '/scheduling/schedules',
        },
        {
            title: 'Schedules',
            href: '/scheduling/schedules',
        },
        {
            title: 'Schedule',
            href: '#',
        },
    ],
};
