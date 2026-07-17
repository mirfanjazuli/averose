import { Form, Head } from '@inertiajs/react';
import { Clock3, Eye, LibraryBig, Pencil, PowerOff } from 'lucide-react';
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
                        icon={Clock3}
                        label="Active sessions"
                        value={activeSubjectsCount}
                    />
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
                                        {...getBadgeProps(
                                            viewingSubject.status === 'active'
                                                ? 'success'
                                                : 'muted',
                                            'mt-2',
                                        )}
                                    >
                                        {formatBadgeLabel(
                                            viewingSubject.status,
                                        )}
                                    </Badge>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

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

                <Card>
                    <CardHeader className="gap-4 md:flex-row md:items-center md:justify-between">
                        <CardTitle>Subject list</CardTitle>
                        <TableSearch
                            value={searchQuery}
                            onChange={(value) => {
                                setSearchQuery(value);
                                resetPage();
                            }}
                            placeholder="Search subjects..."
                        />
                    </CardHeader>
                    <CardContent>
                        {subjects.length === 0 ? (
                            <EmptyState>No subjects added yet.</EmptyState>
                        ) : filteredSubjects.length === 0 ? (
                            <EmptyState>
                                No subjects match your search.
                            </EmptyState>
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
                                                        <Badge
                                                            {...getBadgeProps(
                                                                'outline',
                                                            )}
                                                        >
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
                                                            {...getBadgeProps(
                                                                subject.status ===
                                                                    'active'
                                                                    ? 'success'
                                                                    : 'muted',
                                                            )}
                                                        >
                                                            {formatBadgeLabel(
                                                                subject.status,
                                                            )}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <ActionMenu label="Open subject actions">
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
                                    entity="subjects"
                                    firstItemIndex={firstItemIndex}
                                    onPageChange={goToPage}
                                    onRowsPerPageChange={changeRowsPerPage}
                                    rowsPerPage={rowsPerPage}
                                    safeCurrentPage={safeCurrentPage}
                                    totalItems={filteredSubjects.length}
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
