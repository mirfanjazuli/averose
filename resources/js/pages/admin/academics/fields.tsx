import { Head } from '@inertiajs/react';
import { Plus, Shapes, UsersRound } from 'lucide-react';
import { AcademicFieldForm } from '@/components/academic-field-form';
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

const fields = [
    {
        name: 'Technology',
        programs: '8 programs',
        subjects: '32 subjects',
        status: 'Active',
    },
    {
        name: 'Business',
        programs: '5 programs',
        subjects: '18 subjects',
        status: 'Active',
    },
    {
        name: 'Creative',
        programs: '4 programs',
        subjects: '14 subjects',
        status: 'Draft',
    },
];

export default function Fields() {
    return (
        <>
            <Head title="Fields" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="font-heading text-2xl font-semibold">
                            Fields
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Manage academic fields that group programs and
                            subjects.
                        </p>
                    </div>
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button className="gap-2">
                                <Plus className="size-4" />
                                Add field
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add field</DialogTitle>
                                <DialogDescription>
                                    Create an academic field for grouping
                                    programs and subjects.
                                </DialogDescription>
                            </DialogHeader>
                            <AcademicFieldForm
                                idPrefix="field"
                                submitLabel="Save field"
                            />
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                        <CardContent className="flex items-center gap-4 px-6 py-5">
                            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                <Shapes className="size-5" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Total fields
                                </p>
                                <p className="text-2xl font-semibold">
                                    {fields.length}
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
                                    Active fields
                                </p>
                                <p className="text-2xl font-semibold">2</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Field list</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {fields.map((field) => (
                            <div
                                key={field.name}
                                className="grid gap-3 rounded-2xl border p-4 md:grid-cols-[minmax(0,1fr)_8rem_8rem_auto]"
                            >
                                <h2 className="font-semibold">{field.name}</h2>
                                <p className="text-sm text-muted-foreground">
                                    {field.programs}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {field.subjects}
                                </p>
                                <Badge
                                    variant={
                                        field.status === 'Active'
                                            ? 'default'
                                            : 'secondary'
                                    }
                                >
                                    {field.status}
                                </Badge>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

Fields.layout = {
    breadcrumbs: [
        {
            title: 'Academics',
            href: '/academics/fields',
        },
        {
            title: 'Fields',
            href: '/academics/fields',
        },
    ],
};
