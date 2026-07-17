import { Form, Head, Link } from '@inertiajs/react';
import { Eye, Pencil, PowerOff, UserCheck, UsersRound } from 'lucide-react';
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
import { CreateDialogUser } from '@/pages/admin/users/components/create-dialog-user';
import type { ManagedUser } from '@/pages/admin/users/components/form-user';
import { UpdateDialogUser } from '@/pages/admin/users/components/update-dialog-user';

type User = ManagedUser & {
    createdAt: string | null;
    id: number;
    slug: string;
    status: string;
    nickname: string;
};

export default function Students({ users }: { users: User[] }) {
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [deletingUser, setDeletingUser] = useState<User | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredUsers = useMemo(() => {
        const normalizedSearch = searchQuery.trim().toLowerCase();

        if (!normalizedSearch) {
            return users;
        }

        return users.filter((user) =>
            [user.name, user.nickname, user.email, user.status].some((value) =>
                value.toLowerCase().includes(normalizedSearch),
            ),
        );
    }, [users, searchQuery]);
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
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="font-heading text-2xl font-semibold">
                            Students
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Manage student accounts and access.
                        </p>
                    </div>
                    <CreateDialogUser
                        open={addDialogOpen}
                        onOpenChange={setAddDialogOpen}
                        action="/users/students"
                        idPrefix="student"
                        triggerLabel="Add student"
                        title="Add student"
                        description="Create a student account with default access."
                        submitLabel="Save student"
                        onSuccess={() => {
                            setAddDialogOpen(false);
                            toast.success('Student added.');
                        }}
                        onError={() =>
                            toast.error('Please check the student form.')
                        }
                    />
                </div>

                <UpdateDialogUser
                    open={!!editingUser}
                    onOpenChange={(open) => !open && setEditingUser(null)}
                    user={editingUser}
                    idPrefix="edit-student"
                    title="Edit student"
                    description="Update student account details."
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

                <Card>
                    <CardHeader className="gap-4 md:flex-row md:items-center md:justify-between">
                        <CardTitle>Student list</CardTitle>
                        <TableSearch
                            value={searchQuery}
                            onChange={(value) => {
                                setSearchQuery(value);
                                resetPage();
                            }}
                            placeholder="Search students..."
                        />
                    </CardHeader>
                    <CardContent>
                        {users.length === 0 ? (
                            <EmptyState>No students added yet.</EmptyState>
                        ) : filteredUsers.length === 0 ? (
                            <EmptyState>
                                No students match your search.
                            </EmptyState>
                        ) : (
                            <>
                                <div className="rounded-2xl border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Name</TableHead>
                                                <TableHead>Nickname</TableHead>
                                                <TableHead>Email</TableHead>
                                                <TableHead>Created</TableHead>
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
                                                    <TableCell>
                                                        {user.nickname}
                                                    </TableCell>
                                                    <TableCell>
                                                        {user.email}
                                                    </TableCell>
                                                    <TableCell>
                                                        {user.createdAt}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            {...getBadgeProps(
                                                                user.status ===
                                                                    'active'
                                                                    ? 'success'
                                                                    : 'muted',
                                                            )}
                                                        >
                                                            {formatBadgeLabel(
                                                                user.status,
                                                            )}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <ActionMenu label="Open student actions">
                                                            <DropdownMenuItem
                                                                asChild
                                                            >
                                                                <Link
                                                                    href={`/users/students/${user.slug}`}
                                                                >
                                                                    <Eye className="size-4" />
                                                                    View
                                                                </Link>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() =>
                                                                    setEditingUser(
                                                                        user,
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
                                                                    setDeletingUser(
                                                                        user,
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
                                    entity="students"
                                    firstItemIndex={firstItemIndex}
                                    onPageChange={goToPage}
                                    onRowsPerPageChange={changeRowsPerPage}
                                    rowsPerPage={rowsPerPage}
                                    safeCurrentPage={safeCurrentPage}
                                    totalItems={filteredUsers.length}
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

Students.layout = {
    breadcrumbs: [
        { title: 'Users', href: '/users/students' },
        { title: 'Students', href: '/users/students' },
    ],
};
