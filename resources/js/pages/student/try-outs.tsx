import { Head } from '@inertiajs/react';
import {
    ArrowUpRight,
    BookOpenCheck,
    CheckCircle2,
    ClipboardCheck,
    Clock3,
    Trophy,
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
        status: 'Available',
    },
    {
        title: 'React Component Practice',
        subject: 'React Advanced',
        duration: '60 min',
        questions: 40,
        status: 'Available',
    },
    {
        title: 'UI Design Foundation',
        subject: 'UI Design',
        duration: '35 min',
        questions: 25,
        status: 'Completed',
    },
];

const history = [
    {
        title: 'UI Design Foundation',
        score: '88',
        result: 'Passed',
        date: 'May 28',
    },
    {
        title: 'HTML & CSS Fundamentals',
        score: '81',
        result: 'Passed',
        date: 'May 18',
    },
];

export default function StudentTryOuts() {
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
                            Practice with timed assessments and review your
                            latest results.
                        </p>
                    </div>
                    <Button variant="outline" className="gap-2">
                        View results
                        <ArrowUpRight className="size-4" />
                    </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardContent className="flex items-center gap-4 px-6 py-5">
                            <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                <ClipboardCheck className="size-5" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Available tests
                                </p>
                                <p className="mt-1 text-2xl font-semibold">
                                    2
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="flex items-center gap-4 px-6 py-5">
                            <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                <Trophy className="size-5" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Best score
                                </p>
                                <p className="mt-1 text-2xl font-semibold">
                                    88
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="flex items-center gap-4 px-6 py-5">
                            <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                <CheckCircle2 className="size-5" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Completed
                                </p>
                                <p className="mt-1 text-2xl font-semibold">
                                    2
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
                    <Card>
                        <CardHeader>
                            <CardTitle>Available try outs</CardTitle>
                            <CardDescription>
                                Pick an assessment when you are ready.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {tryOuts.map((item) => (
                                <div
                                    key={item.title}
                                    className="grid gap-4 rounded-lg border p-4 md:grid-cols-[auto_minmax(0,1fr)_auto]"
                                >
                                    <div className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                        <BookOpenCheck className="size-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h2 className="font-semibold">
                                                {item.title}
                                            </h2>
                                            <Badge
                                                variant={
                                                    item.status === 'Available'
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
                                        </div>
                                    </div>
                                    <Button
                                        variant={
                                            item.status === 'Available'
                                                ? 'default'
                                                : 'outline'
                                        }
                                        size="sm"
                                    >
                                        {item.status === 'Available'
                                            ? 'Start'
                                            : 'Review'}
                                    </Button>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Recent results</CardTitle>
                            <CardDescription>
                                Your latest try out performance.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {history.map((item) => (
                                <div
                                    key={item.title}
                                    className="rounded-lg border p-4"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="font-medium">
                                                {item.title}
                                            </p>
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                {item.date}
                                            </p>
                                        </div>
                                        <Badge variant="secondary">
                                            {item.result}
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

StudentTryOuts.layout = {
    breadcrumbs: [
        {
            title: 'Try Out',
            href: '/try-outs',
        },
    ],
};
