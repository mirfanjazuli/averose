import { Form, Link } from '@inertiajs/react';
import { ClipboardList, GraduationCap, Plus, PowerOff } from 'lucide-react';
import type { ComponentProps } from 'react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { formatBadgeLabel, getBadgeProps } from '@/lib/badge';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserDetailPage } from '@/pages/admin/users/components/user-detail-page';

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

type TryOutAccess = {
    attemptQuota: number;
    attemptsUsed: number;
    availableFrom: string;
    availableUntil: string;
    id: number;
    remainingAttempts: number;
    status: string;
    statusValue: string;
    tryOut: {
        slug: string;
        title: string;
    };
};

type TryOutOption = {
    id: string;
    title: string;
};

const accessStatusClassName = (status: string) => {
    if (status === 'Active') {
        return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    }

    if (status === 'Expired' || status === 'Exhausted') {
        return 'border-destructive/20 bg-destructive/10 text-destructive';
    }

    return undefined;
};

export default function StudentDetail({
    enrollments,
    programOptions,
    tryOutAccesses,
    tryOutOptions,
    user,
}: {
    enrollments: Enrollment[];
    programOptions: ProgramOption[];
    tryOutAccesses: TryOutAccess[];
    tryOutOptions: TryOutOption[];
    user: User;
}) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [accessMode, setAccessMode] = useState<'program' | 'try-out'>(
        'program',
    );
    const [selectedProgramId, setSelectedProgramId] = useState('');
    const [selectedFieldId, setSelectedFieldId] = useState('');
    const [selectedVariantId, setSelectedVariantId] = useState('');
    const [selectedTryOutId, setSelectedTryOutId] = useState('');

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
        setSelectedTryOutId('');
        setAccessMode('program');
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
                                Add access
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-xl">
                            <DialogHeader>
                                <DialogTitle>Add student access</DialogTitle>
                                <DialogDescription>
                                    Assign a program enrollment or private try
                                    out access.
                                </DialogDescription>
                            </DialogHeader>
                            <Tabs
                                value={accessMode}
                                onValueChange={(value) =>
                                    setAccessMode(value as typeof accessMode)
                                }
                            >
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="program">
                                        <GraduationCap className="size-4" />
                                        Program
                                    </TabsTrigger>
                                    <TabsTrigger value="try-out">
                                        <ClipboardList className="size-4" />
                                        Try Out
                                    </TabsTrigger>
                                </TabsList>
                                <TabsContent value="program">
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
                                        className="grid gap-5 pt-3"
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
                                                        value={
                                                            selectedProgramId
                                                        }
                                                        onValueChange={(
                                                            value,
                                                        ) => {
                                                            setSelectedProgramId(
                                                                value,
                                                            );
                                                            setSelectedFieldId(
                                                                '',
                                                            );
                                                            setSelectedVariantId(
                                                                '',
                                                            );
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
                                                                        {
                                                                            program.label
                                                                        }
                                                                    </SelectItem>
                                                                ),
                                                            )}
                                                        </SelectContent>
                                                    </Select>
                                                    <InputError
                                                        message={
                                                            errors.program_id
                                                        }
                                                    />
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label htmlFor="enrollment-field">
                                                        Field
                                                    </Label>
                                                    <Select
                                                        value={selectedFieldId}
                                                        onValueChange={(
                                                            value,
                                                        ) => {
                                                            setSelectedFieldId(
                                                                value,
                                                            );
                                                            setSelectedVariantId(
                                                                '',
                                                            );
                                                        }}
                                                        disabled={
                                                            !selectedProgram
                                                        }
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
                                                                        key={
                                                                            field.id
                                                                        }
                                                                        value={
                                                                            field.id
                                                                        }
                                                                    >
                                                                        {
                                                                            field.label
                                                                        }
                                                                    </SelectItem>
                                                                ),
                                                            )}
                                                        </SelectContent>
                                                    </Select>
                                                    <InputError
                                                        message={
                                                            errors.field_id
                                                        }
                                                    />
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label htmlFor="enrollment-variant">
                                                        Variant
                                                    </Label>
                                                    <Select
                                                        value={
                                                            selectedVariantId
                                                        }
                                                        onValueChange={
                                                            setSelectedVariantId
                                                        }
                                                        disabled={
                                                            !selectedFieldId
                                                        }
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
                                                                        {
                                                                            variant.label
                                                                        }
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
                                                        message={
                                                            errors.start_date
                                                        }
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
                                                        message={
                                                            errors.max_reschedule
                                                        }
                                                    />
                                                </div>
                                                <DialogFooter className="pt-2">
                                                    <DialogClose asChild>
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            disabled={
                                                                processing
                                                            }
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
                                </TabsContent>
                                <TabsContent value="try-out">
                                    <Form
                                        action={`/users/students/${user.slug}/try-out-access`}
                                        method="post"
                                        resetOnSuccess
                                        disableWhileProcessing
                                        onSuccess={() => {
                                            setDialogOpen(false);
                                            resetFormState();
                                            toast.success(
                                                'Try out access added.',
                                            );
                                        }}
                                        onError={() =>
                                            toast.error(
                                                'Please check the try out access form.',
                                            )
                                        }
                                        className="grid gap-5 pt-3"
                                    >
                                        {({ processing, errors }) => (
                                            <>
                                                <input
                                                    type="hidden"
                                                    name="try_out_id"
                                                    value={selectedTryOutId}
                                                />
                                                <div className="grid gap-2">
                                                    <Label htmlFor="try-out-id">
                                                        Try out
                                                    </Label>
                                                    <Select
                                                        value={selectedTryOutId}
                                                        onValueChange={
                                                            setSelectedTryOutId
                                                        }
                                                    >
                                                        <SelectTrigger
                                                            id="try-out-id"
                                                            className="w-full"
                                                            aria-invalid={
                                                                !!errors.try_out_id
                                                            }
                                                        >
                                                            <SelectValue placeholder="Select private try out" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {tryOutOptions.map(
                                                                (tryOut) => (
                                                                    <SelectItem
                                                                        key={
                                                                            tryOut.id
                                                                        }
                                                                        value={
                                                                            tryOut.id
                                                                        }
                                                                    >
                                                                        {
                                                                            tryOut.title
                                                                        }
                                                                    </SelectItem>
                                                                ),
                                                            )}
                                                        </SelectContent>
                                                    </Select>
                                                    <InputError
                                                        message={
                                                            errors.try_out_id
                                                        }
                                                    />
                                                </div>
                                                <div className="grid gap-4 md:grid-cols-2">
                                                    <div className="grid gap-2">
                                                        <Label htmlFor="try-out-start-date">
                                                            Start date
                                                        </Label>
                                                        <Input
                                                            id="try-out-start-date"
                                                            name="available_from"
                                                            type="date"
                                                            aria-invalid={
                                                                !!errors.available_from
                                                            }
                                                        />
                                                        <InputError
                                                            message={
                                                                errors.available_from
                                                            }
                                                        />
                                                    </div>
                                                    <div className="grid gap-2">
                                                        <Label htmlFor="try-out-end-date">
                                                            End date
                                                        </Label>
                                                        <Input
                                                            id="try-out-end-date"
                                                            name="available_until"
                                                            type="date"
                                                            aria-invalid={
                                                                !!errors.available_until
                                                            }
                                                        />
                                                        <InputError
                                                            message={
                                                                errors.available_until
                                                            }
                                                        />
                                                    </div>
                                                </div>
                                                <div className="grid gap-4 md:grid-cols-2">
                                                    <div className="grid gap-2">
                                                        <Label htmlFor="try-out-attempt-quota">
                                                            Attempt quota
                                                        </Label>
                                                        <Input
                                                            id="try-out-attempt-quota"
                                                            name="attempt_quota"
                                                            type="number"
                                                            min="1"
                                                            defaultValue="1"
                                                            aria-invalid={
                                                                !!errors.attempt_quota
                                                            }
                                                        />
                                                        <InputError
                                                            message={
                                                                errors.attempt_quota
                                                            }
                                                        />
                                                    </div>
                                                    <div className="grid gap-2">
                                                        <Label htmlFor="try-out-status">
                                                            Status
                                                        </Label>
                                                        <Select
                                                            name="status"
                                                            defaultValue="active"
                                                        >
                                                            <SelectTrigger
                                                                id="try-out-status"
                                                                className="w-full"
                                                                aria-invalid={
                                                                    !!errors.status
                                                                }
                                                            >
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="active">
                                                                    Active
                                                                </SelectItem>
                                                                <SelectItem value="inactive">
                                                                    Inactive
                                                                </SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <InputError
                                                            message={
                                                                errors.status
                                                            }
                                                        />
                                                    </div>
                                                </div>
                                                <DialogFooter className="pt-2">
                                                    <DialogClose asChild>
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            disabled={
                                                                processing
                                                            }
                                                        >
                                                            Cancel
                                                        </Button>
                                                    </DialogClose>
                                                    <Button
                                                        type="submit"
                                                        disabled={processing}
                                                    >
                                                        Save access
                                                    </Button>
                                                </DialogFooter>
                                            </>
                                        )}
                                    </Form>
                                </TabsContent>
                            </Tabs>
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
                                                {enrollment.maxReschedule ??
                                                    '-'}
                                                {enrollment.isMaxRescheduleOverwritten && (
                                                    <span className="ml-2 text-xs text-muted-foreground">
                                                        overwrite
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Badge {...getBadgeProps()}>
                                                    {formatBadgeLabel(
                                                        enrollment.status,
                                                    )}
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

            <Card>
                <CardHeader>
                    <CardTitle>Try out access</CardTitle>
                </CardHeader>
                <CardContent>
                    {tryOutAccesses.length === 0 ? (
                        <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                            No private try out access yet.
                        </div>
                    ) : (
                        <div className="rounded-2xl border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Try out</TableHead>
                                        <TableHead>Availability</TableHead>
                                        <TableHead>Attempts</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="w-12 text-right" />
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {tryOutAccesses.map((access) => (
                                        <TableRow key={access.id}>
                                            <TableCell className="font-medium">
                                                <Link
                                                    href={`/academics/try-outs/${access.tryOut.slug}`}
                                                    className="hover:text-primary"
                                                >
                                                    {access.tryOut.title}
                                                </Link>
                                            </TableCell>
                                            <TableCell>
                                                {access.availableFrom} -{' '}
                                                {access.availableUntil}
                                            </TableCell>
                                            <TableCell>
                                                {access.attemptsUsed}/
                                                {access.attemptQuota}
                                                <span className="ml-2 text-xs text-muted-foreground">
                                                    {access.remainingAttempts}{' '}
                                                    left
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    {...getBadgeProps(
                                                        'outline',
                                                        accessStatusClassName(
                                                            access.status,
                                                        ),
                                                    )}
                                                >
                                                    {formatBadgeLabel(
                                                        access.status,
                                                    )}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Form
                                                    action={`/users/students/${user.slug}/try-out-access/${access.id}`}
                                                    method="delete"
                                                    onSuccess={() =>
                                                        toast.success(
                                                            'Try out access deactivated.',
                                                        )
                                                    }
                                                    onError={() =>
                                                        toast.error(
                                                            'Unable to deactivate try out access.',
                                                        )
                                                    }
                                                >
                                                    {({ processing }) => (
                                                        <Button
                                                            type="submit"
                                                            variant="ghost"
                                                            size="icon-sm"
                                                            disabled={
                                                                processing
                                                            }
                                                            className="rounded-full text-muted-foreground hover:text-destructive"
                                                        >
                                                            <PowerOff className="size-4" />
                                                            <span className="sr-only">
                                                                Deactivate
                                                                access
                                                            </span>
                                                        </Button>
                                                    )}
                                                </Form>
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
