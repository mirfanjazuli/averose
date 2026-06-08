import { Form, Head } from '@inertiajs/react';
import {
    BadgeDollarSign,
    BookOpenCheck,
    Layers3,
    Pencil,
    UsersRound,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

type ProgramItem = {
    id: number;
    name: string;
};

type ProgramVariant = {
    duration: number;
    field: string | null;
    id: number;
    name: string;
    price: string;
    session: number;
    status: string;
};

type Program = {
    description?: string | null;
    field: string;
    fields: ProgramItem[];
    id: number;
    maxReschedule: number;
    name: string;
    slug: string;
    status: string;
    students: string;
    subjects: ProgramItem[];
    subjectsCount: number;
    variants: ProgramVariant[];
};

function formatPrice(price: string): string {
    return new Intl.NumberFormat('id-ID', {
        currency: 'IDR',
        maximumFractionDigits: 0,
        style: 'currency',
    }).format(Number(price));
}

export default function ProgramDetail({ program }: { program: Program }) {
    const [editingVariant, setEditingVariant] =
        useState<ProgramVariant | null>(null);

    return (
        <>
            <Head title={program.name} />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="font-heading text-2xl font-semibold">
                            {program.name}
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Program detail and academic mapping.
                        </p>
                    </div>
                    <Badge
                        variant={
                            program.status === 'active'
                                ? 'default'
                                : 'secondary'
                        }
                    >
                        {program.status}
                    </Badge>
                </div>

                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardContent className="flex items-center gap-4 px-6 py-5">
                            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                <Layers3 className="size-5" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Fields
                                </p>
                                <p className="text-2xl font-semibold">
                                    {program.fields.length}
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
                                    Subjects
                                </p>
                                <p className="text-2xl font-semibold">
                                    {program.subjectsCount}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="flex items-center gap-4 px-6 py-5">
                            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                <BadgeDollarSign className="size-5" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Variants
                                </p>
                                <p className="text-2xl font-semibold">
                                    {program.variants.length}
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
                                    Students
                                </p>
                                <p className="text-2xl font-semibold">0</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_24rem]">
                    <Card>
                        <CardHeader>
                            <CardTitle>Program information</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 text-sm">
                            <div className="grid gap-1">
                                <p className="text-muted-foreground">
                                    Description
                                </p>
                                <p className="font-medium">
                                    {program.description || 'No description.'}
                                </p>
                            </div>
                            <Separator />
                            <div className="grid gap-1">
                                <p className="text-muted-foreground">
                                    Field
                                </p>
                                <p className="font-medium">{program.field}</p>
                            </div>
                            <Separator />
                            <div className="grid gap-1">
                                <p className="text-muted-foreground">
                                    Max reschedule
                                </p>
                                <p className="font-medium">
                                    {program.maxReschedule}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Subjects</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {program.subjects.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    No subjects selected.
                                </p>
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {program.subjects.map((subject) => (
                                        <Badge
                                            key={subject.id}
                                            variant="outline"
                                        >
                                            {subject.name}
                                        </Badge>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Variants</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {program.variants.length === 0 ? (
                            <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                                No variants configured.
                            </div>
                        ) : (
                            <div className="rounded-2xl border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Field</TableHead>
                                            <TableHead>Session</TableHead>
                                            <TableHead>Duration</TableHead>
                                            <TableHead>Price</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="w-12 text-right" />
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {program.variants.map((variant) => (
                                            <TableRow key={variant.id}>
                                                <TableCell className="font-medium">
                                                    {variant.name}
                                                </TableCell>
                                                <TableCell>
                                                    {variant.field ?? '-'}
                                                </TableCell>
                                                <TableCell>
                                                    {variant.session}
                                                </TableCell>
                                                <TableCell>
                                                    {variant.duration} Minutes
                                                </TableCell>
                                                <TableCell>
                                                    {formatPrice(variant.price)}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={
                                                            variant.status ===
                                                            'active'
                                                                ? 'default'
                                                                : 'secondary'
                                                        }
                                                    >
                                                        {variant.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon-sm"
                                                        className="rounded-full"
                                                        onClick={() =>
                                                            setEditingVariant(
                                                                variant,
                                                            )
                                                        }
                                                    >
                                                        <Pencil className="size-4" />
                                                        <span className="sr-only">
                                                            Edit variant
                                                        </span>
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Dialog
                    open={!!editingVariant}
                    onOpenChange={(open) => {
                        if (!open) {
                            setEditingVariant(null);
                        }
                    }}
                >
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Edit variant</DialogTitle>
                            <DialogDescription>
                                Update session, duration, and price for this
                                program variant.
                            </DialogDescription>
                        </DialogHeader>
                        {editingVariant && (
                            <Form
                                key={editingVariant.id}
                                action={`/academics/programs/${program.slug}/variants/${editingVariant.id}`}
                                method="put"
                                disableWhileProcessing
                                onSuccess={() => {
                                    setEditingVariant(null);
                                    toast.success('Variant updated.');
                                }}
                                onError={() => {
                                    toast.error(
                                        'Please check the variant form.',
                                    );
                                }}
                                className="grid gap-4"
                            >
                                {({ processing, errors }) => (
                                    <>
                                        <div className="grid gap-2">
                                            <Label
                                                htmlFor={`variant-${editingVariant.id}-session`}
                                            >
                                                Session
                                            </Label>
                                            <Input
                                                id={`variant-${editingVariant.id}-session`}
                                                name="session"
                                                type="number"
                                                min={1}
                                                defaultValue={
                                                    editingVariant.session
                                                }
                                                aria-invalid={!!errors.session}
                                            />
                                            {errors.session && (
                                                <p className="text-sm text-destructive">
                                                    {errors.session}
                                                </p>
                                            )}
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Duration</Label>
                                            <Select
                                                name="duration"
                                                defaultValue={String(
                                                    editingVariant.duration,
                                                )}
                                            >
                                                <SelectTrigger
                                                    aria-invalid={
                                                        !!errors.duration
                                                    }
                                                >
                                                    <SelectValue placeholder="Select duration" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="60">
                                                        60 Minutes
                                                    </SelectItem>
                                                    <SelectItem value="90">
                                                        90 Minutes
                                                    </SelectItem>
                                                    <SelectItem value="120">
                                                        120 Minutes
                                                    </SelectItem>
                                                    <SelectItem value="180">
                                                        180 Minutes
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {errors.duration && (
                                                <p className="text-sm text-destructive">
                                                    {errors.duration}
                                                </p>
                                            )}
                                        </div>
                                        <div className="grid gap-2">
                                            <Label
                                                htmlFor={`variant-${editingVariant.id}-price`}
                                            >
                                                Price
                                            </Label>
                                            <Input
                                                id={`variant-${editingVariant.id}-price`}
                                                name="price"
                                                type="number"
                                                min={0}
                                                defaultValue={
                                                    editingVariant.price
                                                }
                                                aria-invalid={!!errors.price}
                                            />
                                            {errors.price && (
                                                <p className="text-sm text-destructive">
                                                    {errors.price}
                                                </p>
                                            )}
                                        </div>
                                        <DialogFooter className="pt-2">
                                            <DialogClose asChild>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    disabled={processing}
                                                >
                                                    Cancel
                                                </Button>
                                            </DialogClose>
                                            <Button
                                                type="submit"
                                                disabled={processing}
                                            >
                                                Save changes
                                            </Button>
                                        </DialogFooter>
                                    </>
                                )}
                            </Form>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}

ProgramDetail.layout = {
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
