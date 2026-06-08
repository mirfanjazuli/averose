import { Form, Head, Link } from '@inertiajs/react';
import {
    Eye,
    Layers3,
    MoreVertical,
    Pencil,
    Plus,
    Search,
    Trash2,
    UsersRound,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { AcademicProgramForm } from '@/components/academic-program-form';
import type {
    AcademicProgramFieldOption,
    AcademicProgramFormProgram,
} from '@/components/academic-program-form';
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

type Program = AcademicProgramFormProgram & {
    description?: string | null;
    field: string;
    id: number;
    slug: string;
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
    const [currentPage, setCurrentPage] = useState(1);
    const [programsPerPage, setProgramsPerPage] = useState(5);
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
    const totalPages = Math.max(
        1,
        Math.ceil(filteredPrograms.length / programsPerPage),
    );
    const safeCurrentPage = Math.min(currentPage, totalPages);
    const firstProgramIndex = (safeCurrentPage - 1) * programsPerPage;
    const visiblePrograms = filteredPrograms.slice(
        firstProgramIndex,
        firstProgramIndex + programsPerPage,
    );

    const goToPage = (page: number) => {
        setCurrentPage(Math.min(Math.max(page, 1), totalPages));
    };

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
                        <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-4xl">
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
                    <Card>
                        <CardContent className="flex items-center gap-4 px-6 py-5">
                            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                <Layers3 className="size-5" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Total programs
                                </p>
                                <p className="text-2xl font-semibold">
                                    {programs.length}
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
                                    Enrolled students
                                </p>
                                <p className="text-2xl font-semibold">106</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Dialog
                    open={!!editingProgram}
                    onOpenChange={(open) => {
                        if (!open) {
                            setEditingProgram(null);
                        }
                    }}
                >
                    <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-4xl">
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
                                Delete program?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                                This will remove {deletingProgram?.name} from
                                the program list.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        {deletingProgram && (
                            <Form
                                action={`/academics/programs/${deletingProgram.slug}`}
                                method="delete"
                                disableWhileProcessing
                                onSuccess={() => {
                                    setDeletingProgram(null);
                                    toast.success('Program deleted.');
                                }}
                                onError={() => {
                                    toast.error(
                                        'Unable to delete this program.',
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
                                            Delete program
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
                        <div className="flex h-10 min-w-64 items-center gap-2 rounded-2xl border bg-background px-3 text-sm text-muted-foreground">
                            <Search className="size-4" />
                            <Input
                                value={searchQuery}
                                onChange={(event) => {
                                    setSearchQuery(event.target.value);
                                    setCurrentPage(1);
                                }}
                                placeholder="Search programs..."
                                className="h-auto border-0 bg-transparent px-0 py-0 shadow-none focus-visible:ring-0"
                            />
                        </div>
                    </CardHeader>
                    <CardContent>
                        {programs.length === 0 ? (
                            <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                                No programs added yet.
                            </div>
                        ) : filteredPrograms.length === 0 ? (
                            <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                                No programs match your search.
                            </div>
                        ) : (
                            <>
                                <div className="rounded-2xl border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
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
                                                    <TableCell className="font-medium">
                                                        {program.name}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline">
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
                                                            variant={
                                                                program.status ===
                                                                'active'
                                                                    ? 'default'
                                                                    : 'secondary'
                                                            }
                                                        >
                                                            {program.status}
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
                                                                        program
                                                                        actions
                                                                    </span>
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent
                                                                align="end"
                                                                className="w-40"
                                                            >
                                                                <DropdownMenuItem asChild>
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
                                        Showing {firstProgramIndex + 1}-
                                        {Math.min(
                                            firstProgramIndex +
                                                programsPerPage,
                                            filteredPrograms.length,
                                        )}{' '}
                                        of {filteredPrograms.length} programs
                                    </p>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground lg:justify-center">
                                        <span>Rows per page</span>
                                        <Select
                                            value={String(programsPerPage)}
                                            onValueChange={(value) => {
                                                setProgramsPerPage(
                                                    Number(value),
                                                );
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
