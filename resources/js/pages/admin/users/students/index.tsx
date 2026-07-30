import { Form, Head, Link } from '@inertiajs/react';
import { Eye, Pencil, PowerOff, UserCheck, UsersRound } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ActionMenu } from '@/components/admin/action-menu';
import { AdminStatusFilter } from '@/components/admin/status-filter';
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
import { formatBadgeLabel, getBadgeProps } from '@/lib/badge';
import { CreateDialogStudent } from '@/pages/admin/users/students/components/create-dialog-student';
import type { StudentFormUser } from '@/pages/admin/users/students/components/form-student';
import { UpdateDialogStudent } from '@/pages/admin/users/students/components/update-dialog-student';

type User = StudentFormUser & {
    createdAt: string | null;
    id: number;
    slug: string;
    status: string;
    nickname: string;
};

export default function Students({
    users,
}: {
    users: User[];
}) {
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [deletingUser, setDeletingUser] = useState<User | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const filteredUsers = useMemo(() => {
        const normalizedSearch = searchQuery.trim().toLowerCase();
        const filteredByStatus =
            statusFilter === 'all'
                ? users
                : users.filter((user) => user.status === statusFilter);

        if (!normalizedSearch) {
            return filteredByStatus;
        }

        return filteredByStatus.filter((user) =>
            [user.name, user.nickname, user.email, user.status].some((value) =>
                value.toLowerCase().includes(normalizedSearch),
            ),
        );
    }, [users, searchQuery, statusFilter]);
    const {
        changeRowsPerPage,
        firstItemIndex,
        goToPage,
        resetPage,
        rowsPerPage,
        safeCurrentPage,
        totalPages,
        visibleItems: visibleUsers,
    } = useClientPagination({ items: filteredUsers });
    const activeStudentsCount = users.filter(
        (user) => user.status === 'active',
    ).length;

    return (
        <>
            <Head title="Students" />
            <div className="flex min-h-full min-w-0 max-w-full flex-1 flex-col gap-6 p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="font-heading text-2xl font-semibold">
                            Students
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Manage student accounts and access.
                        </p>
                    </div>
                    <CreateDialogStudent
                        open={addDialogOpen}
                        onOpenChange={setAddDialogOpen}
                        onSuccess={() => {
                            setAddDialogOpen(false);
                        }}
                        onError={() =>
                            toast.error('Please check the student form.')
                        }
                    />
                </div>

                <UpdateDialogStudent
                    open={!!editingUser}
                    onOpenChange={(open) => !open && setEditingUser(null)}
                    user={editingUser}
                    onSuccess={() => {
                        setEditingUser(null);
                        toast.success('Student updated.');
                    }}
                    onError={() =>
                        toast.error('Please check the student form.')
                    }
                />

                <AlertDialog
                    open={!!deletingUser}
                    onOpenChange={(open) => !open && setDeletingUser(null)}
                >
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>
                                Deactivate student?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                                This will deactivate {deletingUser?.name} from
                                student accounts.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        {deletingUser && (
                            <Form
                                action={`/users/${deletingUser.slug}`}
                                method="delete"
                                disableWhileProcessing
                                onSuccess={() => {
                                    setDeletingUser(null);
                                    toast.success('Student deactivated.');
                                }}
                                onError={() =>
                                    toast.error(
                                        'Unable to deactivate this student.',
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
                                            Deactivate student
                                        </Button>
                                    </AlertDialogFooter>
                                )}
                            </Form>
                        )}
                    </AlertDialogContent>
                </AlertDialog>

                <div className="grid gap-4 md:grid-cols-2">
                    <SummaryCard
                        icon={UsersRound}
                        label="Total students"
                        value={users.length}
                    />
                    <SummaryCard
                        icon={UserCheck}
                        label="Active students"
                        value={activeStudentsCount}
                    />
                </div>

                <AdminTableSection
                    emptyMessage="No students added yet."
                    emptySearchMessage="No students match your search."
                    filteredItems={filteredUsers.length}
                    pagination={{
                        entity: 'students',
                        firstItemIndex,
                        onPageChange: goToPage,
                        onRowsPerPageChange: changeRowsPerPage,
                        rowsPerPage,
                        safeCurrentPage,
                        totalItems: filteredUsers.length,
                        totalPages,
                    }}
                    search={{
                        value: searchQuery,
                        onChange: (value) => {
                            setSearchQuery(value);
                            resetPage();
                        },
                        placeholder: 'Search students...',
                    }}
                    toolbarEnd={
                        <AdminStatusFilter
                            value={statusFilter}
                            widthClassName="w-40"
                            options={[
                                { label: 'All statuses', value: 'all' },
                                { label: 'Active', value: 'active' },
                                { label: 'Inactive', value: 'inactive' },
                            ]}
                            onValueChange={(value) => {
                                setStatusFilter(value);
                                resetPage();
                            }}
                        />
                    }
                    totalItems={users.length}
                >
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Nickname</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Joined</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="w-12 text-right" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {visibleUsers.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">
                                        {user.name}
                                    </TableCell>
                                    <TableCell>{user.nickname}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>{user.createdAt}</TableCell>
                                    <TableCell>
                                        <Badge
                                            {...getBadgeProps(
                                                user.status === 'active'
                                                    ? 'success'
                                                    : 'muted',
                                            )}
                                        >
                                            {formatBadgeLabel(user.status)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <ActionMenu label="Open student actions">
                                            <DropdownMenuItem asChild>
                                                <Link
                                                    href={`/users/students/${user.slug}`}
                                                >
                                                    <Eye className="size-4" />
                                                    View
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() =>
                                                    setEditingUser(user)
                                                }
                                            >
                                                <Pencil className="size-4" />
                                                Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                variant="destructive"
                                                onClick={() =>
                                                    setDeletingUser(user)
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

Students.layout = {
    breadcrumbs: [
        { title: 'Users', href: '/users/students' },
        { title: 'Students', href: '/users/students' },
    ],
};
