import { Head } from '@inertiajs/react';
import { ExternalLink } from 'lucide-react';
import type { ReactNode } from 'react';
import { StatusBadge } from '@/components/admin/status-badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUserTimezone } from '@/hooks/use-user-timezone';
import { formatBadgeLabel } from '@/lib/badge';
import { formatDate, formatDateTime, formatTimeRange } from '@/lib/date-time';

type ScheduleHistory = {
    action: string;
    createdAt: string;
    description: string;
    id: string;
};

type ScheduleFeedback = {
    audioQualityRating: number;
    comment: string | null;
    interactivityRating: number;
    materialClarityRating: number;
    visualQualityRating: number;
};

type ScheduleJournal = {
    completedAt: string;
    slug: string;
};

type PendingRescheduleRequest = {
    reason: string;
    requestedAt: string;
    status: string;
};

type ScheduleDetail = {
    code: string;
    createdVia: string;
    deliveryMode: string;
    duration: number;
    endAt: string;
    feedback: ScheduleFeedback | null;
    histories: ScheduleHistory[];
    id: string;
    journal: ScheduleJournal | null;
    pendingRescheduleRequest: PendingRescheduleRequest | null;
    program: string;
    startAt: string;
    status: string;
    student: string;
    subject: string;
    zoomAccount: string | null;
    zoomLink: string | null;
    zoomMeetingId: string | null;
};

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
    return (
        <div className="grid min-h-10 gap-2 md:grid-cols-[11rem_1fr] md:items-center">
            <p className="text-sm text-muted-foreground">{label}</p>
            <div className="min-w-0 text-sm font-medium">{value}</div>
        </div>
    );
}

export default function MentorScheduleDetail({
    schedule,
}: {
    schedule: ScheduleDetail;
}) {
    const timezone = useUserTimezone();

    return (
        <>
            <Head title={schedule.code} />
            <div className="flex min-h-full max-w-full min-w-0 flex-1 flex-col gap-8 p-4">
                <h1 className="font-heading text-2xl font-semibold">
                    {schedule.code}
                </h1>

                <section className="grid gap-8 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                    <div className="space-y-8">
                        <div className="space-y-4">
                            <h2 className="font-heading text-lg font-semibold">
                                Session details
                            </h2>
                            <div className="space-y-1.5">
                                <DetailRow
                                    label="Student"
                                    value={schedule.student}
                                />
                                <DetailRow
                                    label="Program"
                                    value={schedule.program}
                                />
                                <DetailRow
                                    label="Subject"
                                    value={schedule.subject}
                                />
                                <DetailRow
                                    label="Date"
                                    value={formatDate(schedule.startAt, timezone)}
                                />
                                <DetailRow
                                    label="Time"
                                    value={formatTimeRange(schedule.startAt, schedule.endAt, timezone)}
                                />
                                <DetailRow
                                    label="Duration"
                                    value={`${schedule.duration} minutes`}
                                />
                                <DetailRow
                                    label="Created via"
                                    value={schedule.createdVia}
                                />
                                <DetailRow
                                    label="Delivery"
                                    value={formatBadgeLabel(
                                        schedule.deliveryMode,
                                    )}
                                />
                                <DetailRow
                                    label="Status"
                                    value={
                                        <StatusBadge status={schedule.status} />
                                    }
                                />
                                {schedule.pendingRescheduleRequest && (
                                    <>
                                        <DetailRow
                                            label="Requested schedule"
                                            value={formatDateTime(
                                                schedule
                                                    .pendingRescheduleRequest
                                                    .requestedAt,
                                                timezone,
                                            )}
                                        />
                                        <DetailRow
                                            label="Reschedule reason"
                                            value={
                                                schedule
                                                    .pendingRescheduleRequest
                                                    .reason
                                            }
                                        />
                                        <DetailRow
                                            label="Reschedule status"
                                            value={
                                                <StatusBadge
                                                    status={
                                                        schedule
                                                            .pendingRescheduleRequest
                                                            .status
                                                    }
                                                />
                                            }
                                        />
                                    </>
                                )}
                                {schedule.deliveryMode === 'online' && (
                                    <DetailRow
                                        label="Meeting link"
                                        value={
                                            schedule.zoomLink ? (
                                            <a
                                                href={schedule.zoomLink}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex max-w-full items-center gap-1.5 text-primary hover:underline"
                                            >
                                                <span className="truncate">
                                                    {schedule.zoomLink}
                                                </span>
                                                <ExternalLink className="size-3.5 shrink-0" />
                                            </a>
                                            ) : (
                                                '-'
                                            )
                                        }
                                    />
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="min-w-0 space-y-4">
                        <h2 className="font-heading text-lg font-semibold">
                            Schedule history
                        </h2>
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
                                                    {formatDateTime(
                                                        history.createdAt,
                                                        timezone,
                                                    )}
                                                </p>
                                            </div>
                                            <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                                {history.description}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                No schedule history recorded yet.
                            </p>
                        )}
                    </div>
                </section>

            </div>
        </>
    );
}

MentorScheduleDetail.layout = {
    breadcrumbs: [
        {
            title: 'Schedules',
            href: '/schedules',
        },
        {
            title: 'Schedule',
            href: '#',
        },
    ],
};
