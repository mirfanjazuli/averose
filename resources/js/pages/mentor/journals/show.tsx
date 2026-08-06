import { Head, Link } from '@inertiajs/react';
import type { ReactNode } from 'react';

import { JournalAttachmentList } from '@/components/journal-attachment-list';
import type { JournalAttachment } from '@/components/journal-attachment-list';
import { useUserTimezone } from '@/hooks/use-user-timezone';
import { formatDate, formatDateTime, formatTimeRange } from '@/lib/date-time';

type MentorJournal = {
    achievement: string;
    attachments: JournalAttachment[];
    completedAt: string;
    id: string;
    improvementArea: string;
    nextImprovementPlan: string;
    program: string;
    scheduleCode: string;
    scheduleId: string | null;
    sessionEndAt: string | null;
    sessionStartAt: string;
    slug: string;
    student: string;
    subject: string;
};

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
    return (
        <div className="grid min-h-10 gap-2 md:grid-cols-[14rem_1fr] md:items-center">
            <p className="text-sm text-muted-foreground">{label}</p>
            <div className="text-sm font-medium">{value}</div>
        </div>
    );
}

function ProgressNote({
    children,
    title,
}: {
    children: string;
    title: string;
}) {
    return (
        <article className="min-w-0 py-5 md:px-6 md:first:pl-0 md:last:pr-0">
            <h3 className="text-sm font-semibold">{title}</h3>
            <p className="mt-2 text-sm leading-6 whitespace-pre-line text-muted-foreground">
                {children || '-'}
            </p>
        </article>
    );
}

export default function MentorJournalDetail({
    journal,
}: {
    journal: MentorJournal;
}) {
    const timezone = useUserTimezone();

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
                            href={`/schedules/${journal.scheduleId}`}
                            className="text-sm font-medium text-primary hover:underline"
                        >
                            View schedule
                        </Link>
                    )}
                </div>

                <section className="space-y-4">
                    <h2 className="font-heading text-lg font-semibold">
                        Session details
                    </h2>
                    <div className="space-y-1.5">
                        <DetailRow label="Student" value={journal.student} />
                        <DetailRow label="Program" value={journal.program} />
                        <DetailRow label="Subject" value={journal.subject} />
                        <DetailRow
                            label="Date"
                            value={formatDate(journal.sessionStartAt, timezone)}
                        />
                        <DetailRow
                            label="Time"
                            value={
                                journal.sessionEndAt
                                    ? formatTimeRange(journal.sessionStartAt, journal.sessionEndAt, timezone)
                                    : '-'
                            }
                        />
                        <DetailRow
                            label="Completed at"
                            value={formatDateTime(journal.completedAt, timezone)}
                        />
                    </div>
                </section>

                <section className="space-y-4">
                    <h2 className="font-heading text-lg font-semibold">
                        Learning progress
                    </h2>
                    <div className="divide-y border-y md:grid md:grid-cols-3 md:divide-x md:divide-y-0">
                        <ProgressNote title="Achievement">
                            {journal.achievement}
                        </ProgressNote>
                        <ProgressNote title="Area to improve">
                            {journal.improvementArea}
                        </ProgressNote>
                        <ProgressNote title="Next focus">
                            {journal.nextImprovementPlan}
                        </ProgressNote>
                    </div>
                </section>

                {journal.attachments.length > 0 && (
                    <section className="space-y-4">
                        <h2 className="font-heading text-lg font-semibold">
                            Attachments
                        </h2>
                        <JournalAttachmentList
                            attachments={journal.attachments}
                        />
                    </section>
                )}
            </div>
        </>
    );
}

MentorJournalDetail.layout = {
    breadcrumbs: [
        {
            title: 'Journals',
            href: '/journals',
        },
        {
            title: 'Journal',
            href: '#',
        },
    ],
};
