import { Form } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import type { ComponentProps } from 'react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import InputError from '@/components/input-error';
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
import { DialogClose, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { UserDetailPage } from '@/components/user-detail-page';

type User = ComponentProps<typeof UserDetailPage>['user'];

type Enrollment = {
    field: string | null;
    id: number;
    isMaxRescheduleOverwritten: boolean;
    lastSessionDate: string | null;
    maxReschedule: number | null;
    program: string | null;
    sessionsRemaining: number;
    startDate: string | null;
    status: string;
    variant: string | null;
};

type ProgramOption = {
    fields: {
        id: string;
        label: string;
    }[];
    id: string;
    label: string;
    maxReschedule: number;
    variants: {
        duration: number;
        fieldId: string;
        id: string;
        label: string;
        price: string;
        session: number;
        status: string;
    }[];
};

export default function StudentDetail({
    enrollments,
    programOptions,
    user,
}: {
    enrollments: Enrollment[];
    programOptions: ProgramOption[];
    user: User;
}) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedProgramId, setSelectedProgramId] = useState('');
    const [selectedFieldId, setSelectedFieldId] = useState('');
    const [selectedVariantId, setSelectedVariantId] = useState('');

    const selectedProgram = useMemo(
        () =>
            programOptions.find((program) => program.id === selectedProgramId),
        [programOptions, selectedProgramId],
    );
    const fieldOptions = selectedProgram?.fields ?? [];
    const variantOptions = useMemo(
        () =>
            (selectedProgram?.variants ?? []).filter(
                (variant) => variant.fieldId === selectedFieldId,
            ),
        [selectedFieldId, selectedProgram],
    );

    const resetFormState = () => {
        setSelectedProgramId('');
        setSelectedFieldId('');
        setSelectedVariantId('');
    };

    return (
        <UserDetailPage
            backHref="/users/students"
            description="Student account detail and access status."
            title="Student"
            user={user}
        >
            <Card>
                <CardHeader className="gap-4 md:flex-row md:items-center md:justify-between">
                    <CardTitle>Program enrollments</CardTitle>
                    <Dialog
                        open={dialogOpen}
                        onOpenChange={(open) => {
                            setDialogOpen(open);

                            if (!open) {
                                resetFormState();
                            }
                        }}
                    >
                        <DialogTrigger asChild>
                            <Button className="gap-2">
                                <Plus className="size-4" />
                                Add enrollment
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add enrollment</DialogTitle>
                                <DialogDescription>
                                    Assign this student to a program and
                                    session variant.
                                </DialogDescription>
                            </DialogHeader>
                            <Form
                                action={`/users/students/${user.slug}/enrollments`}
                                method="post"
                                resetOnSuccess
                                disableWhileProcessing
                                onSuccess={() => {
                                    setDialogOpen(false);
                                    resetFormState();
                                    toast.success('Enrollment added.');
                                }}
                                onError={() =>
                                    toast.error(
                                        'Please check the enrollment form.',
                                    )
                                }
                                className="grid gap-5"
                            >
                                {({ processing, errors }) => (
                                    <>
                                        <input
                                            type="hidden"
                                            name="program_id"
                                            value={selectedProgramId}
                                        />
                                        <input
                                            type="hidden"
                                            name="field_id"
                                            value={selectedFieldId}
                                        />
                                        <input
                                            type="hidden"
                                            name="program_variant_id"
                                            value={selectedVariantId}
                                        />
                                        <div className="grid gap-2">
                                            <Label htmlFor="enrollment-program">
                                                Name
                                            </Label>
                                            <Select
                                                value={selectedProgramId}
                                                onValueChange={(value) => {
                                                    setSelectedProgramId(value);
                                                    setSelectedFieldId('');
                                                    setSelectedVariantId('');
                                                }}
                                            >
                                                <SelectTrigger
                                                    id="enrollment-program"
                                                    className="w-full"
                                                    aria-invalid={
                                                        !!errors.program_id
                                                    }
                                                >
                                                    <SelectValue placeholder="Select program" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {programOptions.map(
                                                        (program) => (
                                                            <SelectItem
                                                                key={
                                                                    program.id
                                                                }
                                                                value={
                                                                    program.id
                                                                }
                                                            >
                                                                {program.label}
                                                            </SelectItem>
                                                        ),
                                                    )}
                                                </SelectContent>
                                            </Select>
                                            <InputError
                                                message={errors.program_id}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="enrollment-field">
                                                Field
                                            </Label>
                                            <Select
                                                value={selectedFieldId}
                                                onValueChange={(value) => {
                                                    setSelectedFieldId(value);
                                                    setSelectedVariantId('');
                                                }}
                                                disabled={!selectedProgram}
                                            >
                                                <SelectTrigger
                                                    id="enrollment-field"
                                                    className="w-full"
                                                    aria-invalid={
                                                        !!errors.field_id
                                                    }
                                                >
                                                    <SelectValue placeholder="Select field" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {fieldOptions.map(
                                                        (field) => (
                                                            <SelectItem
                                                                key={field.id}
                                                                value={field.id}
                                                            >
                                                                {field.label}
                                                            </SelectItem>
                                                        ),
                                                    )}
                                                </SelectContent>
                                            </Select>
                                            <InputError
                                                message={errors.field_id}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="enrollment-variant">
                                                Variant
                                            </Label>
                                            <Select
                                                value={selectedVariantId}
                                                onValueChange={
                                                    setSelectedVariantId
                                                }
                                                disabled={!selectedFieldId}
                                            >
                                                <SelectTrigger
                                                    id="enrollment-variant"
                                                    className="w-full"
                                                    aria-invalid={
                                                        !!errors.program_variant_id
                                                    }
                                                >
                                                    <SelectValue placeholder="Select variant" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {variantOptions.map(
                                                        (variant) => (
                                                            <SelectItem
                                                                key={
                                                                    variant.id
                                                                }
                                                                value={
                                                                    variant.id
                                                                }
                                                            >
                                                                {variant.label}
                                                            </SelectItem>
                                                        ),
                                                    )}
                                                </SelectContent>
                                            </Select>
                                            <InputError
                                                message={
                                                    errors.program_variant_id
                                                }
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="enrollment-start-date">
                                                Start date
                                            </Label>
                                            <Input
                                                id="enrollment-start-date"
                                                name="start_date"
                                                type="date"
                                                aria-invalid={
                                                    !!errors.start_date
                                                }
                                            />
                                            <InputError
                                                message={errors.start_date}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="enrollment-max-reschedule">
                                                Max reschedule
                                            </Label>
                                            <Input
                                                id="enrollment-max-reschedule"
                                                name="max_reschedule"
                                                type="number"
                                                min="0"
                                                placeholder={
                                                    selectedProgram
                                                        ? `Default ${selectedProgram.maxReschedule}`
                                                        : 'Optional overwrite'
                                                }
                                                aria-invalid={
                                                    !!errors.max_reschedule
                                                }
                                            />
                                            <InputError
                                                message={errors.max_reschedule}
                                            />
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
                                                Save enrollment
                                            </Button>
                                        </DialogFooter>
                                    </>
                                )}
                            </Form>
                        </DialogContent>
                    </Dialog>
                </CardHeader>
                <CardContent>
                    {enrollments.length === 0 ? (
                        <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                            No program enrollments yet.
                        </div>
                    ) : (
                        <div className="rounded-2xl border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Field</TableHead>
                                        <TableHead>Variant</TableHead>
                                        <TableHead>Start date</TableHead>
                                        <TableHead>Sessions left</TableHead>
                                        <TableHead>Max reschedule</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {enrollments.map((enrollment) => (
                                        <TableRow key={enrollment.id}>
                                            <TableCell className="font-medium">
                                                {enrollment.program ?? '-'}
                                            </TableCell>
                                            <TableCell>
                                                {enrollment.field ?? '-'}
                                            </TableCell>
                                            <TableCell>
                                                {enrollment.variant ?? '-'}
                                            </TableCell>
                                            <TableCell>
                                                {enrollment.startDate ?? '-'}
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-1">
                                                    <p className="font-medium">
                                                        {
                                                            enrollment.sessionsRemaining
                                                        }{' '}
                                                        left
                                                    </p>
                                                    {enrollment.sessionsRemaining ===
                                                        0 &&
                                                        enrollment.lastSessionDate && (
                                                            <p className="text-xs text-muted-foreground">
                                                                Last session:{' '}
                                                                {
                                                                    enrollment.lastSessionDate
                                                                }
                                                            </p>
                                                        )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {enrollment.maxReschedule ?? '-'}
                                                {enrollment.isMaxRescheduleOverwritten && (
                                                    <span className="ml-2 text-xs text-muted-foreground">
                                                        overwrite
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Badge>
                                                    {enrollment.status}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </UserDetailPage>
    );
}
