import { Form, Head, Link } from '@inertiajs/react';
import {
    BadgeDollarSign,
    CheckCircle2,
    Eye,
    Pencil,
    PowerOff,
    Plus,
    Star,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { ActionMenu } from '@/components/admin/action-menu';
import { StatusBadge } from '@/components/admin/status-badge';
import { SummaryCard } from '@/components/admin/summary-card';
import { AdminTableSection } from '@/components/admin/table-section';
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
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
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useClientPagination } from '@/hooks/use-client-pagination';

type MentorLevel = {
    hourlyRate: string;
    id: number;
    mentorsCount: number;
    name: string;
    slug: string;
    status: string;
};

function formatCurrency(value: string) {
    return new Intl.NumberFormat('id-ID', {
        currency: 'IDR',
        maximumFractionDigits: 0,
        style: 'currency',
    }).format(Number(value));
}

function MentorLevelForm({
    action,
    level,
    method,
    onSuccess,
    submitLabel,
}: {
    action: string;
    level?: MentorLevel | null;
    method: 'post' | 'put';
    onSuccess: () => void;
    submitLabel: string;
}) {
    return (
        <Form
            action={action}
            method={method}
            disableWhileProcessing
            onSuccess={onSuccess}
            onError={() => toast.error('Please check the mentor level form.')}
            className="grid gap-4"
        >
            {({ errors, processing }) => (
                <>
                    <div className="grid gap-2">
                        <Label htmlFor="mentor-level-name">Name</Label>
                        <Input
                            id="mentor-level-name"
                            name="name"
                            defaultValue={level?.name}
                            placeholder="Junior"
                            aria-invalid={!!errors.name}
                        />
                        {errors.name && (
                            <p className="text-sm text-destructive">
                                {errors.name}
                            </p>
                        )}
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="mentor-level-rate">Hourly rate</Label>
                        <Input
                            id="mentor-level-rate"
                            name="hourly_rate"
                            type="number"
                            min="0"
                            step="1000"
                            defaultValue={level?.hourlyRate ?? '0'}
                            placeholder="0"
                            aria-invalid={!!errors.hourly_rate}
                        />
                        {errors.hourly_rate && (
                            <p className="text-sm text-destructive">
                                {errors.hourly_rate}
                            </p>
                        )}
                    </div>
                    <DialogFooter className="pt-2">
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Saving...' : submitLabel}
                        </Button>
                    </DialogFooter>
                </>
            )}
        </Form>
    );
}

export default function MentorLevels({ levels }: { levels: MentorLevel[] }) {
    const [createOpen, setCreateOpen] = useState(false);
    const [editingLevel, setEditingLevel] = useState<MentorLevel | null>(null);
    const [deactivatingLevel, setDeactivatingLevel] =
        useState<MentorLevel | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const activeCount = levels.filter(
        (level) => level.status === 'active',
    ).length;
    const assignedCount = levels.reduce(
        (total, level) => total + level.mentorsCount,
        0,
    );
    const filteredLevels = useMemo(() => {
        const normalizedSearch = searchQuery.trim().toLowerCase();

        if (!normalizedSearch) {
            return levels;
        }

        return levels.filter((level) =>
            [level.name, level.status, level.hourlyRate].some((value) =>
                value.toLowerCase().includes(normalizedSearch),
            ),
        );
    }, [levels, searchQuery]);
    const {
        changeRowsPerPage,
        firstItemIndex,
        goToPage,
        resetPage,
        rowsPerPage,
        safeCurrentPage,
        totalPages,
        visibleItems,
    } = useClientPagination({ items: filteredLevels });

    return (
        <>
            <Head title="Mentor Levels" />
            <div className="flex min-h-full max-w-full min-w-0 flex-1 flex-col gap-6 p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="font-heading text-2xl font-semibold">
                            Mentor Levels
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Manage mentor levels and hourly payroll rates.
                        </p>
                    </div>
                    <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2">
                                <Plus className="size-4" />
                                Add level
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add mentor level</DialogTitle>
                                <DialogDescription>
                                    Create a payroll-ready mentor level.
                                </DialogDescription>
                            </DialogHeader>
                            <MentorLevelForm
                                action="/users/mentor-levels"
                                method="post"
                                submitLabel="Save level"
                                onSuccess={() => {
                                    setCreateOpen(false);
                                    toast.success('Mentor level added.');
                                }}
                            />
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <SummaryCard
                        icon={BadgeDollarSign}
                        label="Total levels"
                        value={levels.length}
                    />
                    <SummaryCard
                        icon={CheckCircle2}
                        label="Active levels"
                        value={activeCount}
                    />
                    <SummaryCard
                        icon={Star}
                        label="Assigned mentors"
                        value={assignedCount}
                    />
                </div>

                <Dialog
                    open={!!editingLevel}
                    onOpenChange={(open) => !open && setEditingLevel(null)}
                >
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Edit mentor level</DialogTitle>
                            <DialogDescription>
                                Update level name and hourly rate.
                            </DialogDescription>
                        </DialogHeader>
                        {editingLevel && (
                            <MentorLevelForm
                                action={`/users/mentor-levels/${editingLevel.id}`}
                                level={editingLevel}
                                method="put"
                                submitLabel="Save changes"
                                onSuccess={() => {
                                    setEditingLevel(null);
                                    toast.success('Mentor level updated.');
                                }}
                            />
                        )}
                    </DialogContent>
                </Dialog>

                <AlertDialog
                    open={!!deactivatingLevel}
                    onOpenChange={(open) => !open && setDeactivatingLevel(null)}
                >
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>
                                Deactivate mentor level?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                                This level will no longer appear for new mentor
                                assignments, but existing mentors keep their
                                history.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        {deactivatingLevel && (
                            <Form
                                action={`/users/mentor-levels/${deactivatingLevel.id}`}
                                method="delete"
                                disableWhileProcessing
                                onSuccess={() => {
                                    setDeactivatingLevel(null);
                                    toast.success('Mentor level deactivated.');
                                }}
                                onError={() =>
                                    toast.error(
                                        'Unable to deactivate this level.',
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
                                            Deactivate level
                                        </Button>
                                    </AlertDialogFooter>
                                )}
                            </Form>
                        )}
                    </AlertDialogContent>
                </AlertDialog>

                <AdminTableSection
                    emptyMessage="No mentor levels added yet."
                    emptySearchMessage="No mentor levels match your search."
                    filteredItems={filteredLevels.length}
                    pagination={{
                        entity: 'levels',
                        firstItemIndex,
                        onPageChange: goToPage,
                        onRowsPerPageChange: changeRowsPerPage,
                        rowsPerPage,
                        safeCurrentPage,
                        totalItems: filteredLevels.length,
                        totalPages,
                    }}
                    search={{
                        value: searchQuery,
                        onChange: (value) => {
                            setSearchQuery(value);
                            resetPage();
                        },
                        placeholder: 'Search levels...',
                    }}
                    totalItems={levels.length}
                >
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Hourly Rate</TableHead>
                                <TableHead>Mentors</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="w-12 text-right" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {visibleItems.map((level) => (
                                <TableRow key={level.id}>
                                    <TableCell className="font-medium">
                                        {level.name}
                                    </TableCell>
                                    <TableCell>
                                        {formatCurrency(level.hourlyRate)}
                                    </TableCell>
                                    <TableCell>{level.mentorsCount}</TableCell>
                                    <TableCell>
                                        <StatusBadge status={level.status} />
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <ActionMenu label="Open mentor level actions">
                                            <DropdownMenuItem asChild>
                                                <Link
                                                    href={`/users/mentor-levels/${level.id}`}
                                                >
                                                    <Eye className="size-4" />
                                                    View
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() =>
                                                    setEditingLevel(level)
                                                }
                                            >
                                                <Pencil className="size-4" />
                                                Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                variant="destructive"
                                                onClick={() =>
                                                    setDeactivatingLevel(level)
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
                </AdminTableSection>
            </div>
        </>
    );
}

MentorLevels.layout = {
    breadcrumbs: [
        { title: 'Users', href: '/users/students' },
        { title: 'Mentor Levels', href: '/users/mentor-levels' },
    ],
};
