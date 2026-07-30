import { Head, Link } from '@inertiajs/react';
import type { ReactNode } from 'react';

import { JournalAttachmentList } from '@/components/journal-attachment-list';

import type { MentorJournal } from './data';

const dateFormatter = new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
});

const timeFormatter = new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
});

function formatDate(value: string) {
    return dateFormatter.format(new Date(value));
}

function formatTime(value: string) {
    return timeFormatter.format(new Date(value));
}

function formatDateTime(value: string) {
    return `${formatDate(value)}, ${formatTime(value)} WIB`;
}

export default function MentorJournalDetail({
    journal,
}: {
    journal: MentorJournal;
}) {
    return (
        <>
            <Head title={journal.scheduleCode} />
            <div className="flex min-h-full max-w-full min-w-0 flex-1 flex-col gap-8 p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <h1 className="font-heading text-2xl font-semibold">
                        {journal.scheduleCode}
                    </h1>
                    {journal.scheduleId && (
                        <Link
                            href={`/scheduling/schedules/${journal.scheduleId}`}
                            className="text-sm font-medium text-primary hover:underline"
                        >
                            View schedule
                        </Link>
                    )}
                </div>

                <section className="space-y-4">
                    <h2 className="text-base font-semibold">
                        Session Information
                    </h2>
                    <div className="grid max-w-4xl gap-x-10 gap-y-3 md:grid-cols-2">
                        <InfoItem label="Mentor" value={journal.mentor} />
                        <InfoItem label="Student" value={journal.student} />
                        <InfoItem label="Program" value={journal.program} />
                        <InfoItem label="Subject" value={journal.subject} />
                        <InfoItem
                            label="Date"
                            value={formatDate(journal.sessionStartAt)}
                        />
                        <InfoItem
                            label="Time"
                            value={
                                journal.sessionEndAt
                                    ? `${formatTime(journal.sessionStartAt)} - ${formatTime(journal.sessionEndAt)} WIB`
                                    : '-'
                            }
                        />
                        <InfoItem
                            label="Completed at"
                            value={formatDateTime(journal.completedAt)}
                        />
                    </div>
                </section>

                <section className="space-y-4">
                    <h2 className="text-base font-semibold">
                        Student Progress
                    </h2>
                    <div className="grid gap-x-10 gap-y-6 lg:grid-cols-3">
                        <ProgressItem
                            label="Achievement"
                            value={journal.achievement}
                        />
                        <ProgressItem
                            label="Area to improve"
                            value={journal.improvementArea}
                        />
                        <ProgressItem
                            label="Next focus"
                            value={journal.nextImprovementPlan}
                        />
                    </div>
                </section>

                {journal.attachments.length > 0 && (
                    <section className="space-y-4">
                        <h2 className="text-base font-semibold">Attachments</h2>
                        <JournalAttachmentList
                            attachments={journal.attachments}
                        />
                    </section>
                )}
            </div>
        </>
    );
}

function InfoItem({ label, value }: { label: string; value: ReactNode }) {
    return (
        <div className="grid min-h-10 grid-cols-[8rem_minmax(0,1fr)] items-center gap-4">
            <p className="text-sm text-muted-foreground">{label}</p>
            <div className="min-w-0 text-sm font-medium">{value}</div>
        </div>
    );
}

function ProgressItem({ label, value }: { label: string; value: string }) {
    return (
        <div className="space-y-2">
            <h3 className="text-sm font-medium">{label}</h3>
            <p className="text-sm leading-6 text-muted-foreground">
                {value || '-'}
            </p>
        </div>
    );
}

MentorJournalDetail.layout = {
    breadcrumbs: [
        {
            title: 'Monitoring',
            href: '/monitoring/mentor-journals',
        },
        {
            title: 'Mentor Journals',
            href: '/monitoring/mentor-journals',
        },
    ],
};
