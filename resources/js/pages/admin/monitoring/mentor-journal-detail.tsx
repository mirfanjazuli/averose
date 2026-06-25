import { Head } from '@inertiajs/react';
import {
    BookOpenCheck,
    CalendarDays,
    Clock3,
    NotebookPen,
    Target,
    TrendingUp,
    UserRound,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { noteVariants } from './mentor-journal-data';
import type { MentorJournal } from './mentor-journal-data';

export default function MentorJournalDetail({
    journal,
}: {
    journal: MentorJournal;
}) {
    return (
        <>
            <Head title={journal.sessionName} />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="font-heading text-2xl font-semibold">
                            {journal.sessionName}
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Mentor journal detail for student progress and next
                            session planning.
                        </p>
                    </div>
                    <Badge
                        variant={noteVariants[journal.note]}
                        className="capitalize"
                    >
                        {journal.note}
                    </Badge>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardContent className="flex items-center gap-4 px-6 py-5">
                            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                <CalendarDays className="size-5" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Date
                                </p>
                                <p className="font-medium">{journal.date}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="flex items-center gap-4 px-6 py-5">
                            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                <Clock3 className="size-5" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Duration
                                </p>
                                <p className="font-medium">
                                    {journal.duration}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="flex items-center gap-4 px-6 py-5">
                            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                <BookOpenCheck className="size-5" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Subject
                                </p>
                                <p className="font-medium">
                                    {journal.subject}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Session information</CardTitle>
                        <CardDescription>
                            Mentor, student, and class context.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Mentor
                                </p>
                                <p className="mt-1 font-medium">
                                    {journal.mentor}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Student
                                </p>
                                <p className="mt-1 font-medium">
                                    {journal.student}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Session name
                                </p>
                                <p className="mt-1 font-medium">
                                    {journal.sessionName}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Note
                                </p>
                                <Badge
                                    variant={noteVariants[journal.note]}
                                    className="mt-1 capitalize"
                                >
                                    {journal.note}
                                </Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Student progress</CardTitle>
                        <CardDescription>
                            Achievement, focus area, and follow-up plan for the
                            next meeting.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 lg:grid-cols-3">
                            <div className="rounded-2xl border p-4">
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="size-4 text-primary" />
                                    <h2 className="font-medium">
                                        Achievement
                                    </h2>
                                </div>
                                <p className="mt-3 text-sm text-muted-foreground">
                                    {journal.achievement}
                                </p>
                            </div>
                            <div className="rounded-2xl border p-4">
                                <div className="flex items-center gap-2">
                                    <Target className="size-4 text-primary" />
                                    <h2 className="font-medium">
                                        Area to improve
                                    </h2>
                                </div>
                                <p className="mt-3 text-sm text-muted-foreground">
                                    {journal.improvementArea}
                                </p>
                            </div>
                            <div className="rounded-2xl border p-4">
                                <div className="flex items-center gap-2">
                                    <NotebookPen className="size-4 text-primary" />
                                    <h2 className="font-medium">
                                        Next improvement plan
                                    </h2>
                                </div>
                                <p className="mt-3 text-sm text-muted-foreground">
                                    {journal.nextImprovementPlan}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Participants</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-3 md:grid-cols-2">
                            <div className="flex items-center gap-3 rounded-2xl border p-4">
                                <UserRound className="size-5 text-primary" />
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Mentor
                                    </p>
                                    <p className="font-medium">
                                        {journal.mentor}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 rounded-2xl border p-4">
                                <UserRound className="size-5 text-primary" />
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Student
                                    </p>
                                    <p className="font-medium">
                                        {journal.student}
                                    </p>
                                </div>
                            </div>
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
            title: 'Monitoring',
            href: '/monitoring/mentor-journals',
        },
        {
            title: 'Mentor Journals',
            href: '/monitoring/mentor-journals',
        },
    ],
};
