import { Form } from '@inertiajs/react';
import { Check, ChevronsUpDown, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import { DialogClose, DialogFooter } from '@/components/ui/dialog';
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
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

export type AcademicProgramOption = {
    id: string;
    label: string;
};

export type AcademicProgramFieldOption = AcademicProgramOption & {
    subjects: AcademicProgramOption[];
};

export type AcademicProgramVariantInput = {
    duration: number | string;
    fieldId: string;
    price: number | string;
    session: number | string;
};

export type AcademicProgramFormProgram = {
    description?: string | null;
    fieldIds: string[];
    maxReschedule: number;
    name: string;
    subjectIds: string[];
    variantRows: AcademicProgramVariantInput[];
};

type AcademicProgramFormProps = {
    action: string;
    fieldOptions: AcademicProgramFieldOption[];
    idPrefix: string;
    method: 'post' | 'put';
    onError: () => void;
    onSuccess: () => void;
    program?: AcademicProgramFormProgram;
    resetOnSuccess?: boolean;
    submitLabel: string;
};

type ProgramSelectionRow = {
    id: string;
    value: string;
};

type ProgramVariantRow = {
    duration: string;
    id: string;
    price: string;
    session: string;
};

type ProgramFieldRow = {
    fieldId: string;
    id: string;
    subjectRows: ProgramSelectionRow[];
    variantRows: ProgramVariantRow[];
};

type VariantPayload = {
    duration: string;
    fieldId: string;
    price: string;
    session: string;
};

type SearchSelectProps = {
    disabled?: boolean;
    emptyMessage: string;
    id?: string;
    onValueChange: (value: string) => void;
    options: AcademicProgramOption[];
    placeholder: string;
    searchPlaceholder: string;
    value: string;
};

let rowCounter = 0;

function nextRowId(prefix: string): string {
    rowCounter += 1;

    return `${prefix}-${rowCounter}`;
}

function blankSelectionRow(prefix: string): ProgramSelectionRow {
    return {
        id: nextRowId(prefix),
        value: '',
    };
}

function blankVariantRow(): ProgramVariantRow {
    return {
        duration: '',
        id: nextRowId('variant-row'),
        price: '',
        session: '',
    };
}

function blankFieldRow(): ProgramFieldRow {
    return {
        fieldId: '',
        id: nextRowId('field-row'),
        subjectRows: [blankSelectionRow('subject-row')],
        variantRows: [blankVariantRow()],
    };
}

function uniqueFilled(values: string[]): string[] {
    return Array.from(new Set(values.filter(Boolean)));
}

function toText(value: number | string | undefined): string {
    return value === undefined ? '' : String(value);
}

function variantName(variantRow: ProgramVariantRow): string {
    if (!variantRow.session || !variantRow.duration) {
        return 'Session x Duration Minutes';
    }

    return `${variantRow.session} x ${variantRow.duration} Minutes`;
}

function buildInitialRows(
    fieldOptions: AcademicProgramFieldOption[],
    program?: AcademicProgramFormProgram,
): ProgramFieldRow[] {
    if (!program || program.fieldIds.length === 0) {
        return [blankFieldRow()];
    }

    return program.fieldIds.map((fieldId) => {
        const field = fieldOptions.find((option) => option.id === fieldId);
        const subjectIds = field
            ? program.subjectIds.filter((subjectId) =>
                  field.subjects.some((subject) => subject.id === subjectId),
              )
            : [];
        const variants = program.variantRows.filter(
            (variant) => variant.fieldId === fieldId,
        );

        return {
            fieldId,
            id: nextRowId('field-row'),
            subjectRows:
                subjectIds.length > 0
                    ? subjectIds.map((subjectId) => ({
                          id: nextRowId('subject-row'),
                          value: subjectId,
                      }))
                    : [blankSelectionRow('subject-row')],
            variantRows:
                variants.length > 0
                    ? variants.map((variant) => ({
                          duration: toText(variant.duration),
                          id: nextRowId('variant-row'),
                          price: toText(variant.price),
                          session: toText(variant.session),
                      }))
                    : [blankVariantRow()],
        };
    });
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

export function AcademicProgramForm({
    action,
    fieldOptions,
    idPrefix,
    method,
    onError,
    onSuccess,
    program,
    resetOnSuccess = false,
    submitLabel,
}: AcademicProgramFormProps) {
    const [fieldRows, setFieldRows] = useState<ProgramFieldRow[]>(() =>
        buildInitialRows(fieldOptions, program),
    );

    const selectedFieldIds = useMemo(
        () => uniqueFilled(fieldRows.map((row) => row.fieldId)),
        [fieldRows],
    );
    const selectedSubjectIds = useMemo(
        () =>
            uniqueFilled(
                fieldRows.flatMap((row) =>
                    row.subjectRows.map((subjectRow) => subjectRow.value),
                ),
            ),
        [fieldRows],
    );
    const variantPayload = useMemo<VariantPayload[]>(
        () =>
            fieldRows.flatMap((fieldRow) =>
                fieldRow.variantRows
                    .filter(
                        (variantRow) =>
                            fieldRow.fieldId &&
                            variantRow.session &&
                            variantRow.duration &&
                            variantRow.price !== '',
                    )
                    .map((variantRow) => ({
                        duration: variantRow.duration,
                        fieldId: fieldRow.fieldId,
                        price: variantRow.price,
                        session: variantRow.session,
                    })),
            ),
        [fieldRows],
    );

    function getFieldOption(fieldId: string) {
        return fieldOptions.find((field) => field.id === fieldId);
    }

    function addFieldRow() {
        setFieldRows((currentRows) => [...currentRows, blankFieldRow()]);
    }

    function removeFieldRow(rowId: string) {
        setFieldRows((currentRows) =>
            currentRows.length === 1
                ? [blankFieldRow()]
                : currentRows.filter((row) => row.id !== rowId),
        );
    }

    function updateField(rowId: string, fieldId: string) {
        setFieldRows((currentRows) =>
            currentRows.map((row) =>
                row.id === rowId
                    ? {
                          ...row,
                          fieldId,
                          subjectRows: [blankSelectionRow('subject-row')],
                          variantRows: [blankVariantRow()],
                      }
                    : row,
            ),
        );
    }

    function addSubjectRow(fieldRowId: string) {
        setFieldRows((currentRows) =>
            currentRows.map((row) =>
                row.id === fieldRowId
                    ? {
                          ...row,
                          subjectRows: [
                              ...row.subjectRows,
                              blankSelectionRow('subject-row'),
                          ],
                      }
                    : row,
            ),
        );
    }

    function updateSubjectRow(
        fieldRowId: string,
        subjectRowId: string,
        value: string,
    ) {
        setFieldRows((currentRows) =>
            currentRows.map((row) =>
                row.id === fieldRowId
                    ? {
                          ...row,
                          subjectRows: row.subjectRows.map((subjectRow) =>
                              subjectRow.id === subjectRowId
                                  ? { ...subjectRow, value }
                                  : subjectRow,
                          ),
                      }
                    : row,
            ),
        );
    }

    function removeSubjectRow(fieldRowId: string, subjectRowId: string) {
        setFieldRows((currentRows) =>
            currentRows.map((row) => {
                if (row.id !== fieldRowId) {
                    return row;
                }

                const subjectRows = row.subjectRows.filter(
                    (subjectRow) => subjectRow.id !== subjectRowId,
                );

                return {
                    ...row,
                    subjectRows:
                        subjectRows.length > 0
                            ? subjectRows
                            : [blankSelectionRow('subject-row')],
                };
            }),
        );
    }

    function addVariantRow(fieldRowId: string) {
        setFieldRows((currentRows) =>
            currentRows.map((row) =>
                row.id === fieldRowId
                    ? {
                          ...row,
                          variantRows: [...row.variantRows, blankVariantRow()],
                      }
                    : row,
            ),
        );
    }

    function updateVariantRow(
        fieldRowId: string,
        variantRowId: string,
        key: keyof Omit<ProgramVariantRow, 'id'>,
        value: string,
    ) {
        setFieldRows((currentRows) =>
            currentRows.map((row) =>
                row.id === fieldRowId
                    ? {
                          ...row,
                          variantRows: row.variantRows.map((variantRow) =>
                              variantRow.id === variantRowId
                                  ? { ...variantRow, [key]: value }
                                  : variantRow,
                          ),
                      }
                    : row,
            ),
        );
    }

    function removeVariantRow(fieldRowId: string, variantRowId: string) {
        setFieldRows((currentRows) =>
            currentRows.map((row) => {
                if (row.id !== fieldRowId) {
                    return row;
                }

                const variantRows = row.variantRows.filter(
                    (variantRow) => variantRow.id !== variantRowId,
                );

                return {
                    ...row,
                    variantRows:
                        variantRows.length > 0
                            ? variantRows
                            : [blankVariantRow()],
                };
            }),
        );
    }

    return (
        <Form
            action={action}
            method={method}
            resetOnSuccess={resetOnSuccess}
            disableWhileProcessing
            onSuccess={() => {
                if (resetOnSuccess) {
                    setFieldRows([blankFieldRow()]);
                }

                onSuccess();
            }}
            onError={onError}
            className="grid gap-6"
        >
            {({ processing, errors }) => (
                <>
                    {selectedFieldIds.map((fieldId) => (
                        <input
                            key={`field-${fieldId}`}
                            type="hidden"
                            name="fields[]"
                            value={fieldId}
                        />
                    ))}
                    {selectedSubjectIds.map((subjectId) => (
                        <input
                            key={`subject-${subjectId}`}
                            type="hidden"
                            name="subjects[]"
                            value={subjectId}
                        />
                    ))}
                    {variantPayload.map((variant, index) => (
                        <div key={`${variant.fieldId}-${index}`} hidden>
                            <input
                                type="hidden"
                                name={`variants[${index}][field_id]`}
                                value={variant.fieldId}
                            />
                            <input
                                type="hidden"
                                name={`variants[${index}][session]`}
                                value={variant.session}
                            />
                            <input
                                type="hidden"
                                name={`variants[${index}][duration]`}
                                value={variant.duration}
                            />
                            <input
                                type="hidden"
                                name={`variants[${index}][price]`}
                                value={variant.price}
                            />
                        </div>
                    ))}

                    <div className="grid gap-5 sm:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor={`${idPrefix}-name`}>Name</Label>
                            <Input
                                id={`${idPrefix}-name`}
                                name="name"
                                defaultValue={program?.name}
                                placeholder="Program name"
                                autoComplete="off"
                                aria-invalid={!!errors.name}
                            />
                            <InputError message={errors.name} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor={`${idPrefix}-max-reschedule`}>
                                Max reschedule
                            </Label>
                            <Input
                                id={`${idPrefix}-max-reschedule`}
                                name="max_reschedule"
                                type="number"
                                min={0}
                                defaultValue={program?.maxReschedule}
                                placeholder="3"
                                aria-invalid={!!errors.max_reschedule}
                            />
                            <InputError message={errors.max_reschedule} />
                        </div>

                        <div className="grid gap-2 sm:col-span-2">
                            <Label htmlFor={`${idPrefix}-description`}>
                                Description
                            </Label>
                            <Textarea
                                id={`${idPrefix}-description`}
                                name="description"
                                defaultValue={program?.description ?? undefined}
                                placeholder="Short program description"
                                className="min-h-28 resize-none rounded-2xl bg-background px-4 text-sm"
                                aria-invalid={!!errors.description}
                            />
                            <InputError message={errors.description} />
                        </div>
                    </div>

                    <div className="grid gap-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <Label>Field, subject, and variant rows</Label>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="gap-2"
                                onClick={addFieldRow}
                            >
                                <Plus className="size-4" />
                                Add field row
                            </Button>
                        </div>

                        <div className="grid gap-5">
                            {fieldRows.map((fieldRow, fieldRowIndex) => {
                                const selectedField = getFieldOption(
                                    fieldRow.fieldId,
                                );
                                const subjectOptions =
                                    selectedField?.subjects ?? [];

                                return (
                                    <div
                                        key={fieldRow.id}
                                        className="grid gap-5 rounded-2xl border bg-card/40 p-5"
                                    >
                                        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                                            <div className="grid gap-2">
                                                <Label
                                                    htmlFor={`${idPrefix}-field-${fieldRow.id}`}
                                                >
                                                    Field {fieldRowIndex + 1}
                                                </Label>
                                                <SearchSelect
                                                    id={`${idPrefix}-field-${fieldRow.id}`}
                                                    value={fieldRow.fieldId}
                                                    options={fieldOptions}
                                                    placeholder="Select field"
                                                    searchPlaceholder="Search field..."
                                                    emptyMessage="No field found."
                                                    onValueChange={(value) =>
                                                        updateField(
                                                            fieldRow.id,
                                                            value,
                                                        )
                                                    }
                                                />
                                            </div>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                onClick={() =>
                                                    removeFieldRow(fieldRow.id)
                                                }
                                            >
                                                <Trash2 className="size-4" />
                                                <span className="sr-only">
                                                    Remove field row
                                                </span>
                                            </Button>
                                        </div>

                                        <div className="grid gap-5">
                                            <div className="grid gap-3 rounded-2xl border bg-background/70 p-4">
                                                <div className="flex flex-wrap items-center justify-between gap-3">
                                                    <Label>Subjects</Label>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        className="gap-2"
                                                        disabled={
                                                            !fieldRow.fieldId
                                                        }
                                                        onClick={() =>
                                                            addSubjectRow(
                                                                fieldRow.id,
                                                            )
                                                        }
                                                    >
                                                        <Plus className="size-4" />
                                                        Add subject
                                                    </Button>
                                                </div>
                                                <div className="grid gap-3">
                                                    {fieldRow.subjectRows.map(
                                                        (subjectRow) => (
                                                            <div
                                                                key={
                                                                    subjectRow.id
                                                                }
                                                                className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]"
                                                            >
                                                                <SearchSelect
                                                                    value={
                                                                        subjectRow.value
                                                                    }
                                                                    disabled={
                                                                        !fieldRow.fieldId ||
                                                                        subjectOptions.length ===
                                                                            0
                                                                    }
                                                                    options={
                                                                        subjectOptions
                                                                    }
                                                                    placeholder="Select subject"
                                                                    searchPlaceholder="Search subject..."
                                                                    emptyMessage="No subject found."
                                                                    onValueChange={(
                                                                        value,
                                                                    ) =>
                                                                        updateSubjectRow(
                                                                            fieldRow.id,
                                                                            subjectRow.id,
                                                                            value,
                                                                        )
                                                                    }
                                                                />
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="icon-sm"
                                                                    onClick={() =>
                                                                        removeSubjectRow(
                                                                            fieldRow.id,
                                                                            subjectRow.id,
                                                                        )
                                                                    }
                                                                >
                                                                    <Trash2 className="size-4" />
                                                                    <span className="sr-only">
                                                                        Remove
                                                                        subject
                                                                        row
                                                                    </span>
                                                                </Button>
                                                            </div>
                                                        ),
                                                    )}
                                                    {fieldRow.fieldId &&
                                                        subjectOptions.length ===
                                                            0 && (
                                                            <p className="text-sm text-muted-foreground">
                                                                No subjects
                                                                linked to this
                                                                field yet.
                                                            </p>
                                                        )}
                                                </div>
                                            </div>

                                            <div className="grid gap-3 rounded-2xl border bg-background/70 p-4">
                                                <div className="flex flex-wrap items-center justify-between gap-3">
                                                    <Label>Variants</Label>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        className="gap-2"
                                                        disabled={
                                                            !fieldRow.fieldId
                                                        }
                                                        onClick={() =>
                                                            addVariantRow(
                                                                fieldRow.id,
                                                            )
                                                        }
                                                    >
                                                        <Plus className="size-4" />
                                                        Add variant
                                                    </Button>
                                                </div>
                                                <div className="grid gap-4">
                                                    {fieldRow.variantRows.map(
                                                        (variantRow) => (
                                                            <div
                                                                key={
                                                                    variantRow.id
                                                                }
                                                                className="grid gap-3 rounded-xl border p-4"
                                                            >
                                                                <div className="flex items-center justify-between gap-3">
                                                                    <p className="truncate text-sm font-medium">
                                                                        {variantName(
                                                                            variantRow,
                                                                        )}
                                                                    </p>
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="icon-sm"
                                                                        onClick={() =>
                                                                            removeVariantRow(
                                                                                fieldRow.id,
                                                                                variantRow.id,
                                                                            )
                                                                        }
                                                                    >
                                                                        <Trash2 className="size-4" />
                                                                        <span className="sr-only">
                                                                            Remove
                                                                            variant
                                                                            row
                                                                        </span>
                                                                    </Button>
                                                                </div>
                                                                <div className="grid gap-3 md:grid-cols-3">
                                                                    <div className="grid gap-2">
                                                                        <Label>
                                                                            Session
                                                                        </Label>
                                                                        <Input
                                                                            type="number"
                                                                            min={
                                                                                1
                                                                            }
                                                                            value={
                                                                                variantRow.session
                                                                            }
                                                                            placeholder="6"
                                                                            disabled={
                                                                                !fieldRow.fieldId
                                                                            }
                                                                            onChange={(
                                                                                event,
                                                                            ) =>
                                                                                updateVariantRow(
                                                                                    fieldRow.id,
                                                                                    variantRow.id,
                                                                                    'session',
                                                                                    event
                                                                                        .target
                                                                                        .value,
                                                                                )
                                                                            }
                                                                        />
                                                                    </div>
                                                                    <div className="grid gap-2">
                                                                        <Label>
                                                                            Duration
                                                                        </Label>
                                                                        <Select
                                                                            value={
                                                                                variantRow.duration
                                                                            }
                                                                            disabled={
                                                                                !fieldRow.fieldId
                                                                            }
                                                                            onValueChange={(
                                                                                value,
                                                                            ) =>
                                                                                updateVariantRow(
                                                                                    fieldRow.id,
                                                                                    variantRow.id,
                                                                                    'duration',
                                                                                    value,
                                                                                )
                                                                            }
                                                                        >
                                                                            <SelectTrigger className="w-full">
                                                                                <SelectValue placeholder="Select duration" />
                                                                            </SelectTrigger>
                                                                            <SelectContent>
                                                                                <SelectItem value="60">
                                                                                    60
                                                                                    Minutes
                                                                                </SelectItem>
                                                                                <SelectItem value="90">
                                                                                    90
                                                                                    Minutes
                                                                                </SelectItem>
                                                                                <SelectItem value="120">
                                                                                    120
                                                                                    Minutes
                                                                                </SelectItem>
                                                                                <SelectItem value="180">
                                                                                    180
                                                                                    Minutes
                                                                                </SelectItem>
                                                                            </SelectContent>
                                                                        </Select>
                                                                    </div>
                                                                    <div className="grid gap-2">
                                                                        <Label>
                                                                            Price
                                                                        </Label>
                                                                        <Input
                                                                            type="number"
                                                                            min={
                                                                                0
                                                                            }
                                                                            value={
                                                                                variantRow.price
                                                                            }
                                                                            placeholder="1500000"
                                                                            disabled={
                                                                                !fieldRow.fieldId
                                                                            }
                                                                            onChange={(
                                                                                event,
                                                                            ) =>
                                                                                updateVariantRow(
                                                                                    fieldRow.id,
                                                                                    variantRow.id,
                                                                                    'price',
                                                                                    event
                                                                                        .target
                                                                                        .value,
                                                                                )
                                                                            }
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ),
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <InputError
                            message={errors.fields ?? errors['fields.0']}
                        />
                        <InputError
                            message={errors.subjects ?? errors['subjects.0']}
                        />
                        <InputError
                            message={
                                errors.variants ??
                                errors['variants.0.field_id'] ??
                                errors['variants.0.session'] ??
                                errors['variants.0.duration'] ??
                                errors['variants.0.price']
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
                        <Button type="submit" disabled={processing}>
                            {submitLabel}
                        </Button>
                    </DialogFooter>
                </>
            )}
        </Form>
    );
}
