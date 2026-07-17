import { Form, Head } from '@inertiajs/react';
import { Eye, Pencil, PowerOff, Shapes, UsersRound } from 'lucide-react';
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
import { CreateDialogField } from '@/pages/admin/academics/fields/components/create-dialog-field';
import { UpdateDialogField } from '@/pages/admin/academics/fields/components/update-dialog-field';

type Field = {
    description?: string | null;
    id: number;
    name: string;
    programsCount: number;
    slug: string;
    subjectsCount: number;
    status: string;
};

export default function Fields({ fields }: { fields: Field[] }) {
    const [addFieldDialogOpen, setAddFieldDialogOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [viewingField, setViewingField] = useState<Field | null>(null);
    const [editingField, setEditingField] = useState<Field | null>(null);
    const [deletingField, setDeletingField] = useState<Field | null>(null);
    const activeFieldsCount = fields.filter(
        (field) => field.status === 'active',
    ).length;
    const filteredFields = useMemo(() => {
        const normalizedSearch = searchQuery.trim().toLowerCase();

        if (!normalizedSearch) {
            return fields;
        }

        return fields.filter((field) =>
            [field.name, field.status].some((value) =>
                value.toLowerCase().includes(normalizedSearch),
            ),
        );
    }, [fields, searchQuery]);
    const {
        changeRowsPerPage,
        firstItemIndex,
        goToPage,
        resetPage,
        rowsPerPage,
        safeCurrentPage,
        totalPages,
        visibleItems: visibleFields,
    } = useClientPagination({ items: filteredFields });

    return (
        <>
            <Head title="Fields" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="font-heading text-2xl font-semibold">
                            Fields
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Manage academic fields that group programs and
                            subjects.
                        </p>
                    </div>
                    <CreateDialogField
                        open={addFieldDialogOpen}
                        onOpenChange={setAddFieldDialogOpen}
                        onSuccess={() => {
                            setAddFieldDialogOpen(false);
                            toast.success('Field added.');
                        }}
                        onError={() => {
                            toast.error('Please check the field form.');
                        }}
                    />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <SummaryCard
                        icon={Shapes}
                        label="Total fields"
                        value={fields.length}
                    />
                    <SummaryCard
                        icon={UsersRound}
                        label="Active fields"
                        value={activeFieldsCount}
                    />
                </div>

                <Dialog
                    open={!!viewingField}
                    onOpenChange={(open) => {
                        if (!open) {
                            setViewingField(null);
                        }
                    }}
                >
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{viewingField?.name}</DialogTitle>
                            <DialogDescription>
                                Field detail and current academic mapping.
                            </DialogDescription>
                        </DialogHeader>
                        {viewingField && (
                            <div className="grid gap-4 text-sm">
                                <div>
                                    <p className="text-muted-foreground">
                                        Description
                                    </p>
                                    <p className="mt-1">
                                        {viewingField.description ||
                                            'No description.'}
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="rounded-2xl border p-4">
                                        <p className="text-muted-foreground">
                                            Programs
                                        </p>
                                        <p className="mt-1 text-lg font-semibold">
                                            {viewingField.programsCount}
                                        </p>
                                    </div>
                                    <div className="rounded-2xl border p-4">
                                        <p className="text-muted-foreground">
                                            Subjects
                                        </p>
                                        <p className="mt-1 text-lg font-semibold">
                                            {viewingField.subjectsCount}
                                        </p>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">
                                        Status
                                    </p>
                                    <Badge
                                        {...getBadgeProps(
                                            viewingField.status === 'active'
                                                ? 'success'
                                                : 'muted',
                                            'mt-2',
                                        )}
                                    >
                                        {formatBadgeLabel(viewingField.status)}
                                    </Badge>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                <UpdateDialogField
                    open={!!editingField}
                    onOpenChange={(open) => {
                        if (!open) {
                            setEditingField(null);
                        }
                    }}
                    field={
                        editingField
                            ? {
                                  ...editingField,
                                  description:
                                      editingField.description ?? undefined,
                                  status: editingField.status as
                                      | 'active'
                                      | 'draft'
                                      | 'inactive',
                              }
                            : null
                    }
                    onSuccess={() => {
                        setEditingField(null);
                        toast.success('Field updated.');
                    }}
                    onError={() => {
                        toast.error('Please check the field form.');
                    }}
                />

                <AlertDialog
                    open={!!deletingField}
                    onOpenChange={(open) => {
                        if (!open) {
                            setDeletingField(null);
                        }
                    }}
                >
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>
                                Deactivate field?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                                This will deactivate {deletingField?.name} from
                                the academic field list.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        {deletingField && (
                            <Form
                                action={`/academics/fields/${deletingField.slug}`}
                                method="delete"
                                disableWhileProcessing
                                onSuccess={() => {
                                    setDeletingField(null);
                                    toast.success('Field deactivated.');
                                }}
                                onError={() => {
                                    toast.error(
                                        'Unable to deactivate this field.',
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
                                            Deactivate field
                                        </Button>
                                    </AlertDialogFooter>
                                )}
                            </Form>
                        )}
                    </AlertDialogContent>
                </AlertDialog>

                <Card>
                    <CardHeader className="gap-4 md:flex-row md:items-center md:justify-between">
                        <CardTitle>Field list</CardTitle>
                        <TableSearch
                            value={searchQuery}
                            onChange={(value) => {
                                setSearchQuery(value);
                                resetPage();
                            }}
                            placeholder="Search fields..."
                        />
                    </CardHeader>
                    <CardContent>
                        {fields.length === 0 ? (
                            <EmptyState>No fields added yet.</EmptyState>
                        ) : filteredFields.length === 0 ? (
                            <EmptyState>
                                No fields match your search.
                            </EmptyState>
                        ) : (
                            <>
                                <div className="rounded-2xl border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Name</TableHead>
                                                <TableHead>Programs</TableHead>
                                                <TableHead>Subjects</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="w-12 text-right" />
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {visibleFields.map((field) => (
                                                <TableRow key={field.id}>
                                                    <TableCell className="font-medium">
                                                        {field.name}
                                                    </TableCell>
                                                    <TableCell>
                                                        {field.programsCount}{' '}
                                                        programs
                                                    </TableCell>
                                                    <TableCell>
                                                        {field.subjectsCount}{' '}
                                                        subjects
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            {...getBadgeProps(
                                                                field.status ===
                                                                    'active'
                                                                    ? 'success'
                                                                    : 'muted',
                                                            )}
                                                        >
                                                            {formatBadgeLabel(
                                                                field.status,
                                                            )}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <ActionMenu label="Open field actions">
                                                            <DropdownMenuItem
                                                                onClick={() =>
                                                                    setViewingField(
                                                                        field,
                                                                    )
                                                                }
                                                            >
                                                                <Eye className="size-4" />
                                                                View
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() =>
                                                                    setEditingField(
                                                                        field,
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
                                                                    setDeletingField(
                                                                        field,
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
                                    entity="fields"
                                    firstItemIndex={firstItemIndex}
                                    onPageChange={goToPage}
                                    onRowsPerPageChange={changeRowsPerPage}
                                    rowsPerPage={rowsPerPage}
                                    safeCurrentPage={safeCurrentPage}
                                    totalItems={filteredFields.length}
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

Fields.layout = {
    breadcrumbs: [
        {
            title: 'Academics',
            href: '/academics/fields',
        },
        {
            title: 'Fields',
            href: '/academics/fields',
        },
    ],
};
