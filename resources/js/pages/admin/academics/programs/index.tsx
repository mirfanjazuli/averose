import { Form, Head, Link } from '@inertiajs/react';
import { Eye, Layers3, Pencil, Plus, PowerOff, UsersRound } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ActionMenu } from '@/components/admin/action-menu';
import { formatBadgeLabel, getBadgeProps } from '@/lib/badge';
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
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    DropdownMenuItem,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useClientPagination } from '@/hooks/use-client-pagination';
import type {
    AcademicProgramFieldOption,
    AcademicProgramFormProgram,
} from '@/pages/admin/academics/programs/components/academic-program-form';
import { AcademicProgramForm } from '@/pages/admin/academics/programs/components/academic-program-form';

type Program = AcademicProgramFormProgram & {
    description?: string | null;
    field: string;
    id: number;
    slug: string;
    thumbnailUrl?: string | null;
    subjects: string;
    students: string;
    status: string;
};

export default function Programs({
    fieldOptions,
    programs,
}: {
    fieldOptions: AcademicProgramFieldOption[];
    programs: Program[];
}) {
    const [addProgramDialogOpen, setAddProgramDialogOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [editingProgram, setEditingProgram] = useState<Program | null>(null);
    const [deletingProgram, setDeletingProgram] = useState<Program | null>(
        null,
    );

    const filteredPrograms = useMemo(() => {
        const normalizedSearch = searchQuery.trim().toLowerCase();

        if (!normalizedSearch) {
            return programs;
        }

        return programs.filter((program) =>
            [
                program.name,
                program.field,
                program.subjects,
                program.students,
                program.status,
            ].some((value) => value.toLowerCase().includes(normalizedSearch)),
        );
    }, [programs, searchQuery]);
    const {
        changeRowsPerPage,
        firstItemIndex,
        goToPage,
        resetPage,
        rowsPerPage,
        safeCurrentPage,
        totalPages,
        visibleItems: visiblePrograms,
    } = useClientPagination({ items: filteredPrograms });

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
                    <Dialog
                        open={addProgramDialogOpen}
                        onOpenChange={setAddProgramDialogOpen}
                    >
                        <DialogTrigger asChild>
                            <Button className="gap-2">
                                <Plus className="size-4" />
                                Add program
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="scrollbar-stable max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-4xl">
                            <DialogHeader>
                                <DialogTitle>Add program</DialogTitle>
                                <DialogDescription>
                                    Create a program and map its fields,
                                    subjects, and variants.
                                </DialogDescription>
                            </DialogHeader>
                            <AcademicProgramForm
                                action="/academics/programs"
                                fieldOptions={fieldOptions}
                                idPrefix="program"
                                method="post"
                                resetOnSuccess
                                onSuccess={() => {
                                    setAddProgramDialogOpen(false);
                                    toast.success('Program added.');
                                }}
                                onError={() => {
                                    toast.error(
                                        'Please check the program form.',
                                    );
                                }}
                                submitLabel="Save program"
                            />
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <SummaryCard
                        icon={Layers3}
                        label="Total programs"
                        value={programs.length}
                    />
                    <SummaryCard
                        icon={UsersRound}
                        label="Enrolled students"
                        value={106}
                    />
                </div>

                <Dialog
                    open={!!editingProgram}
                    onOpenChange={(open) => {
                        if (!open) {
                            setEditingProgram(null);
                        }
                    }}
                >
                    <DialogContent className="scrollbar-stable max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-4xl">
                        <DialogHeader>
                            <DialogTitle>Edit program</DialogTitle>
                            <DialogDescription>
                                Update this program and its academic mapping.
                            </DialogDescription>
                        </DialogHeader>
                        {editingProgram && (
                            <AcademicProgramForm
                                key={editingProgram.id}
                                action={`/academics/programs/${editingProgram.slug}`}
                                fieldOptions={fieldOptions}
                                idPrefix="edit-program"
                                method="put"
                                program={editingProgram}
                                onSuccess={() => {
                                    setEditingProgram(null);
                                    toast.success('Program updated.');
                                }}
                                onError={() => {
                                    toast.error(
                                        'Please check the program form.',
                                    );
                                }}
                                submitLabel="Save changes"
                            />
                        )}
                    </DialogContent>
                </Dialog>

                <AlertDialog
                    open={!!deletingProgram}
                    onOpenChange={(open) => {
                        if (!open) {
                            setDeletingProgram(null);
                        }
                    }}
                >
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>
                                Deactivate program?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                                This will deactivate {deletingProgram?.name}{' '}
                                from the program list.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        {deletingProgram && (
                            <Form
                                action={`/academics/programs/${deletingProgram.slug}`}
                                method="delete"
                                disableWhileProcessing
                                onSuccess={() => {
                                    setDeletingProgram(null);
                                    toast.success('Program deactivated.');
                                }}
                                onError={() => {
                                    toast.error(
                                        'Unable to deactivate this program.',
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
                                            Deactivate program
                                        </Button>
                                    </AlertDialogFooter>
                                )}
                            </Form>
                        )}
                    </AlertDialogContent>
                </AlertDialog>

                <Card>
                    <CardHeader className="gap-4 md:flex-row md:items-center md:justify-between">
                        <CardTitle>Program list</CardTitle>
                        <TableSearch
                            value={searchQuery}
                            onChange={(value) => {
                                setSearchQuery(value);
                                resetPage();
                            }}
                            placeholder="Search programs..."
                        />
                    </CardHeader>
                    <CardContent>
                        {programs.length === 0 ? (
                            <EmptyState>No programs added yet.</EmptyState>
                        ) : filteredPrograms.length === 0 ? (
                            <EmptyState>
                                No programs match your search.
                            </EmptyState>
                        ) : (
                            <>
                                <div className="rounded-2xl border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-20">
                                                    Image
                                                </TableHead>
                                                <TableHead>Name</TableHead>
                                                <TableHead>Field</TableHead>
                                                <TableHead>Subjects</TableHead>
                                                <TableHead>Students</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="w-12 text-right" />
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {visiblePrograms.map((program) => (
                                                <TableRow key={program.id}>
                                                    <TableCell>
                                                        {program.thumbnailUrl ? (
                                                            <img
                                                                src={
                                                                    program.thumbnailUrl
                                                                }
                                                                alt=""
                                                                className="aspect-video h-12 w-16 rounded-xl object-cover"
                                                            />
                                                        ) : (
                                                            <div className="flex aspect-video h-12 w-16 items-center justify-center rounded-xl bg-muted text-xs text-muted-foreground">
                                                                -
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="font-medium">
                                                        {program.name}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            {...getBadgeProps(
                                                                'outline',
                                                            )}
                                                        >
                                                            {program.field}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        {program.subjects}
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground">
                                                        {program.students}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            {...getBadgeProps(
                                                                program.status ===
                                                                    'active'
                                                                    ? 'success'
                                                                    : 'muted',
                                                            )}
                                                        >
                                                            {formatBadgeLabel(
                                                                program.status,
                                                            )}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <ActionMenu label="Open program actions">
                                                            <DropdownMenuItem
                                                                asChild
                                                            >
                                                                <Link
                                                                    href={`/academics/programs/${program.slug}`}
                                                                >
                                                                    <Eye className="size-4" />
                                                                    View
                                                                </Link>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() =>
                                                                    setEditingProgram(
                                                                        program,
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
                                                                    setDeletingProgram(
                                                                        program,
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
                                    entity="programs"
                                    firstItemIndex={firstItemIndex}
                                    onPageChange={goToPage}
                                    onRowsPerPageChange={changeRowsPerPage}
                                    rowsPerPage={rowsPerPage}
                                    safeCurrentPage={safeCurrentPage}
                                    totalItems={filteredPrograms.length}
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
