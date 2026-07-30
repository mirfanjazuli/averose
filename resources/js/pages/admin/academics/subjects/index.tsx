import { Form, Head } from '@inertiajs/react';
import { CheckCircle2, LibraryBig, Pencil, PowerOff } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { getBadgeProps } from '@/lib/badge';
import { CreateDialogSubject } from '@/pages/admin/academics/subjects/components/create-dialog-subject';
import { UpdateDialogSubject } from '@/pages/admin/academics/subjects/components/update-dialog-subject';

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
    const {
        changeRowsPerPage,
        firstItemIndex,
        goToPage,
        resetPage,
        rowsPerPage,
        safeCurrentPage,
        totalPages,
        visibleItems: visibleSubjects,
    } = useClientPagination({ items: filteredSubjects });

    return (
        <>
            <Head title="Subjects" />
            <div className="flex min-h-full min-w-0 max-w-full flex-1 flex-col gap-6 p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="font-heading text-2xl font-semibold">
                            Subjects
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Manage subject modules inside each learning program.
                        </p>
                    </div>
                    <CreateDialogSubject
                        open={addSubjectDialogOpen}
                        onOpenChange={setAddSubjectDialogOpen}
                        onSuccess={() => {
                            setAddSubjectDialogOpen(false);
                            toast.success('Subject added.');
                        }}
                        onError={() => {
                            toast.error('Please check the subject form.');
                        }}
                    />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <SummaryCard
                        icon={LibraryBig}
                        label="Total subjects"
                        value={subjects.length}
                    />
                    <SummaryCard
                        icon={CheckCircle2}
                        label="Active subjects"
                        value={activeSubjectsCount}
                    />
                </div>

                <UpdateDialogSubject
                    open={!!editingSubject}
                    onOpenChange={(open) => {
                        if (!open) {
                            setEditingSubject(null);
                        }
                    }}
                    subject={
                        editingSubject
                            ? {
                                  ...editingSubject,
                                  description:
                                      editingSubject.description ?? undefined,
                                  icon:
                                      (editingSubject.icon as never) ??
                                      undefined,
                              }
                            : null
                    }
                    onSuccess={() => {
                        setEditingSubject(null);
                        toast.success('Subject updated.');
                    }}
                    onError={() => {
                        toast.error('Please check the subject form.');
                    }}
                />

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
                                Deactivate subject?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                                This will deactivate {deletingSubject?.name}{' '}
                                from the subject list.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        {deletingSubject && (
                            <Form
                                action={`/academics/subjects/${deletingSubject.slug}`}
                                method="delete"
                                disableWhileProcessing
                                onSuccess={() => {
                                    setDeletingSubject(null);
                                    toast.success('Subject deactivated.');
                                }}
                                onError={() => {
                                    toast.error(
                                        'Unable to deactivate this subject.',
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
                                            Deactivate subject
                                        </Button>
                                    </AlertDialogFooter>
                                )}
                            </Form>
                        )}
                    </AlertDialogContent>
                </AlertDialog>

                <AdminTableSection
                    emptyMessage="No subjects added yet."
                    emptySearchMessage="No subjects match your search."
                    filteredItems={filteredSubjects.length}
                    pagination={{
                        entity: 'subjects',
                        firstItemIndex,
                        onPageChange: goToPage,
                        onRowsPerPageChange: changeRowsPerPage,
                        rowsPerPage,
                        safeCurrentPage,
                        totalItems: filteredSubjects.length,
                        totalPages,
                    }}
                    search={{
                        value: searchQuery,
                        onChange: (value) => {
                            setSearchQuery(value);
                            resetPage();
                        },
                        placeholder: 'Search subjects...',
                    }}
                    totalItems={subjects.length}
                >
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Programs</TableHead>
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
                                        <Badge {...getBadgeProps('outline')}>
                                            {subject.programsCount} programs
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <StatusBadge status={subject.status} />
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <ActionMenu label="Open subject actions">
                                            <DropdownMenuItem
                                                onClick={() =>
                                                    setEditingSubject(subject)
                                                }
                                            >
                                                <Pencil className="size-4" />
                                                Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                variant="destructive"
                                                onClick={() =>
                                                    setDeletingSubject(subject)
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
