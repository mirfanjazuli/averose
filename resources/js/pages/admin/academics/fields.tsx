import { Form, Head } from '@inertiajs/react';
import {
    Eye,
    MoreVertical,
    Pencil,
    Plus,
    Search,
    Shapes,
    Trash2,
    UsersRound,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { AcademicFieldForm } from '@/components/academic-field-form';
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
    Pagination,
    PaginationButton,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';
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
    const [currentPage, setCurrentPage] = useState(1);
    const [fieldsPerPage, setFieldsPerPage] = useState(5);
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
    const totalPages = Math.max(
        1,
        Math.ceil(filteredFields.length / fieldsPerPage),
    );
    const safeCurrentPage = Math.min(currentPage, totalPages);
    const firstFieldIndex = (safeCurrentPage - 1) * fieldsPerPage;
    const visibleFields = filteredFields.slice(
        firstFieldIndex,
        firstFieldIndex + fieldsPerPage,
    );

    const goToPage = (page: number) => {
        setCurrentPage(Math.min(Math.max(page, 1), totalPages));
    };

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
                    <Dialog
                        open={addFieldDialogOpen}
                        onOpenChange={setAddFieldDialogOpen}
                    >
                        <DialogTrigger asChild>
                            <Button className="gap-2">
                                <Plus className="size-4" />
                                Add field
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add field</DialogTitle>
                                <DialogDescription>
                                    Create an academic field for grouping
                                    programs and subjects.
                                </DialogDescription>
                            </DialogHeader>
                            <AcademicFieldForm
                                action="/academics/fields"
                                idPrefix="field"
                                resetOnSuccess
                                onSuccess={() => {
                                    setAddFieldDialogOpen(false);
                                    toast.success('Field added.');
                                }}
                                onError={() => {
                                    toast.error('Please check the field form.');
                                }}
                                submitLabel="Save field"
                            />
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                        <CardContent className="flex items-center gap-4 px-6 py-5">
                            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                <Shapes className="size-5" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Total fields
                                </p>
                                <p className="text-2xl font-semibold">
                                    {fields.length}
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
                                    Active fields
                                </p>
                                <p className="text-2xl font-semibold">
                                    {activeFieldsCount}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
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
                                        className="mt-2"
                                        variant={
                                            viewingField.status === 'active'
                                                ? 'default'
                                                : 'secondary'
                                        }
                                    >
                                        {viewingField.status}
                                    </Badge>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                <Dialog
                    open={!!editingField}
                    onOpenChange={(open) => {
                        if (!open) {
                            setEditingField(null);
                        }
                    }}
                >
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Edit field</DialogTitle>
                            <DialogDescription>
                                Update this academic field.
                            </DialogDescription>
                        </DialogHeader>
                        {editingField && (
                            <AcademicFieldForm
                                key={editingField.id}
                                action={`/academics/fields/${editingField.slug}`}
                                field={{
                                    description:
                                        editingField.description ?? undefined,
                                    name: editingField.name,
                                    status: editingField.status as
                                        | 'active'
                                        | 'draft'
                                        | 'inactive',
                                }}
                                idPrefix="edit-field"
                                method="put"
                                onSuccess={() => {
                                    setEditingField(null);
                                    toast.success('Field updated.');
                                }}
                                onError={() => {
                                    toast.error('Please check the field form.');
                                }}
                                submitLabel="Save changes"
                            />
                        )}
                    </DialogContent>
                </Dialog>

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
                            <AlertDialogTitle>Delete field?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will remove {deletingField?.name} from the
                                academic field list.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        {deletingField && (
                            <Form
                                action={`/academics/fields/${deletingField.slug}`}
                                method="delete"
                                disableWhileProcessing
                                onSuccess={() => {
                                    setDeletingField(null);
                                    toast.success('Field deleted.');
                                }}
                                onError={() => {
                                    toast.error('Unable to delete this field.');
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
                                            Delete field
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
                        <div className="flex h-10 min-w-64 items-center gap-2 rounded-2xl border bg-background px-3 text-sm text-muted-foreground">
                            <Search className="size-4" />
                            <Input
                                value={searchQuery}
                                onChange={(event) => {
                                    setSearchQuery(event.target.value);
                                    setCurrentPage(1);
                                }}
                                placeholder="Search fields..."
                                className="h-auto border-0 bg-transparent px-0 py-0 shadow-none focus-visible:ring-0"
                            />
                        </div>
                    </CardHeader>
                    <CardContent>
                        {fields.length === 0 ? (
                            <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                                No fields added yet.
                            </div>
                        ) : filteredFields.length === 0 ? (
                            <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                                No fields match your search.
                            </div>
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
                                                            variant={
                                                                field.status ===
                                                                'active'
                                                                    ? 'default'
                                                                    : 'secondary'
                                                            }
                                                        >
                                                            {field.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger
                                                                asChild
                                                            >
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon-sm"
                                                                    className="rounded-full"
                                                                >
                                                                    <MoreVertical className="size-4" />
                                                                    <span className="sr-only">
                                                                        Open
                                                                        field
                                                                        actions
                                                                    </span>
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent
                                                                align="end"
                                                                className="w-40"
                                                            >
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
                                                                    <Trash2 className="size-4" />
                                                                    Delete
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                                <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
                                    <p className="text-sm text-muted-foreground">
                                        Showing {firstFieldIndex + 1}-
                                        {Math.min(
                                            firstFieldIndex + fieldsPerPage,
                                            filteredFields.length,
                                        )}{' '}
                                        of {filteredFields.length} fields
                                    </p>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground lg:justify-center">
                                        <span>Rows per page</span>
                                        <Select
                                            value={String(fieldsPerPage)}
                                            onValueChange={(value) => {
                                                setFieldsPerPage(Number(value));
                                                setCurrentPage(1);
                                            }}
                                        >
                                            <SelectTrigger className="h-9 w-20 rounded-xl">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="5">
                                                    5
                                                </SelectItem>
                                                <SelectItem value="10">
                                                    10
                                                </SelectItem>
                                                <SelectItem value="20">
                                                    20
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <Pagination className="mx-0 w-auto justify-start lg:justify-end">
                                        <PaginationContent>
                                            <PaginationItem>
                                                <PaginationPrevious
                                                    href="#"
                                                    className={
                                                        safeCurrentPage === 1
                                                            ? 'pointer-events-none opacity-50'
                                                            : undefined
                                                    }
                                                    onClick={(event) => {
                                                        event.preventDefault();
                                                        goToPage(
                                                            safeCurrentPage - 1,
                                                        );
                                                    }}
                                                />
                                            </PaginationItem>
                                            {Array.from(
                                                { length: totalPages },
                                                (_, index) => index + 1,
                                            ).map((page) => (
                                                <PaginationItem key={page}>
                                                    <PaginationButton
                                                        type="button"
                                                        isActive={
                                                            safeCurrentPage ===
                                                            page
                                                        }
                                                        onClick={() =>
                                                            goToPage(page)
                                                        }
                                                    >
                                                        {page}
                                                    </PaginationButton>
                                                </PaginationItem>
                                            ))}
                                            {totalPages > 5 && (
                                                <PaginationItem>
                                                    <PaginationEllipsis />
                                                </PaginationItem>
                                            )}
                                            <PaginationItem>
                                                <PaginationNext
                                                    href="#"
                                                    className={
                                                        safeCurrentPage ===
                                                        totalPages
                                                            ? 'pointer-events-none opacity-50'
                                                            : undefined
                                                    }
                                                    onClick={(event) => {
                                                        event.preventDefault();
                                                        goToPage(
                                                            safeCurrentPage + 1,
                                                        );
                                                    }}
                                                />
                                            </PaginationItem>
                                        </PaginationContent>
                                    </Pagination>
                                </div>
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
