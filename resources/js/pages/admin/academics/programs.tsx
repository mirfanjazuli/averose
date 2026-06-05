import { Head } from '@inertiajs/react';
import { Layers3, Plus, UsersRound } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const programFieldOptions = [
    {
        id: 'technology',
        label: 'Technology',
        subjects: [
            { id: 'react-fundamentals', label: 'React Fundamentals' },
            { id: 'laravel-backend', label: 'Laravel Backend' },
            { id: 'database-design', label: 'Database Design' },
        ],
        variants: [
            { id: 'bootcamp', label: 'Bootcamp' },
            { id: 'private-mentoring', label: 'Private Mentoring' },
            { id: 'project-based', label: 'Project Based' },
        ],
    },
    {
        id: 'business',
        label: 'Business',
        subjects: [
            { id: 'business-strategy', label: 'Business Strategy' },
            { id: 'growth-marketing', label: 'Growth Marketing' },
            { id: 'financial-planning', label: 'Financial Planning' },
        ],
        variants: [
            { id: 'workshop', label: 'Workshop' },
            { id: 'cohort', label: 'Cohort' },
        ],
    },
    {
        id: 'creative',
        label: 'Creative',
        subjects: [
            { id: 'product-design', label: 'Product Design' },
            { id: 'design-systems', label: 'Design Systems' },
            { id: 'brand-identity', label: 'Brand Identity' },
        ],
        variants: [
            { id: 'portfolio-review', label: 'Portfolio Review' },
            { id: 'studio-session', label: 'Studio Session' },
        ],
    },
];

const programs = [
    {
        name: 'Frontend Engineering',
        field: 'Technology',
        subjects: '9 subjects',
        students: '42 students',
        status: 'Active',
    },
    {
        name: 'Laravel Backend',
        field: 'Technology',
        subjects: '8 subjects',
        students: '36 students',
        status: 'Active',
    },
    {
        name: 'Product Design',
        field: 'Creative',
        subjects: '7 subjects',
        students: '28 students',
        status: 'Draft',
    },
];

export default function Programs() {
    const [selectedFields, setSelectedFields] = useState<string[]>([]);
    const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
    const [selectedVariants, setSelectedVariants] = useState<string[]>([]);

    const availableSubjects = useMemo(
        () =>
            programFieldOptions
                .filter((field) => selectedFields.includes(field.id))
                .flatMap((field) => field.subjects),
        [selectedFields],
    );

    const availableVariants = useMemo(
        () =>
            programFieldOptions
                .filter((field) => selectedFields.includes(field.id))
                .flatMap((field) => field.variants),
        [selectedFields],
    );

    function toggleField(fieldId: string, checked: boolean) {
        const nextFields = checked
            ? [...selectedFields, fieldId]
            : selectedFields.filter((id) => id !== fieldId);

        const validSubjectIds = programFieldOptions
            .filter((field) => nextFields.includes(field.id))
            .flatMap((field) => field.subjects.map((subject) => subject.id));
        const validVariantIds = programFieldOptions
            .filter((field) => nextFields.includes(field.id))
            .flatMap((field) => field.variants.map((variant) => variant.id));

        setSelectedFields(nextFields);
        setSelectedSubjects((currentSubjects) =>
            currentSubjects.filter((id) => validSubjectIds.includes(id)),
        );
        setSelectedVariants((currentVariants) =>
            currentVariants.filter((id) => validVariantIds.includes(id)),
        );
    }

    function toggleSubject(subjectId: string, checked: boolean) {
        setSelectedSubjects((currentSubjects) =>
            checked
                ? [...currentSubjects, subjectId]
                : currentSubjects.filter((id) => id !== subjectId),
        );
    }

    function toggleVariant(variantId: string, checked: boolean) {
        setSelectedVariants((currentVariants) =>
            checked
                ? [...currentVariants, variantId]
                : currentVariants.filter((id) => id !== variantId),
        );
    }

    return (
        <>
            <Head title="Programs" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="font-heading text-2xl font-semibold">
                            Programs
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Manage learning programs and their academic field.
                        </p>
                    </div>
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button className="gap-2">
                                <Plus className="size-4" />
                                Add program
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>Add program</DialogTitle>
                                <DialogDescription>
                                    Create a program and map its fields,
                                    subjects, and variants.
                                </DialogDescription>
                            </DialogHeader>
                            <form
                                className="grid gap-5"
                                onSubmit={(event) => event.preventDefault()}
                            >
                                <div className="grid gap-2">
                                    <Label htmlFor="program-name">Name</Label>
                                    <Input
                                        id="program-name"
                                        name="name"
                                        placeholder="Program name"
                                        autoComplete="off"
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="program-description">
                                        Description
                                    </Label>
                                    <Textarea
                                        id="program-description"
                                        name="description"
                                        placeholder="Short program description"
                                        className="min-h-28 resize-none rounded-2xl bg-background px-4 text-sm"
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="program-max-reschedule">
                                        Max reschedule
                                    </Label>
                                    <Input
                                        id="program-max-reschedule"
                                        name="max_reschedule"
                                        type="number"
                                        min={0}
                                        placeholder="3"
                                    />
                                </div>

                                <div className="grid gap-3">
                                    <Label>Fields</Label>
                                    <div className="grid gap-2 rounded-2xl border p-3 sm:grid-cols-3">
                                        {programFieldOptions.map((field) => (
                                            <label
                                                key={field.id}
                                                htmlFor={`program-field-${field.id}`}
                                                className="flex cursor-pointer items-center gap-2 rounded-xl px-2 py-2 text-sm hover:bg-accent"
                                            >
                                                <Checkbox
                                                    id={`program-field-${field.id}`}
                                                    name="fields[]"
                                                    value={field.id}
                                                    checked={selectedFields.includes(
                                                        field.id,
                                                    )}
                                                    onCheckedChange={(
                                                        checked,
                                                    ) =>
                                                        toggleField(
                                                            field.id,
                                                            checked === true,
                                                        )
                                                    }
                                                />
                                                <span>{field.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid gap-3">
                                    <Label>Subjects</Label>
                                    <div className="grid gap-2 rounded-2xl border p-3 sm:grid-cols-2">
                                        {availableSubjects.length > 0 ? (
                                            availableSubjects.map((subject) => (
                                                <label
                                                    key={subject.id}
                                                    htmlFor={`program-subject-${subject.id}`}
                                                    className="flex cursor-pointer items-center gap-2 rounded-xl px-2 py-2 text-sm hover:bg-accent"
                                                >
                                                    <Checkbox
                                                        id={`program-subject-${subject.id}`}
                                                        name="subjects[]"
                                                        value={subject.id}
                                                        checked={selectedSubjects.includes(
                                                            subject.id,
                                                        )}
                                                        onCheckedChange={(
                                                            checked,
                                                        ) =>
                                                            toggleSubject(
                                                                subject.id,
                                                                checked ===
                                                                    true,
                                                            )
                                                        }
                                                    />
                                                    <span>{subject.label}</span>
                                                </label>
                                            ))
                                        ) : (
                                            <p className="px-2 py-2 text-sm text-muted-foreground">
                                                Select fields first.
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="grid gap-3">
                                    <Label>Variant</Label>
                                    <div className="grid gap-2 rounded-2xl border p-3 sm:grid-cols-2">
                                        {availableVariants.length > 0 ? (
                                            availableVariants.map((variant) => (
                                                <label
                                                    key={variant.id}
                                                    htmlFor={`program-variant-${variant.id}`}
                                                    className="flex cursor-pointer items-center gap-2 rounded-xl px-2 py-2 text-sm hover:bg-accent"
                                                >
                                                    <Checkbox
                                                        id={`program-variant-${variant.id}`}
                                                        name="variants[]"
                                                        value={variant.id}
                                                        checked={selectedVariants.includes(
                                                            variant.id,
                                                        )}
                                                        onCheckedChange={(
                                                            checked,
                                                        ) =>
                                                            toggleVariant(
                                                                variant.id,
                                                                checked ===
                                                                    true,
                                                            )
                                                        }
                                                    />
                                                    <span>{variant.label}</span>
                                                </label>
                                            ))
                                        ) : (
                                            <p className="px-2 py-2 text-sm text-muted-foreground">
                                                Select fields first.
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <DialogFooter className="pt-2">
                                    <DialogClose asChild>
                                        <Button type="button" variant="outline">
                                            Cancel
                                        </Button>
                                    </DialogClose>
                                    <Button type="submit">Save program</Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                        <CardContent className="flex items-center gap-4 px-6 py-5">
                            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                <Layers3 className="size-5" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Total programs
                                </p>
                                <p className="text-2xl font-semibold">
                                    {programs.length}
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
                                    Enrolled students
                                </p>
                                <p className="text-2xl font-semibold">106</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Program list</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {programs.map((program) => (
                            <div
                                key={program.name}
                                className="grid gap-3 rounded-2xl border p-4 md:grid-cols-[minmax(0,1fr)_9rem_8rem_8rem_auto]"
                            >
                                <h2 className="font-semibold">
                                    {program.name}
                                </h2>
                                <Badge variant="outline">{program.field}</Badge>
                                <p className="text-sm text-muted-foreground">
                                    {program.subjects}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {program.students}
                                </p>
                                <Badge
                                    variant={
                                        program.status === 'Active'
                                            ? 'default'
                                            : 'secondary'
                                    }
                                >
                                    {program.status}
                                </Badge>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

Programs.layout = {
    breadcrumbs: [
        {
            title: 'Academics',
            href: '/academics/fields',
        },
        {
            title: 'Programs',
            href: '/academics/programs',
        },
    ],
};
