import { Form, Head, Link, usePage } from '@inertiajs/react';
import { ClipboardList, GraduationCap, Plus, PowerOff } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { EmptyState } from '@/components/admin/empty-state';
import { StatusBadge } from '@/components/admin/status-badge';
import { TableScrollArea } from '@/components/admin/table-scroll-area';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
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
    const page = usePage<{
        flash?: {
            success?: string;
        };
    }>();
    const shownSuccessToast = useRef<string | null>(null);
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

    useEffect(() => {
        if (page.props.flash?.success !== 'Student added.') {
            return;
        }

        if (shownSuccessToast.current === page.props.flash.success) {
            return;
        }

        shownSuccessToast.current = page.props.flash.success;
        toast.success(page.props.flash.success);
    }, [page.props.flash?.success]);

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
                            Student account detail and access status.
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

                <section className="space-y-2">
                    <h2 className="text-md font-heading font-semibold">
                        Enrollments
                    </h2>
                    <Tabs defaultValue="programs" className="space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <TabsList className="grid h-10 w-full max-w-sm grid-cols-2">
                                <TabsTrigger value="programs">
                                    Programs
                                </TabsTrigger>
                                <TabsTrigger value="try-outs">
                                    Try Outs
                                </TabsTrigger>
                            </TabsList>
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
                                    <Button className="ml-auto gap-2">
                                        <Plus className="size-4" />
                                        Add enrollment
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-xl">
                                    <DialogHeader>
                                        <DialogTitle>
                                            Add student access
                                        </DialogTitle>
                                        <DialogDescription>
                                            Assign a program enrollment or
                                            private try out access.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <Tabs
                                        value={accessMode}
                                        onValueChange={(value) =>
                                            setAccessMode(
                                                value as typeof accessMode,
                                            )
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
                                                    toast.success(
                                                        'Enrollment added.',
                                                    );
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
                                                            value={
                                                                selectedProgramId
                                                            }
                                                        />
                                                        <input
                                                            type="hidden"
                                                            name="field_id"
                                                            value={
                                                                selectedFieldId
                                                            }
                                                        />
                                                        <input
                                                            type="hidden"
                                                            name="program_variant_id"
                                                            value={
                                                                selectedVariantId
                                                            }
                                                        />
                                                        <div className="grid gap-2">
                                                            <Label htmlFor="enrollment-program">
                                                                Program
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
                                                                        (
                                                                            program,
                                                                        ) => (
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
                                                                value={
                                                                    selectedFieldId
                                                                }
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
                                                                        (
                                                                            field,
                                                                        ) => (
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
                                                                        (
                                                                            variant,
                                                                        ) => (
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
                                                            <DialogClose
                                                                asChild
                                                            >
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
                                                                disabled={
                                                                    processing
                                                                }
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
                                                            value={
                                                                selectedTryOutId
                                                            }
                                                        />
                                                        <div className="grid gap-2">
                                                            <Label htmlFor="try-out-id">
                                                                Try out
                                                            </Label>
                                                            <Select
                                                                value={
                                                                    selectedTryOutId
                                                                }
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
                                                                        (
                                                                            tryOut,
                                                                        ) => (
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
                                                        <input
                                                            type="hidden"
                                                            name="status"
                                                            value="active"
                                                        />
                                                        <div className="grid gap-2">
                                                            <Label htmlFor="try-out-attempt-quota">
                                                                Attempts
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
                                                        <DialogFooter className="pt-2">
                                                            <DialogClose
                                                                asChild
                                                            >
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
                                                                disabled={
                                                                    processing
                                                                }
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
                        </div>
                        <TabsContent value="programs">
                            {enrollments.length === 0 ? (
                                <EmptyState>
                                    No program enrollments yet.
                                </EmptyState>
                            ) : (
                                <TableScrollArea>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Program</TableHead>
                                                <TableHead>
                                                    Field / Variant
                                                </TableHead>
                                                <TableHead>Sessions</TableHead>
                                                <TableHead>
                                                    Start Date
                                                </TableHead>
                                                <TableHead>Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {enrollments.map((enrollment) => (
                                                <TableRow key={enrollment.id}>
                                                    <TableCell className="font-medium">
                                                        {enrollment.program ??
                                                            '-'}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="space-y-1">
                                                            <p>
                                                                {enrollment.field ??
                                                                    '-'}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {enrollment.variant ??
                                                                    '-'}
                                                            </p>
                                                        </div>
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
                                                                        Last
                                                                        session:{' '}
                                                                        {
                                                                            enrollment.lastSessionDate
                                                                        }
                                                                    </p>
                                                                )}
                                                            {enrollment.maxReschedule !==
                                                                null && (
                                                                <p className="text-xs text-muted-foreground">
                                                                    Max
                                                                    reschedule:{' '}
                                                                    {
                                                                        enrollment.maxReschedule
                                                                    }
                                                                    {enrollment.isMaxRescheduleOverwritten
                                                                        ? ' overwrite'
                                                                        : ''}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {enrollment.startDate ??
                                                            '-'}
                                                    </TableCell>
                                                    <TableCell>
                                                        <StatusBadge
                                                            status={
                                                                enrollment.status
                                                            }
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableScrollArea>
                            )}
                        </TabsContent>
                        <TabsContent value="try-outs" className="mt-4">
                            {tryOutAccesses.length === 0 ? (
                                <EmptyState>
                                    No private try out access yet.
                                </EmptyState>
                            ) : (
                                <TableScrollArea>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Try out</TableHead>
                                                <TableHead>
                                                    Access Period
                                                </TableHead>
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
                                                            {
                                                                access.tryOut
                                                                    .title
                                                            }
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
                                                            {
                                                                access.remainingAttempts
                                                            }{' '}
                                                            left
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <StatusBadge
                                                            status={
                                                                access.status
                                                            }
                                                        />
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
                                                            {({
                                                                processing,
                                                            }) => (
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
                                </TableScrollArea>
                            )}
                        </TabsContent>
                    </Tabs>
                </section>
            </div>
        </>
    );
}
