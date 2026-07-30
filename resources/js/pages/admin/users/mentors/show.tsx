import { Head } from '@inertiajs/react';
import { EmptyState } from '@/components/admin/empty-state';
import { StatusBadge } from '@/components/admin/status-badge';
import { TableScrollArea } from '@/components/admin/table-scroll-area';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
type User = {
    createdAt: string | null;
    email: string;
    id: number;
    name: string;
    nickname: string | null;
    slug: string;
    status: string;
    updatedAt: string | null;
};

type MentorLevel = {
    id: number;
    name: string;
    status: string;
};

type ExpertiseSubject = {
    id: string;
    name: string;
};

type TeachingJournal = {
    date: string;
    duration: string;
    id: string;
    program: string;
    status: string;
    student: string;
    subject: string;
    time: string;
};

export default function MentorDetail({
    expertiseSubjects,
    resolvedMentorLevel,
    teachingJournals,
    user,
}: {
    expertiseSubjects: ExpertiseSubject[];
    resolvedMentorLevel: MentorLevel | null;
    teachingJournals: TeachingJournal[];
    user: User;
}) {
    return (
        <>
            <Head title={user.name} />
            <div className="flex h-full max-w-full min-w-0 flex-1 flex-col gap-6 overflow-hidden p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="font-heading text-2xl font-semibold">
                            {user.name}
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Mentor account detail and access status.
                        </p>
                    </div>
                </div>

                <section className="space-y-4">
                    <div className="space-y-1.5">
                        <div className="grid min-h-10 gap-2 md:grid-cols-[14rem_1fr] md:items-center">
                            <p className="text-sm text-muted-foreground">
                                Nickname
                            </p>
                            <p className="text-sm">{user.nickname ?? '-'}</p>
                        </div>
                        <div className="grid min-h-10 gap-2 md:grid-cols-[14rem_1fr] md:items-center">
                            <p className="text-sm text-muted-foreground">
                                Email
                            </p>
                            <p className="text-sm">{user.email}</p>
                        </div>
                        <div className="grid min-h-10 gap-2 md:grid-cols-[14rem_1fr] md:items-center">
                            <p className="text-sm text-muted-foreground">
                                Level
                            </p>
                            <p className="text-sm">
                                {resolvedMentorLevel?.name ?? '-'}
                            </p>
                        </div>
                        <div className="grid min-h-10 gap-2 md:grid-cols-[14rem_1fr] md:items-center">
                            <p className="text-sm text-muted-foreground">
                                Expertise
                            </p>
                            <p className="text-sm">
                                {expertiseSubjects.length > 0
                                    ? expertiseSubjects
                                          .map((subject) => subject.name)
                                          .join(', ')
                                    : '-'}
                            </p>
                        </div>
                        <div className="grid min-h-10 gap-2 md:grid-cols-[14rem_1fr] md:items-center">
                            <p className="text-sm text-muted-foreground">
                                Status
                            </p>
                            <div>
                                <StatusBadge status={user.status} />
                            </div>
                        </div>
                        <div className="grid min-h-10 gap-2 md:grid-cols-[14rem_1fr] md:items-center">
                            <p className="text-sm text-muted-foreground">
                                Created
                            </p>
                            <p className="text-sm">{user.createdAt ?? '-'}</p>
                        </div>
                        <div className="grid min-h-10 gap-2 md:grid-cols-[14rem_1fr] md:items-center">
                            <p className="text-sm text-muted-foreground">
                                Last updated
                            </p>
                            <p className="text-sm">{user.updatedAt ?? '-'}</p>
                        </div>
                    </div>
                </section>

                <section className="space-y-4">
                    <h2 className="font-heading text-lg font-semibold">
                        Teaching journal
                    </h2>
                    {teachingJournals.length === 0 ? (
                        <EmptyState>No teaching journal yet.</EmptyState>
                    ) : (
                        <TableScrollArea>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Session</TableHead>
                                        <TableHead>Student</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Time</TableHead>
                                        <TableHead>Duration</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {teachingJournals.map((journal) => (
                                        <TableRow key={journal.id}>
                                            <TableCell>
                                                <p className="font-medium">
                                                    {journal.subject}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {journal.program}
                                                </p>
                                            </TableCell>
                                            <TableCell>
                                                {journal.student}
                                            </TableCell>
                                            <TableCell>
                                                {journal.date}
                                            </TableCell>
                                            <TableCell>
                                                {journal.time}
                                            </TableCell>
                                            <TableCell>
                                                {journal.duration}
                                            </TableCell>
                                            <TableCell>
                                                <StatusBadge
                                                    status={journal.status}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableScrollArea>
                    )}
                </section>
            </div>
        </>
    );
}
