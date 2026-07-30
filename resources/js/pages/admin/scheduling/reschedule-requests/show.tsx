import { Head } from '@inertiajs/react';
import { Check, X } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatBadgeLabel, getBadgeProps } from '@/lib/badge';
import {
    ApproveRescheduleDialog,
    RejectRescheduleDialog,
} from './components/review-dialogs';

type RescheduleRequestDetail = {
    adminNote: string | null;
    currentEndAt: string;
    currentStartAt: string;
    id: string;
    mentor: string;
    notes: string | null;
    reason: string;
    requestedEndAt: string;
    requestedStartAt: string;
    reviewedAt: string | null;
    reviewer: string | null;
    scheduleCode: string;
    session: string;
    status: string;
    student: string;
};

function formatDate(value: string) {
    return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    }).format(new Date(value));
}

function formatTimeRange(startAt: string, endAt: string) {
    const formatter = new Intl.DateTimeFormat('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
    });

    return `${formatter.format(new Date(startAt))} - ${formatter.format(new Date(endAt))} WIB`;
}

function formatTime(value: string) {
    const formatter = new Intl.DateTimeFormat('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
    });

    return `${formatter.format(new Date(value))} WIB`;
}

function formatDateTime(value: string | null) {
    if (!value) {
        return null;
    }

    return `${formatDate(value)}, ${formatTime(value)}`;
}

function DetailItem({ label, value }: { label: string; value: string | null }) {
    return (
        <div className="grid min-h-10 gap-2 md:grid-cols-[12rem_1fr] md:items-start">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-sm">{value || '-'}</p>
        </div>
    );
}

export default function RescheduleRequestDetail({
    request,
}: {
    request: RescheduleRequestDetail;
}) {
    const [approveDialogOpen, setApproveDialogOpen] = useState(false);
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
    const isPending = request.status === 'Pending';

    return (
        <>
            <Head title={request.scheduleCode} />
            <div className="flex min-h-full max-w-full min-w-0 flex-1 flex-col gap-6 p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <div className="flex flex-wrap items-center gap-3">
                            <h1 className="font-heading text-2xl font-semibold">
                                {request.scheduleCode}
                            </h1>
                            <Badge
                                {...getBadgeProps(
                                    request.status === 'Approved'
                                        ? 'success'
                                        : request.status === 'Rejected'
                                          ? 'danger'
                                          : 'muted',
                                )}
                            >
                                {formatBadgeLabel(request.status)}
                            </Badge>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Review requested schedule changes before approval.
                        </p>
                    </div>
                    {isPending && (
                        <div className="flex flex-wrap gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                className="gap-2"
                                onClick={() => setRejectDialogOpen(true)}
                            >
                                <X className="size-4" />
                                Reject
                            </Button>
                            <Button
                                type="button"
                                className="gap-2"
                                onClick={() => setApproveDialogOpen(true)}
                            >
                                <Check className="size-4" />
                                Approve
                            </Button>
                        </div>
                    )}
                </div>

                <section className="space-y-6">
                    <div className="grid gap-6 lg:grid-cols-2">
                        <div className="space-y-1.5">
                            <h2 className="text-sm font-semibold">
                                Current Schedule
                            </h2>
                            <DetailItem
                                label="Date"
                                value={formatDate(request.currentStartAt)}
                            />
                            <DetailItem
                                label="Time"
                                value={formatTimeRange(
                                    request.currentStartAt,
                                    request.currentEndAt,
                                )}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <h2 className="text-sm font-semibold">
                                Requested Schedule
                            </h2>
                            <DetailItem
                                label="Date"
                                value={formatDate(request.requestedStartAt)}
                            />
                            <DetailItem
                                label="Time"
                                value={formatTimeRange(
                                    request.requestedStartAt,
                                    request.requestedEndAt,
                                )}
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <h2 className="text-sm font-semibold">
                            Session Information
                        </h2>
                        <DetailItem label="Student" value={request.student} />
                        <DetailItem label="Subject" value={request.session} />
                        <DetailItem label="Mentor" value={request.mentor} />
                    </div>

                    <div className="space-y-1.5">
                        <h2 className="text-sm font-semibold">Request Notes</h2>
                        <DetailItem label="Reason" value={request.reason} />
                        <DetailItem label="Notes" value={request.notes} />
                        <DetailItem
                            label="Rejection reason"
                            value={request.adminNote}
                        />
                        <DetailItem
                            label="Reviewed at"
                            value={formatDateTime(request.reviewedAt)}
                        />
                        <DetailItem
                            label="Reviewed by"
                            value={request.reviewer}
                        />
                    </div>
                </section>

                <ApproveRescheduleDialog
                    open={approveDialogOpen}
                    requestId={request.id}
                    onOpenChange={setApproveDialogOpen}
                />
                <RejectRescheduleDialog
                    open={rejectDialogOpen}
                    requestId={request.id}
                    onOpenChange={setRejectDialogOpen}
                />
            </div>
        </>
    );
}

RescheduleRequestDetail.layout = {
    breadcrumbs: [
        {
            title: 'Scheduling',
            href: '/scheduling/schedules',
        },
        {
            title: 'Reschedule Requests',
            href: '/scheduling/reschedule-requests',
        },
        {
            title: 'Request',
            href: '#',
        },
    ],
};
