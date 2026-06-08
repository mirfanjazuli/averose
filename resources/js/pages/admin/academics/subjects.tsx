import { Form, Head } from '@inertiajs/react';
import {
    Clock3,
    Eye,
    LibraryBig,
    MoreVertical,
    Pencil,
    Plus,
    Search,
    Trash2,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { AcademicSubjectForm } from '@/components/academic-subject-form';
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

type Subject = {
    description?: string | null;
    icon?: string | null;
    id: number;
    name: string;
    programsCount: number;
    slug: string;
    status: string;
};

export default function Subjects({ subjects }: { subjects: Subject[] }) {
    const [addSubjectDialogOpen, setAddSubjectDialogOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [subjectsPerPage, setSubjectsPerPage] = useState(5);
    const [viewingSubject, setViewingSubject] = useState<Subject | null>(null);
    const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
    const [deletingSubject, setDeletingSubject] = useState<Subject | null>(
        null,
    );
    const activeSubjectsCount = subjects.filter(
        (subject) => subject.status === 'active',
    ).length;
    const filteredSubjects = useMemo(() => {
        const normalizedSearch = searchQuery.trim().toLowerCase();

        if (!normalizedSearch) {
            return subjects;
        }

        return subjects.filter((subject) =>
            [subject.name, subject.status].some((value) =>
                value.toLowerCase().includes(normalizedSearch),
            ),
        );
    }, [subjects, searchQuery]);
    const totalPages = Math.max(
        1,
        Math.ceil(filteredSubjects.length / subjectsPerPage),
    );
    const safeCurrentPage = Math.min(currentPage, totalPages);
    const firstSubjectIndex = (safeCurrentPage - 1) * subjectsPerPage;
    const visibleSubjects = filteredSubjects.slice(
        firstSubjectIndex,
        firstSubjectIndex + subjectsPerPage,
    );

    const goToPage = (page: number) => {
        setCurrentPage(Math.min(Math.max(page, 1), totalPages));
    };

    return (
        <>
            <Head title="Subjects" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="font-heading text-2xl font-semibold">
                            Subjects
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Manage subject modules inside each learning program.
                        </p>
                    </div>
                    <Dialog
                        open={addSubjectDialogOpen}
                        onOpenChange={setAddSubjectDialogOpen}
                    >
                        <DialogTrigger asChild>
                            <Button className="gap-2">
                                <Plus className="size-4" />
                                Add subject
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add subject</DialogTitle>
                                <DialogDescription>
                                    Create a subject module and assign its
                                    display icon.
                                </DialogDescription>
                            </DialogHeader>
                            <AcademicSubjectForm
                                action="/academics/subjects"
                                idPrefix="subject"
                                resetOnSuccess
                                onSuccess={() => {
                                    setAddSubjectDialogOpen(false);
                                    toast.success('Subject added.');
                                }}
                                onError={() => {
                                    toast.error(
                                        'Please check the subject form.',
                                    );
                                }}
                                submitLabel="Save subject"
                            />
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                        <CardContent className="flex items-center gap-4 px-6 py-5">
                            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                <LibraryBig className="size-5" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Total subjects
                                </p>
                                <p className="text-2xl font-semibold">
                                    {subjects.length}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="flex items-center gap-4 px-6 py-5">
                            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                <Clock3 className="size-5" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Active sessions
                                </p>
                                <p className="text-2xl font-semibold">
                                    {activeSubjectsCount}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Dialog
                    open={!!viewingSubject}
                    onOpenChange={(open) => {
                        if (!open) {
                            setViewingSubject(null);
                        }
                    }}
                >
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{viewingSubject?.name}</DialogTitle>
                            <DialogDescription>
                                Subject detail and current program usage.
                            </DialogDescription>
                        </DialogHeader>
                        {viewingSubject && (
                            <div className="grid gap-4 text-sm">
                                <div>
                                    <p className="text-muted-foreground">
                                        Description
                                    </p>
                                    <p className="mt-1">
                                        {viewingSubject.description ||
                                            'No description.'}
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="rounded-2xl border p-4">
                                        <p className="text-muted-foreground">
                                            Programs
                                        </p>
                                        <p className="mt-1 text-lg font-semibold">
                                            {viewingSubject.programsCount}
                                        </p>
                                    </div>
                                    <div className="rounded-2xl border p-4">
                                        <p className="text-muted-foreground">
                                            Icon
                                        </p>
                                        <p className="mt-1 text-lg font-semibold">
                                            {viewingSubject.icon || '-'}
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
                                            viewingSubject.status === 'active'
                                                ? 'default'
                                                : 'secondary'
                                        }
                                    >
                                        {viewingSubject.status}
                                    </Badge>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                <Dialog
                    open={!!editingSubject}
                    onOpenChange={(open) => {
                        if (!open) {
                            setEditingSubject(null);
                        }
                    }}
                >
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Edit subject</DialogTitle>
                            <DialogDescription>
                                Update this subject module.
                            </DialogDescription>
                        </DialogHeader>
                        {editingSubject && (
                            <AcademicSubjectForm
                                key={editingSubject.id}
                                action={`/academics/subjects/${editingSubject.slug}`}
                                idPrefix="edit-subject"
                                method="put"
                                onSuccess={() => {
                                    setEditingSubject(null);
                                    toast.success('Subject updated.');
                                }}
                                onError={() => {
                                    toast.error(
                                        'Please check the subject form.',
                                    );
                                }}
                                subject={{
                                    description:
                                        editingSubject.description ?? undefined,
                                    icon:
                                        (editingSubject.icon as never) ??
                                        undefined,
                                    name: editingSubject.name,
                                }}
                                submitLabel="Save changes"
                            />
                        )}
                    </DialogContent>
                </Dialog>

                <AlertDialog
                    open={!!deletingSubject}
                    onOpenChange={(open) => {
                        if (!open) {
                            setDeletingSubject(null);
                        }
                    }}
                >
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>
                                Delete subject?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                                This will remove {deletingSubject?.name} from
                                the subject list.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        {deletingSubject && (
                            <Form
                                action={`/academics/subjects/${deletingSubject.slug}`}
                                method="delete"
                                disableWhileProcessing
                                onSuccess={() => {
                                    setDeletingSubject(null);
                                    toast.success('Subject deleted.');
                                }}
                                onError={() => {
                                    toast.error(
                                        'Unable to delete this subject.',
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
                                            Delete subject
                                        </Button>
                                    </AlertDialogFooter>
                                )}
                            </Form>
                        )}
                    </AlertDialogContent>
                </AlertDialog>

                <Card>
                    <CardHeader className="gap-4 md:flex-row md:items-center md:justify-between">
                        <CardTitle>Subject list</CardTitle>
                        <div className="flex h-10 min-w-64 items-center gap-2 rounded-2xl border bg-background px-3 text-sm text-muted-foreground">
                            <Search className="size-4" />
                            <Input
                                value={searchQuery}
                                onChange={(event) => {
                                    setSearchQuery(event.target.value);
                                    setCurrentPage(1);
                                }}
                                placeholder="Search subjects..."
                                className="h-auto border-0 bg-transparent px-0 py-0 shadow-none focus-visible:ring-0"
                            />
                        </div>
                    </CardHeader>
                    <CardContent>
                        {subjects.length === 0 ? (
                            <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                                No subjects added yet.
                            </div>
                        ) : filteredSubjects.length === 0 ? (
                            <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                                No subjects match your search.
                            </div>
                        ) : (
                            <>
                                <div className="rounded-2xl border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Name</TableHead>
                                                <TableHead>Programs</TableHead>
                                                <TableHead>Sessions</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="w-12 text-right" />
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {visibleSubjects.map((subject) => (
                                                <TableRow key={subject.id}>
                                                    <TableCell className="font-medium">
                                                        {subject.name}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline">
                                                            {
                                                                subject.programsCount
                                                            }{' '}
                                                            programs
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground">
                                                        Not scheduled
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            variant={
                                                                subject.status ===
                                                                'active'
                                                                    ? 'default'
                                                                    : 'secondary'
                                                            }
                                                        >
                                                            {subject.status}
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
                                                                        subject
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
                                                                        setViewingSubject(
                                                                            subject,
                                                                        )
                                                                    }
                                                                >
                                                                    <Eye className="size-4" />
                                                                    View
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    onClick={() =>
                                                                        setEditingSubject(
                                                                            subject,
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
                                                                        setDeletingSubject(
                                                                            subject,
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
                                        Showing {firstSubjectIndex + 1}-
                                        {Math.min(
                                            firstSubjectIndex +
                                                subjectsPerPage,
                                            filteredSubjects.length,
                                        )}{' '}
                                        of {filteredSubjects.length} subjects
                                    </p>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground lg:justify-center">
                                        <span>Rows per page</span>
                                        <Select
                                            value={String(subjectsPerPage)}
                                            onValueChange={(value) => {
                                                setSubjectsPerPage(
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

Subjects.layout = {
    breadcrumbs: [
        {
            title: 'Academics',
            href: '/academics/fields',
        },
        {
            title: 'Subjects',
            href: '/academics/subjects',
        },
    ],
};
