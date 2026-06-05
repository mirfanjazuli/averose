import { Head } from '@inertiajs/react';
import {
    BookOpenCheck,
    CheckCircle2,
    ClipboardList,
    Clock3,
    FilePenLine,
    Plus,
    UsersRound,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

const tryOuts = [
    {
        title: 'Frontend Basics Assessment',
        subject: 'Frontend Basics',
        duration: '45 min',
        questions: 30,
        participants: 64,
        status: 'Published',
    },
    {
        title: 'React Component Practice',
        subject: 'React Advanced',
        duration: '60 min',
        questions: 40,
        participants: 38,
        status: 'Published',
    },
    {
        title: 'UI Design Foundation',
        subject: 'UI Design',
        duration: '35 min',
        questions: 25,
        participants: 42,
        status: 'Draft',
    },
];

const results = [
    {
        name: 'Alya Prameswari',
        tryOut: 'UI Design Foundation',
        score: '88',
        status: 'Passed',
    },
    {
        name: 'Megan Norton',
        tryOut: 'Frontend Basics Assessment',
        score: '84',
        status: 'Passed',
    },
    {
        name: 'Dimas Santoso',
        tryOut: 'React Component Practice',
        score: '72',
        status: 'Review',
    },
];

export default function AdminTryOuts() {
    return (
        <>
            <Head title="Try Out" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="font-heading text-2xl font-semibold">
                            Try Out
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Manage assessments, question sets, and student
                            results.
                        </p>
                    </div>
                    <Button className="gap-2">
                        <Plus className="size-4" />
                        Add try out
                    </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardContent className="flex items-center gap-4 px-6 py-5">
                            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                <ClipboardList className="size-5" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Total try outs
                                </p>
                                <p className="mt-1 text-2xl font-semibold">
                                    3
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="flex items-center gap-4 px-6 py-5">
                            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                <CheckCircle2 className="size-5" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Published
                                </p>
                                <p className="mt-1 text-2xl font-semibold">
                                    2
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="flex items-center gap-4 px-6 py-5">
                            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                <UsersRound className="size-5" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Participants
                                </p>
                                <p className="mt-1 text-2xl font-semibold">
                                    144
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_24rem]">
                    <Card>
                        <CardHeader>
                            <CardTitle>Try out list</CardTitle>
                            <CardDescription>
                                Active and draft assessments available for
                                students.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {tryOuts.map((item) => (
                                <div
                                    key={item.title}
                                    className="grid gap-4 rounded-2xl border p-4 md:grid-cols-[auto_minmax(0,1fr)_auto]"
                                >
                                    <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                        <BookOpenCheck className="size-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h2 className="font-semibold">
                                                {item.title}
                                            </h2>
                                            <Badge
                                                variant={
                                                    item.status === 'Published'
                                                        ? 'secondary'
                                                        : 'outline'
                                                }
                                            >
                                                {item.status}
                                            </Badge>
                                        </div>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            {item.subject}
                                        </p>
                                        <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
                                            <span className="flex items-center gap-1.5">
                                                <Clock3 className="size-4" />
                                                {item.duration}
                                            </span>
                                            <span>
                                                {item.questions} questions
                                            </span>
                                            <span>
                                                {item.participants} participants
                                            </span>
                                        </div>
                                    </div>
                                    <Button variant="outline" size="sm">
                                        <FilePenLine className="size-4" />
                                        Edit
                                    </Button>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Latest results</CardTitle>
                            <CardDescription>
                                Recent student try out submissions.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {results.map((item) => (
                                <div
                                    key={`${item.name}-${item.tryOut}`}
                                    className="rounded-2xl border p-4"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="font-medium">
                                                {item.name}
                                            </p>
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                {item.tryOut}
                                            </p>
                                        </div>
                                        <Badge
                                            variant={
                                                item.status === 'Passed'
                                                    ? 'secondary'
                                                    : 'outline'
                                            }
                                        >
                                            {item.status}
                                        </Badge>
                                    </div>
                                    <p className="mt-4 text-3xl font-semibold">
                                        {item.score}
                                    </p>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}

AdminTryOuts.layout = {
    breadcrumbs: [
        {
            title: 'Academics',
            href: '/academics/fields',
        },
        {
            title: 'Try Out',
            href: '/academics/try-outs',
        },
    ],
};
