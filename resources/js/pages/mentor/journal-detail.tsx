import { Head } from '@inertiajs/react';
import { NotebookPen, Target, TrendingUp } from 'lucide-react';
import type { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type MentorJournal = {
    achievement: string;
    date: string;
    duration: string;
    id: string;
    improvementArea: string;
    nextImprovementPlan: string;
    program: string;
    sessionName: string;
    slug: string;
    student: string;
    subject: string;
    time: string;
};

function InfoItem({
    label,
    value,
}: {
    label: string;
    value: ReactNode;
}) {
    return (
        <div>
            <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
                {label}
            </p>
            <div className="mt-1 font-medium">{value}</div>
        </div>
    );
}

function ProgressCard({
    children,
    icon,
    title,
}: {
    children: string;
    icon: ReactNode;
    title: string;
}) {
    return (
        <div className="rounded-lg border p-4">
            <div className="flex items-center gap-2">
                {icon}
                <h2 className="font-medium">{title}</h2>
            </div>
            <p className="mt-3 whitespace-pre-line text-sm text-muted-foreground">
                {children}
            </p>
        </div>
    );
}

export default function MentorJournalDetail({
    journal,
}: {
    journal: MentorJournal;
}) {
    return (
        <>
            <Head title={journal.sessionName} />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4">
                <div className="min-w-0">
                    <h1 className="font-heading text-2xl font-semibold">
                        {journal.student}
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {journal.subject} · {journal.program}
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Session details</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
                            <InfoItem
                                label="Student"
                                value={journal.student}
                            />
                            <InfoItem
                                label="Program"
                                value={journal.program}
                            />
                            <InfoItem
                                label="Subject"
                                value={journal.subject}
                            />
                            <InfoItem
                                label="Date"
                                value={journal.date}
                            />
                            <InfoItem
                                label="Time"
                                value={journal.time}
                            />
                            <InfoItem
                                label="Duration"
                                value={journal.duration}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Progress notes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 lg:grid-cols-3">
                            <ProgressCard
                                title="Achievement"
                                icon={
                                    <TrendingUp className="size-4 text-primary" />
                                }
                            >
                                {journal.achievement}
                            </ProgressCard>
                            <ProgressCard
                                title="Area to improve"
                                icon={
                                    <Target className="size-4 text-primary" />
                                }
                            >
                                {journal.improvementArea}
                            </ProgressCard>
                            <ProgressCard
                                title="Next focus"
                                icon={
                                    <NotebookPen className="size-4 text-primary" />
                                }
                            >
                                {journal.nextImprovementPlan}
                            </ProgressCard>
                        </div>
                    </CardContent>
                </Card>
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
            title: 'Detail',
            href: '#',
        },
    ],
};
