import { Form, Head } from '@inertiajs/react';
import {
    CalendarOff,
    CalendarPlus,
    Download,
    Pencil,
    PowerOff,
    Plus,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ActionMenu } from '@/components/admin/action-menu';
import { getBadgeProps } from '@/lib/badge';
import { EmptyState } from '@/components/admin/empty-state';
import { SummaryCard } from '@/components/admin/summary-card';
import { TablePagination } from '@/components/admin/table-pagination';
import { TableSearch } from '@/components/admin/table-search';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    DropdownMenuItem,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
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
import { useClientPagination } from '@/hooks/use-client-pagination';

type PublicHoliday = {
    date: string;
    id: number;
    name: string;
    source: 'manual' | 'library';
    status: 'active' | 'inactive';
    type: 'national' | 'collective_leave' | 'internal';
};

type GeneratedHoliday = {
    date: string;
    name: string;
    type: PublicHoliday['type'];
};

type HolidayFormProps = {
    action: string;
    holiday?: PublicHoliday | null;
    method: 'post' | 'put';
    onSuccess: () => void;
    submitLabel: string;
};

const dateFormatter = new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    weekday: 'long',
    year: 'numeric',
});

const sourceLabel: Record<PublicHoliday['source'], string> = {
    library: 'Library',
    manual: 'Manual',
};

const statusLabel: Record<PublicHoliday['status'], string> = {
    active: 'Active',
    inactive: 'Inactive',
};

const typeLabel: Record<PublicHoliday['type'], string> = {
    collective_leave: 'Collective Leave',
    internal: 'Internal',
    national: 'National',
};

function formatHolidayDate(date: string) {
    return dateFormatter.format(new Date(`${date}T00:00:00`));
}

function todayDate() {
    const today = new Date();

    return [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, '0'),
        String(today.getDate()).padStart(2, '0'),
    ].join('-');
}

function HolidayForm({
    action,
    holiday,
    method,
    onSuccess,
    submitLabel,
}: HolidayFormProps) {
    return (
        <Form
            action={action}
            method={method}
            disableWhileProcessing
            onSuccess={onSuccess}
            onError={() => toast.error('Please check the holiday form.')}
            className="grid gap-4"
        >
            {({ errors, processing }) => (
                <>
                    <div className="grid gap-2">
                        <Label htmlFor={`${method}-holiday-name`}>Name</Label>
                        <Input
                            id={`${method}-holiday-name`}
                            name="name"
                            defaultValue={holiday?.name ?? ''}
                            placeholder="Hari Raya Idulfitri"
                            aria-invalid={!!errors.name}
                        />
                        {errors.name && (
                            <p className="text-sm text-destructive">
                                {errors.name}
                            </p>
                        )}
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor={`${method}-holiday-date`}>
                                Date
                            </Label>
                            <Input
                                id={`${method}-holiday-date`}
                                name="date"
                                type="date"
                                defaultValue={holiday?.date ?? ''}
                                aria-invalid={!!errors.date}
                            />
                            {errors.date && (
                                <p className="text-sm text-destructive">
                                    {errors.date}
                                </p>
                            )}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor={`${method}-holiday-type`}>
                                Type
                            </Label>
                            <Select
                                name="type"
                                defaultValue={holiday?.type ?? 'national'}
                            >
                                <SelectTrigger
                                    id={`${method}-holiday-type`}
                                    className="w-full"
                                >
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="national">
                                        National
                                    </SelectItem>
                                    <SelectItem value="collective_leave">
                                        Collective leave
                                    </SelectItem>
                                    <SelectItem value="internal">
                                        Internal
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.type && (
                                <p className="text-sm text-destructive">
                                    {errors.type}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor={`${method}-holiday-status`}>
                            Status
                        </Label>
                        <Select
                            name="status"
                            defaultValue={holiday?.status ?? 'active'}
                        >
                            <SelectTrigger
                                id={`${method}-holiday-status`}
                                className="w-full"
                            >
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">
                                    Inactive
                                </SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.status && (
                            <p className="text-sm text-destructive">
                                {errors.status}
                            </p>
                        )}
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={processing}>
                            {submitLabel}
                        </Button>
                    </DialogFooter>
                </>
            )}
        </Form>
    );
}

export default function PublicHolidays({
    holidays,
}: {
    holidays: PublicHoliday[];
}) {
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [importDialogOpen, setImportDialogOpen] = useState(false);
    const [editingHoliday, setEditingHoliday] = useState<PublicHoliday | null>(
        null,
    );
    const [deletingHoliday, setDeletingHoliday] =
        useState<PublicHoliday | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [importYear, setImportYear] = useState(
        String(new Date().getFullYear()),
    );
    const [generatedHolidays, setGeneratedHolidays] = useState<
        GeneratedHoliday[]
    >([]);
    const [isGeneratingHolidays, setIsGeneratingHolidays] = useState(false);
    const currentDate = todayDate();

    useEffect(() => {
        if (!importDialogOpen) {
            return;
        }

        const numericYear = Number(importYear);

        if (!Number.isInteger(numericYear)) {
            setGeneratedHolidays([]);

            return;
        }

        let canceled = false;

        setIsGeneratingHolidays(true);

        import('date-holidays')
            .then(({ default: Holidays }) => {
                if (canceled) {
                    return;
                }

                const indonesiaHolidays = new Holidays('ID');
                const generated = indonesiaHolidays
                    .getHolidays(numericYear)
                    .map((holiday) => ({
                        date: holiday.date.slice(0, 10),
                        name: holiday.name,
                        type: 'national' as const,
                    }))
                    .filter(
                        (holiday, index, holidays) =>
                            holidays.findIndex(
                                (item) =>
                                    item.date === holiday.date &&
                                    item.name === holiday.name,
                            ) === index,
                    );

                setGeneratedHolidays(generated);
            })
            .catch(() => {
                if (!canceled) {
                    setGeneratedHolidays([]);
                    toast.error('Unable to generate Indonesian holidays.');
                }
            })
            .finally(() => {
                if (!canceled) {
                    setIsGeneratingHolidays(false);
                }
            });

        return () => {
            canceled = true;
        };
    }, [importDialogOpen, importYear]);

    const filteredHolidays = useMemo(() => {
        const normalizedSearch = searchQuery.trim().toLowerCase();

        if (!normalizedSearch) {
            return holidays;
        }

        return holidays.filter((holiday) =>
            [
                holiday.name,
                holiday.date,
                typeLabel[holiday.type],
                statusLabel[holiday.status],
                sourceLabel[holiday.source],
            ].some((value) => value.toLowerCase().includes(normalizedSearch)),
        );
    }, [holidays, searchQuery]);
    const {
        changeRowsPerPage,
        firstItemIndex,
        goToPage,
        resetPage,
        rowsPerPage,
        safeCurrentPage,
        totalPages,
        visibleItems: visibleHolidays,
    } = useClientPagination({ items: filteredHolidays });
    const upcomingBlocks = holidays.filter(
        (holiday) => holiday.status === 'active' && holiday.date >= currentDate,
    ).length;
    const libraryImports = holidays.filter(
        (holiday) => holiday.source === 'library',
    ).length;

    return (
        <>
            <Head title="Public Holidays" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="font-heading text-2xl font-semibold">
                            Public Holidays
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Manage blocked dates for schedules, classes, and
                            mentoring sessions.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Dialog
                            open={importDialogOpen}
                            onOpenChange={setImportDialogOpen}
                        >
                            <DialogTrigger asChild>
                                <Button variant="outline">
                                    <Download className="size-4" />
                                    Import holidays
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>
                                        Import Indonesian holidays
                                    </DialogTitle>
                                    <DialogDescription>
                                        Generate holidays from the library, then
                                        save them as editable records.
                                    </DialogDescription>
                                </DialogHeader>
                                <Form
                                    action="/scheduling/public-holidays/import"
                                    method="post"
                                    disableWhileProcessing
                                    onSuccess={() => {
                                        setImportDialogOpen(false);
                                        toast.success('Holidays imported.');
                                    }}
                                    onError={() =>
                                        toast.error(
                                            'Unable to import holidays.',
                                        )
                                    }
                                    className="grid gap-4"
                                >
                                    {({ processing }) => (
                                        <>
                                            <input
                                                type="hidden"
                                                name="year"
                                                value={importYear}
                                            />
                                            {generatedHolidays.map(
                                                (holiday, index) => (
                                                    <div
                                                        key={`${holiday.date}-${holiday.name}`}
                                                    >
                                                        <input
                                                            type="hidden"
                                                            name={`holidays[${index}][date]`}
                                                            value={holiday.date}
                                                        />
                                                        <input
                                                            type="hidden"
                                                            name={`holidays[${index}][name]`}
                                                            value={holiday.name}
                                                        />
                                                        <input
                                                            type="hidden"
                                                            name={`holidays[${index}][type]`}
                                                            value={holiday.type}
                                                        />
                                                    </div>
                                                ),
                                            )}
                                            <div className="grid gap-2">
                                                <Label htmlFor="import-year">
                                                    Year
                                                </Label>
                                                <Input
                                                    id="import-year"
                                                    type="number"
                                                    min="2000"
                                                    max="2100"
                                                    value={importYear}
                                                    onChange={(event) =>
                                                        setImportYear(
                                                            event.target.value,
                                                        )
                                                    }
                                                />
                                            </div>
                                            <div className="rounded-2xl border border-dashed p-4 text-sm text-muted-foreground">
                                                {isGeneratingHolidays
                                                    ? 'Generating Indonesian holidays...'
                                                    : `${generatedHolidays.length} holidays will be imported for ${importYear}.`}
                                            </div>
                                            <DialogFooter>
                                                <Button
                                                    type="submit"
                                                    disabled={
                                                        processing ||
                                                        isGeneratingHolidays ||
                                                        generatedHolidays.length ===
                                                            0
                                                    }
                                                >
                                                    Import holidays
                                                </Button>
                                            </DialogFooter>
                                        </>
                                    )}
                                </Form>
                            </DialogContent>
                        </Dialog>
                        <Dialog
                            open={addDialogOpen}
                            onOpenChange={setAddDialogOpen}
                        >
                            <DialogTrigger asChild>
                                <Button>
                                    <Plus className="size-4" />
                                    Add holiday
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Add holiday</DialogTitle>
                                    <DialogDescription>
                                        Add a national, collective leave, or
                                        internal blocked date.
                                    </DialogDescription>
                                </DialogHeader>
                                <HolidayForm
                                    action="/scheduling/public-holidays"
                                    method="post"
                                    submitLabel="Save holiday"
                                    onSuccess={() => {
                                        setAddDialogOpen(false);
                                        toast.success('Holiday added.');
                                    }}
                                />
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                <Dialog
                    open={!!editingHoliday}
                    onOpenChange={(open) => !open && setEditingHoliday(null)}
                >
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Edit holiday</DialogTitle>
                            <DialogDescription>
                                Update holiday date, type, or status.
                            </DialogDescription>
                        </DialogHeader>
                        {editingHoliday && (
                            <HolidayForm
                                key={editingHoliday.id}
                                action={`/scheduling/public-holidays/${editingHoliday.id}`}
                                holiday={editingHoliday}
                                method="put"
                                submitLabel="Save changes"
                                onSuccess={() => {
                                    setEditingHoliday(null);
                                    toast.success('Holiday updated.');
                                }}
                            />
                        )}
                    </DialogContent>
                </Dialog>

                <AlertDialog
                    open={!!deletingHoliday}
                    onOpenChange={(open) => !open && setDeletingHoliday(null)}
                >
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>
                                Deactivate holiday?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                                This deactivates {deletingHoliday?.name} from
                                blocked schedule dates.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        {deletingHoliday && (
                            <Form
                                action={`/scheduling/public-holidays/${deletingHoliday.id}`}
                                method="delete"
                                disableWhileProcessing
                                onSuccess={() => {
                                    setDeletingHoliday(null);
                                    toast.success('Holiday deactivated.');
                                }}
                                onError={() =>
                                    toast.error(
                                        'Holiday could not be deactivated.',
                                    )
                                }
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
                                            Deactivate holiday
                                        </Button>
                                    </AlertDialogFooter>
                                )}
                            </Form>
                        )}
                    </AlertDialogContent>
                </AlertDialog>

                <div className="grid gap-4 md:grid-cols-3">
                    <SummaryCard
                        icon={CalendarOff}
                        label="Total holidays"
                        value={holidays.length}
                    />
                    <SummaryCard
                        icon={CalendarPlus}
                        label="Upcoming blocks"
                        value={upcomingBlocks}
                    />
                    <SummaryCard
                        icon={Download}
                        label="Library imports"
                        value={libraryImports}
                    />
                </div>

                <Card>
                    <CardHeader className="gap-4 md:flex-row md:items-center md:justify-between">
                        <CardTitle>Holiday list</CardTitle>
                        <TableSearch
                            value={searchQuery}
                            onChange={(value) => {
                                setSearchQuery(value);
                                resetPage();
                            }}
                            placeholder="Search holidays..."
                        />
                    </CardHeader>
                    <CardContent>
                        {holidays.length === 0 ? (
                            <EmptyState>
                                No public holidays added yet.
                            </EmptyState>
                        ) : filteredHolidays.length === 0 ? (
                            <EmptyState>
                                No public holidays match your search.
                            </EmptyState>
                        ) : (
                            <>
                                <div className="rounded-2xl border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Name</TableHead>
                                                <TableHead>Date</TableHead>
                                                <TableHead>Type</TableHead>
                                                <TableHead>Source</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="w-12 text-right" />
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {visibleHolidays.map((holiday) => (
                                                <TableRow key={holiday.id}>
                                                    <TableCell className="font-medium">
                                                        {holiday.name}
                                                    </TableCell>
                                                    <TableCell>
                                                        {formatHolidayDate(
                                                            holiday.date,
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            {...getBadgeProps(
                                                                'outline',
                                                            )}
                                                        >
                                                            {
                                                                typeLabel[
                                                                    holiday.type
                                                                ]
                                                            }
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            {...getBadgeProps(
                                                                'muted',
                                                            )}
                                                        >
                                                            {
                                                                sourceLabel[
                                                                    holiday
                                                                        .source
                                                                ]
                                                            }
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            {...getBadgeProps(
                                                                holiday.status ===
                                                                    'active'
                                                                    ? 'success'
                                                                    : 'muted',
                                                            )}
                                                        >
                                                            {
                                                                statusLabel[
                                                                    holiday
                                                                        .status
                                                                ]
                                                            }
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <ActionMenu label="Open holiday actions">
                                                            <DropdownMenuItem
                                                                onClick={() =>
                                                                    setEditingHoliday(
                                                                        holiday,
                                                                    )
                                                                }
                                                            >
                                                                <Pencil className="size-4" />
                                                                Edit
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                variant="destructive"
                                                                onClick={() =>
                                                                    setDeletingHoliday(
                                                                        holiday,
                                                                    )
                                                                }
                                                            >
                                                                <PowerOff className="size-4" />
                                                                Deactivate
                                                            </DropdownMenuItem>
                                                        </ActionMenu>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                                <TablePagination
                                    entity="holidays"
                                    firstItemIndex={firstItemIndex}
                                    onPageChange={goToPage}
                                    onRowsPerPageChange={changeRowsPerPage}
                                    rowsPerPage={rowsPerPage}
                                    safeCurrentPage={safeCurrentPage}
                                    totalItems={filteredHolidays.length}
                                    totalPages={totalPages}
                                />
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

PublicHolidays.layout = {
    breadcrumbs: [
        {
            title: 'Scheduling',
            href: '/scheduling/schedules',
        },
        {
            title: 'Public Holidays',
            href: '/scheduling/public-holidays',
        },
    ],
};
