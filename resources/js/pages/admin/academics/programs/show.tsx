import { Form, Head } from '@inertiajs/react';
import {
    Check,
    ChevronsUpDown,
    Copy,
    Pencil,
    Plus,
    PowerOff,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ActionMenu } from '@/components/admin/action-menu';
import { EmptyState } from '@/components/admin/empty-state';
import { StatusBadge } from '@/components/admin/status-badge';
import { TableScrollArea } from '@/components/admin/table-scroll-area';
import InputError from '@/components/input-error';
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
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
import { cn } from '@/lib/utils';

type ProgramOption = {
    id: string;
    label: string;
};

type ProgramFieldOption = ProgramOption & {
    subjects: ProgramOption[];
};

type ProgramField = {
    id: number;
    name: string;
    subjectIds: number[];
};

type ProgramItem = {
    id: number;
    name: string;
};

type ProgramVariant = {
    duration: number;
    field: string | null;
    fieldId: number;
    id: number;
    name: string;
    price: string;
    session: number;
    status: string;
};

type Program = {
    description?: string | null;
    field: string;
    fields: ProgramField[];
    id: number;
    maxReschedule: number;
    name: string;
    slug: string;
    status: string;
    subjects: ProgramItem[];
    subjectsCount: number;
    thumbnailUrl?: string | null;
    variants: ProgramVariant[];
};

type FieldDialogState = {
    fieldId: string;
    mode: 'add' | 'edit';
    originalFieldId?: number;
    subjectIds: string[];
};

type VariantDialogState = {
    fieldId: string;
    variant?: ProgramVariant;
};

type CopyFieldDialogState = {
    sourceField: ProgramField;
    targetFieldId: string;
};

type SearchSelectProps = {
    disabled?: boolean;
    emptyMessage: string;
    id?: string;
    onValueChange: (value: string) => void;
    options: ProgramOption[];
    placeholder: string;
    searchPlaceholder: string;
    value: string;
};

type SearchMultiSelectProps = {
    disabled?: boolean;
    emptyMessage: string;
    onSelectedValuesChange: (values: string[]) => void;
    options: ProgramOption[];
    placeholder: string;
    searchPlaceholder: string;
    selectedValues: string[];
};

function formatPrice(price: string): string {
    return new Intl.NumberFormat('id-ID', {
        currency: 'IDR',
        maximumFractionDigits: 0,
        style: 'currency',
    }).format(Number(price));
}

function formatSelectedOptions(
    options: ProgramOption[],
    selectedValues: string[],
    placeholder: string,
): string {
    const selectedOptions = options.filter((option) =>
        selectedValues.includes(option.id),
    );

    if (selectedOptions.length === 0) {
        return placeholder;
    }

    if (selectedOptions.length <= 2) {
        return selectedOptions.map((option) => option.label).join(', ');
    }

    return `${selectedOptions.length} subjects selected`;
}

function SearchSelect({
    disabled = false,
    emptyMessage,
    id,
    onValueChange,
    options,
    placeholder,
    searchPlaceholder,
    value,
}: SearchSelectProps) {
    const [open, setOpen] = useState(false);
    const selectedOption = options.find((option) => option.id === value);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    id={id}
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    disabled={disabled}
                    className="h-12 justify-between rounded-2xl px-4 font-normal"
                >
                    <span
                        className={cn(
                            'truncate',
                            !selectedOption && 'text-muted-foreground',
                        )}
                    >
                        {selectedOption?.label ?? placeholder}
                    </span>
                    <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
                </Button>
            </PopoverTrigger>
            <PopoverContent
                align="start"
                className="w-(--radix-popover-trigger-width) p-0"
            >
                <Command>
                    <CommandInput placeholder={searchPlaceholder} />
                    <CommandList>
                        <CommandEmpty>{emptyMessage}</CommandEmpty>
                        <CommandGroup>
                            {options.map((option) => (
                                <CommandItem
                                    key={option.id}
                                    value={`${option.label} ${option.id}`}
                                    onSelect={() => {
                                        onValueChange(option.id);
                                        setOpen(false);
                                    }}
                                >
                                    <span className="truncate">
                                        {option.label}
                                    </span>
                                    <Check
                                        className={cn(
                                            'ml-auto size-4',
                                            value === option.id
                                                ? 'opacity-100'
                                                : 'opacity-0',
                                        )}
                                    />
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

function SearchMultiSelect({
    disabled = false,
    emptyMessage,
    onSelectedValuesChange,
    options,
    placeholder,
    searchPlaceholder,
    selectedValues,
}: SearchMultiSelectProps) {
    const [open, setOpen] = useState(false);
    const selectedLabel = formatSelectedOptions(
        options,
        selectedValues,
        placeholder,
    );

    function toggleValue(value: string) {
        onSelectedValuesChange(
            selectedValues.includes(value)
                ? selectedValues.filter(
                      (selectedValue) => selectedValue !== value,
                  )
                : [...selectedValues, value],
        );
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    disabled={disabled}
                    className="h-12 justify-between rounded-2xl px-4 font-normal"
                >
                    <span
                        className={cn(
                            'truncate',
                            selectedValues.length === 0 &&
                                'text-muted-foreground',
                        )}
                    >
                        {selectedLabel}
                    </span>
                    <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
                </Button>
            </PopoverTrigger>
            <PopoverContent
                align="start"
                className="w-(--radix-popover-trigger-width) p-0"
            >
                <Command>
                    <CommandInput placeholder={searchPlaceholder} />
                    <CommandList>
                        <CommandEmpty>{emptyMessage}</CommandEmpty>
                        <CommandGroup>
                            {options.map((option) => {
                                const isSelected = selectedValues.includes(
                                    option.id,
                                );

                                return (
                                    <CommandItem
                                        key={option.id}
                                        value={`${option.label} ${option.id}`}
                                        onSelect={() => toggleValue(option.id)}
                                    >
                                        <span className="truncate">
                                            {option.label}
                                        </span>
                                        <Check
                                            className={cn(
                                                'ml-auto size-4',
                                                isSelected
                                                    ? 'opacity-100'
                                                    : 'opacity-0',
                                            )}
                                        />
                                    </CommandItem>
                                );
                            })}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

export default function ProgramDetail({
    fieldOptions,
    program,
}: {
    fieldOptions: ProgramFieldOption[];
    program: Program;
}) {
    const [fieldDialog, setFieldDialog] = useState<FieldDialogState | null>(
        null,
    );
    const [variantDialog, setVariantDialog] =
        useState<VariantDialogState | null>(null);
    const [copyFieldDialog, setCopyFieldDialog] =
        useState<CopyFieldDialogState | null>(null);
    const [deactivatingVariant, setDeactivatingVariant] =
        useState<ProgramVariant | null>(null);
    const selectedFieldOption = useMemo(
        () =>
            fieldOptions.find(
                (fieldOption) => fieldOption.id === fieldDialog?.fieldId,
            ),
        [fieldDialog?.fieldId, fieldOptions],
    );
    const fieldSubjectOptions = selectedFieldOption?.subjects ?? [];
    const copySourceFieldId = copyFieldDialog?.sourceField.id;
    const copyFieldOptions = useMemo(
        () =>
            fieldOptions.filter(
                (fieldOption) =>
                    fieldOption.id !== String(copySourceFieldId ?? ''),
            ),
        [copySourceFieldId, fieldOptions],
    );
    const [selectedProgramFieldId, setSelectedProgramFieldId] = useState<
        number | null
    >(program.fields[0]?.id ?? null);
    const selectedProgramField = useMemo(
        () =>
            program.fields.find(
                (field) => field.id === selectedProgramFieldId,
            ) ??
            program.fields[0] ??
            null,
        [program.fields, selectedProgramFieldId],
    );
    const selectedProgramFieldVariants = useMemo(
        () =>
            selectedProgramField
                ? program.variants.filter(
                      (variant) => variant.fieldId === selectedProgramField.id,
                  )
                : [],
        [program.variants, selectedProgramField],
    );
    const selectedProgramFieldSubjects = useMemo(
        () =>
            selectedProgramField
                ? program.subjects.filter((subject) =>
                      selectedProgramField.subjectIds.includes(subject.id),
                  )
                : [],
        [program.subjects, selectedProgramField],
    );

    function openAddFieldDialog() {
        setFieldDialog({
            fieldId: '',
            mode: 'add',
            subjectIds: [],
        });
    }

    function openEditFieldDialog(field: ProgramField) {
        setFieldDialog({
            fieldId: String(field.id),
            mode: 'edit',
            originalFieldId: field.id,
            subjectIds: field.subjectIds.map(String),
        });
    }

    function updateSelectedSubjects(subjectIds: string[]) {
        setFieldDialog((current) => {
            if (!current) {
                return current;
            }

            return {
                ...current,
                subjectIds,
            };
        });
    }

    return (
        <>
            <Head title={program.name} />
            <div className="flex h-full max-w-full min-w-0 flex-1 flex-col gap-6 overflow-hidden p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <div className="flex flex-wrap items-center gap-3">
                            <h1 className="font-heading text-2xl font-semibold">
                                {program.name}
                            </h1>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Program detail and field setup.
                        </p>
                    </div>
                </div>

                <section className="space-y-1.5">
                    <div className="grid min-h-10 gap-2 md:grid-cols-[14rem_1fr] md:items-center">
                        <p className="text-sm text-muted-foreground">
                            Description
                        </p>
                        <p className="text-sm">
                            {program.description || 'No description.'}
                        </p>
                    </div>
                    <div className="grid min-h-10 gap-2 md:grid-cols-[14rem_1fr] md:items-center">
                        <p className="text-sm text-muted-foreground">
                            Max reschedule
                        </p>
                        <p className="text-sm">{program.maxReschedule}</p>
                    </div>
                    <div className="grid min-h-10 gap-2 md:grid-cols-[14rem_1fr] md:items-center">
                        <p className="text-sm text-muted-foreground">
                            Status
                        </p>
                        <div>
                            <StatusBadge status={program.status} />
                        </div>
                    </div>
                </section>

                <section className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <h2 className="font-heading text-lg font-semibold">
                            Field
                        </h2>
                        <Button
                            type="button"
                            className="gap-2"
                            onClick={openAddFieldDialog}
                        >
                            <Plus className="size-4" />
                            Add field
                        </Button>
                    </div>

                    {program.fields.length === 0 ? (
                        <EmptyState>No field configured.</EmptyState>
                    ) : (
                        <div className="grid min-w-0 gap-4 lg:grid-cols-[18rem_minmax(0,1fr)]">
                            <div className="min-w-0 overflow-x-auto lg:overflow-visible">
                                <div className="flex min-w-max gap-2 lg:min-w-0 lg:flex-col">
                                    {program.fields.map((field) => {
                                        const variantsCount =
                                            program.variants.filter(
                                                (variant) =>
                                                    variant.fieldId ===
                                                    field.id,
                                            ).length;
                                        const isSelected =
                                            selectedProgramField?.id ===
                                            field.id;

                                        return (
                                            <button
                                                key={field.id}
                                                type="button"
                                                onClick={() =>
                                                    setSelectedProgramFieldId(
                                                        field.id,
                                                    )
                                                }
                                                className={cn(
                                                    'w-64 shrink-0 rounded-2xl border px-4 py-3 text-left transition lg:w-full',
                                                    isSelected
                                                        ? 'border-primary bg-primary/5'
                                                        : 'border-border bg-background hover:bg-muted/50',
                                                )}
                                            >
                                                <span className="block truncate font-heading text-sm font-semibold">
                                                    {field.name}
                                                </span>
                                                <span className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                                                    <span>
                                                        {
                                                            field.subjectIds
                                                                .length
                                                        }{' '}
                                                        subjects
                                                    </span>
                                                    <span>&middot;</span>
                                                    <span>
                                                        {variantsCount}{' '}
                                                        variants
                                                    </span>
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {selectedProgramField && (
                                <div className="min-w-0 rounded-2xl border bg-background">
                                    <div className="flex flex-wrap items-start justify-between gap-3 border-b px-4 py-3">
                                        <div className="min-w-0">
                                            <h3 className="truncate font-heading text-base font-semibold">
                                                {selectedProgramField.name}
                                            </h3>
                                            <div className="mt-2 flex min-h-7 flex-wrap items-center gap-1.5">
                                                {selectedProgramFieldSubjects.length ===
                                                0 ? (
                                                    <span className="text-sm text-muted-foreground">
                                                        No subjects.
                                                    </span>
                                                ) : (
                                                    selectedProgramFieldSubjects.map(
                                                        (subject) => (
                                                            <Badge
                                                                key={
                                                                    subject.id
                                                                }
                                                                variant="outline"
                                                                className="max-w-44 truncate"
                                                            >
                                                                {subject.name}
                                                            </Badge>
                                                        ),
                                                    )
                                                )}
                                            </div>
                                        </div>
                                        <ActionMenu label="Open field actions">
                                            <DropdownMenuItem
                                                onClick={() =>
                                                    setVariantDialog({
                                                        fieldId: String(
                                                            selectedProgramField.id,
                                                        ),
                                                    })
                                                }
                                            >
                                                <Plus className="size-4" />
                                                Add variant
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() =>
                                                    setCopyFieldDialog({
                                                        sourceField:
                                                            selectedProgramField,
                                                        targetFieldId: '',
                                                    })
                                                }
                                            >
                                                <Copy className="size-4" />
                                                Copy field
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() =>
                                                    openEditFieldDialog(
                                                        selectedProgramField,
                                                    )
                                                }
                                            >
                                                <Pencil className="size-4" />
                                                Edit field
                                            </DropdownMenuItem>
                                        </ActionMenu>
                                    </div>

                                    {selectedProgramFieldVariants.length ===
                                    0 ? (
                                        <div className="p-4">
                                            <EmptyState>
                                                No variants configured.
                                            </EmptyState>
                                        </div>
                                    ) : (
                                        <TableScrollArea className="rounded-none border-0">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>
                                                            Sessions
                                                        </TableHead>
                                                        <TableHead>
                                                            Duration
                                                        </TableHead>
                                                        <TableHead>
                                                            Price
                                                        </TableHead>
                                                        <TableHead>
                                                            Status
                                                        </TableHead>
                                                        <TableHead className="w-24 text-right" />
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {selectedProgramFieldVariants.map(
                                                        (variant) => (
                                                            <TableRow
                                                                key={
                                                                    variant.id
                                                                }
                                                            >
                                                                <TableCell className="font-medium">
                                                                    {
                                                                        variant.session
                                                                    }
                                                                </TableCell>
                                                                <TableCell>
                                                                    {
                                                                        variant.duration
                                                                    }{' '}
                                                                    minutes
                                                                </TableCell>
                                                                <TableCell>
                                                                    {formatPrice(
                                                                        variant.price,
                                                                    )}
                                                                </TableCell>
                                                                <TableCell>
                                                                    <StatusBadge
                                                                        status={
                                                                            variant.status
                                                                        }
                                                                    />
                                                                </TableCell>
                                                                <TableCell className="text-right">
                                                                    <ActionMenu label="Open variant actions">
                                                                        <DropdownMenuItem
                                                                            onClick={() =>
                                                                                setVariantDialog(
                                                                                    {
                                                                                        fieldId:
                                                                                            String(
                                                                                                selectedProgramField.id,
                                                                                            ),
                                                                                        variant,
                                                                                    },
                                                                                )
                                                                            }
                                                                        >
                                                                            <Pencil className="size-4" />
                                                                            Edit
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem
                                                                            className="text-destructive focus:text-destructive"
                                                                            onClick={() =>
                                                                                setDeactivatingVariant(
                                                                                    variant,
                                                                                )
                                                                            }
                                                                        >
                                                                            <PowerOff className="size-4" />
                                                                            Deactivate
                                                                        </DropdownMenuItem>
                                                                    </ActionMenu>
                                                                </TableCell>
                                                            </TableRow>
                                                        ),
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </TableScrollArea>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </section>

                <Dialog
                    open={!!fieldDialog}
                    onOpenChange={(open) => {
                        if (!open) {
                            setFieldDialog(null);
                        }
                    }}
                >
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>
                                {fieldDialog?.mode === 'edit'
                                    ? 'Edit field'
                                    : 'Add field'}
                            </DialogTitle>
                            <DialogDescription>
                                Select a field and subjects for this program.
                            </DialogDescription>
                        </DialogHeader>
                        {fieldDialog && (
                            <Form
                                action={
                                    fieldDialog.mode === 'edit' &&
                                    fieldDialog.originalFieldId
                                        ? `/academics/programs/${program.slug}/fields/${fieldDialog.originalFieldId}`
                                        : `/academics/programs/${program.slug}/fields`
                                }
                                method={
                                    fieldDialog.mode === 'edit' ? 'put' : 'post'
                                }
                                disableWhileProcessing
                                onSuccess={() => {
                                    setFieldDialog(null);
                                    toast.success('Field updated.');
                                }}
                                onError={() => {
                                    toast.error(
                                        'Please check the field form.',
                                    );
                                }}
                                className="grid gap-5"
                            >
                                {({ processing, errors }) => (
                                    <>
                                        <input
                                            type="hidden"
                                            name="field_id"
                                            value={fieldDialog.fieldId}
                                        />
                                        {fieldDialog.subjectIds.map(
                                            (subjectId) => (
                                                <input
                                                    key={subjectId}
                                                    type="hidden"
                                                    name="subjects[]"
                                                    value={subjectId}
                                                />
                                            ),
                                        )}
                                        <div className="grid gap-2">
                                            <Label>Field</Label>
                                            <SearchSelect
                                                value={fieldDialog.fieldId}
                                                options={copyFieldOptions}
                                                placeholder="Select field"
                                                searchPlaceholder="Search field..."
                                                emptyMessage="No field found."
                                                onValueChange={(value) =>
                                                    setFieldDialog(
                                                        (current) =>
                                                            current
                                                                ? {
                                                                      ...current,
                                                                      fieldId:
                                                                          value,
                                                                      subjectIds:
                                                                          [],
                                                                  }
                                                                : current,
                                                    )
                                                }
                                            />
                                            <InputError
                                                message={errors.field_id}
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label>Subjects</Label>
                                            <SearchMultiSelect
                                                selectedValues={
                                                    fieldDialog.subjectIds
                                                }
                                                options={fieldSubjectOptions}
                                                placeholder={
                                                    fieldSubjectOptions.length ===
                                                    0
                                                        ? 'No active subjects available'
                                                        : 'Select subjects'
                                                }
                                                searchPlaceholder="Search subjects..."
                                                emptyMessage="No subject found."
                                                disabled={
                                                    fieldSubjectOptions.length ===
                                                    0
                                                }
                                                onSelectedValuesChange={
                                                    updateSelectedSubjects
                                                }
                                            />
                                            <InputError
                                                message={errors.subjects}
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
                                                Save
                                            </Button>
                                        </DialogFooter>
                                    </>
                                )}
                            </Form>
                        )}
                    </DialogContent>
                </Dialog>

                <Dialog
                    open={!!copyFieldDialog}
                    onOpenChange={(open) => {
                        if (!open) {
                            setCopyFieldDialog(null);
                        }
                    }}
                >
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Copy field</DialogTitle>
                            <DialogDescription>
                                Copy variants from this field into another
                                field.
                            </DialogDescription>
                        </DialogHeader>
                        {copyFieldDialog && (
                            <Form
                                action={`/academics/programs/${program.slug}/fields/${copyFieldDialog.sourceField.id}/copy`}
                                method="post"
                                disableWhileProcessing
                                onSuccess={() => {
                                    setCopyFieldDialog(null);
                                    toast.success('Field copied.');
                                }}
                                onError={() => {
                                    toast.error(
                                        'Please check the copy field form.',
                                    );
                                }}
                                className="grid gap-5"
                            >
                                {({ processing, errors }) => (
                                    <>
                                        <input
                                            type="hidden"
                                            name="target_field_id"
                                            value={
                                                copyFieldDialog.targetFieldId
                                            }
                                        />
                                        <div className="grid gap-2">
                                            <Label>Source field</Label>
                                            <div className="flex h-12 items-center rounded-2xl border bg-muted/40 px-4 text-sm font-medium">
                                                {
                                                    copyFieldDialog.sourceField
                                                        .name
                                                }
                                            </div>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Target field</Label>
                                            <SearchSelect
                                                value={
                                                    copyFieldDialog.targetFieldId
                                                }
                                                options={fieldOptions}
                                                placeholder="Select target field"
                                                searchPlaceholder="Search field..."
                                                emptyMessage="No field found."
                                                onValueChange={(value) =>
                                                    setCopyFieldDialog(
                                                        (current) =>
                                                            current
                                                                ? {
                                                                      ...current,
                                                                      targetFieldId:
                                                                          value,
                                                                  }
                                                                : current,
                                                    )
                                                }
                                            />
                                            <InputError
                                                message={
                                                    errors.target_field_id
                                                }
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
                                                disabled={
                                                    processing ||
                                                    !copyFieldDialog.targetFieldId
                                                }
                                            >
                                                Copy
                                            </Button>
                                        </DialogFooter>
                                    </>
                                )}
                            </Form>
                        )}
                    </DialogContent>
                </Dialog>

                <Dialog
                    open={!!variantDialog}
                    onOpenChange={(open) => {
                        if (!open) {
                            setVariantDialog(null);
                        }
                    }}
                >
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>
                                {variantDialog?.variant
                                    ? 'Edit variant'
                                    : 'Add variant'}
                            </DialogTitle>
                            <DialogDescription>
                                Configure session count, duration, and price.
                            </DialogDescription>
                        </DialogHeader>
                        {variantDialog && (
                            <Form
                                key={
                                    variantDialog.variant?.id ??
                                    variantDialog.fieldId
                                }
                                action={
                                    variantDialog.variant
                                        ? `/academics/programs/${program.slug}/variants/${variantDialog.variant.id}`
                                        : `/academics/programs/${program.slug}/variants`
                                }
                                method={
                                    variantDialog.variant ? 'put' : 'post'
                                }
                                disableWhileProcessing
                                onSuccess={() => {
                                    setVariantDialog(null);
                                    toast.success('Variant saved.');
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
                                        <input
                                            type="hidden"
                                            name="field_id"
                                            value={variantDialog.fieldId}
                                        />
                                        <div className="grid gap-2">
                                            <Label>Sessions</Label>
                                            <Input
                                                name="session"
                                                type="number"
                                                min={1}
                                                defaultValue={
                                                    variantDialog.variant
                                                        ?.session
                                                }
                                                placeholder="6"
                                                aria-invalid={!!errors.session}
                                            />
                                            <InputError
                                                message={errors.session}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Duration</Label>
                                            <Select
                                                name="duration"
                                                defaultValue={
                                                    variantDialog.variant
                                                        ? String(
                                                              variantDialog
                                                                  .variant
                                                                  .duration,
                                                          )
                                                        : undefined
                                                }
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
                                            <InputError
                                                message={errors.duration}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Price</Label>
                                            <Input
                                                name="price"
                                                type="number"
                                                min={0}
                                                defaultValue={
                                                    variantDialog.variant?.price
                                                }
                                                placeholder="1500000"
                                                aria-invalid={!!errors.price}
                                            />
                                            <InputError message={errors.price} />
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
                                                Save
                                            </Button>
                                        </DialogFooter>
                                    </>
                                )}
                            </Form>
                        )}
                    </DialogContent>
                </Dialog>

                <AlertDialog
                    open={!!deactivatingVariant}
                    onOpenChange={(open) => {
                        if (!open) {
                            setDeactivatingVariant(null);
                        }
                    }}
                >
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>
                                Deactivate variant?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                                This variant will no longer be used for new
                                enrollments.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        {deactivatingVariant && (
                            <Form
                                action={`/academics/programs/${program.slug}/variants/${deactivatingVariant.id}`}
                                method="delete"
                                disableWhileProcessing
                                onSuccess={() => {
                                    setDeactivatingVariant(null);
                                    toast.success('Variant deactivated.');
                                }}
                                onError={() => {
                                    toast.error(
                                        'Unable to deactivate this variant.',
                                    );
                                }}
                            >
                                {({ processing }) => (
                                    <AlertDialogFooter>
                                        <AlertDialogCancel
                                            type="button"
                                            disabled={processing}
                                        >
                                            Cancel
                                        </AlertDialogCancel>
                                        <Button
                                            type="submit"
                                            variant="destructive"
                                            disabled={processing}
                                        >
                                            Deactivate
                                        </Button>
                                    </AlertDialogFooter>
                                )}
                            </Form>
                        )}
                    </AlertDialogContent>
                </AlertDialog>
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
