import { Head } from '@inertiajs/react';
import { Clock3, LibraryBig, Plus } from 'lucide-react';
import { AcademicSubjectForm } from '@/components/academic-subject-form';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';

const subjects = [
    {
        name: 'React Fundamentals',
        program: 'Frontend Engineering',
        duration: '6 sessions',
        status: 'Active',
    },
    {
        name: 'Database Design',
        program: 'Laravel Backend',
        duration: '5 sessions',
        status: 'Active',
    },
    {
        name: 'Design Systems',
        program: 'Product Design',
        duration: '4 sessions',
        status: 'Draft',
    },
];

export default function Subjects() {
    return (
        <>
            <Head title="Subjects" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="font-heading text-2xl font-semibold">
                            Subjects
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Manage subject modules inside each learning program.
                        </p>
                    </div>
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button className="gap-2">
                                <Plus className="size-4" />
                                Add subject
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add subject</DialogTitle>
                                <DialogDescription>
                                    Create a subject module and assign its
                                    display icon.
                                </DialogDescription>
                            </DialogHeader>
                            <AcademicSubjectForm
                                idPrefix="subject"
                                submitLabel="Save subject"
                            />
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                        <CardContent className="flex items-center gap-4 px-6 py-5">
                            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                <LibraryBig className="size-5" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Total subjects
                                </p>
                                <p className="text-2xl font-semibold">
                                    {subjects.length}
                                </p>
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
                                    Active sessions
                                </p>
                                <p className="text-2xl font-semibold">15</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Subject list</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {subjects.map((subject) => (
                            <div
                                key={subject.name}
                                className="grid gap-3 rounded-2xl border p-4 md:grid-cols-[minmax(0,1fr)_12rem_8rem_auto]"
                            >
                                <h2 className="font-semibold">
                                    {subject.name}
                                </h2>
                                <Badge variant="outline">
                                    {subject.program}
                                </Badge>
                                <p className="text-sm text-muted-foreground">
                                    {subject.duration}
                                </p>
                                <Badge
                                    variant={
                                        subject.status === 'Active'
                                            ? 'default'
                                            : 'secondary'
                                    }
                                >
                                    {subject.status}
                                </Badge>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

Subjects.layout = {
    breadcrumbs: [
        {
            title: 'Academics',
            href: '/academics/fields',
        },
        {
            title: 'Subjects',
            href: '/academics/subjects',
        },
    ],
};
