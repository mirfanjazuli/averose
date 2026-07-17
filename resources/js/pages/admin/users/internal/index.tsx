import { Form, Head } from '@inertiajs/react';
import {
    Pencil,
    PowerOff,
    ShieldCheck,
    UserRoundCheck,
    Users,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ActionMenu } from '@/components/admin/action-menu';
import {
    formatBadgeLabel,
    getBadgeProps,
    getStatusBadgeTone,
} from '@/lib/badge';
import { EmptyState } from '@/components/admin/empty-state';
import { SummaryCard } from '@/components/admin/summary-card';
import { TablePagination } from '@/components/admin/table-pagination';
import { TableSearch } from '@/components/admin/table-search';
import { Badge } from '@/components/ui/badge';
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

type RoleOption = {
    id: string;
    label: string;
};

type User = ManagedUser & {
    createdAt: string | null;
    id: number;
    internalRole: string | null;
    nickname: string;
    roleId: number | null;
    slug: string;
    status: string;
};

export default function InternalUsers({
    roleOptions,
    users,
}: {
    roleOptions: RoleOption[];
    users: User[];
}) {
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
            [
                user.name,
                user.nickname,
                user.email,
                user.internalRole ?? 'Super admin',
                user.status,
            ].some((value) => value.toLowerCase().includes(normalizedSearch)),
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
    const superAdminCount = users.filter((user) => user.roleId === null).length;
    const assignedRoleCount = users.length - superAdminCount;

    return (
        <>
            <Head title="Internal" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="font-heading text-2xl font-semibold">
                            Internal
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Manage internal users and role access.
                        </p>
                    </div>
                    <CreateDialogUser
                        open={addDialogOpen}
                        onOpenChange={setAddDialogOpen}
                        action="/users/internal"
                        idPrefix="internal"
                        roleOptions={roleOptions}
                        triggerLabel="Add internal"
                        title="Add internal user"
                        description="Create an internal user account."
                        submitLabel="Save internal user"
                        onSuccess={() => {
                            setAddDialogOpen(false);
                            toast.success('Internal user added.');
                        }}
                        onError={() =>
                            toast.error('Please check the internal user form.')
                        }
                    />
                </div>

                <UpdateDialogUser
                    open={!!editingUser}
                    onOpenChange={(open) => !open && setEditingUser(null)}
                    user={editingUser}
                    idPrefix="edit-internal"
                    roleOptions={roleOptions}
                    title="Edit internal user"
                    description="Update internal user details and role."
                    onSuccess={() => {
                        setEditingUser(null);
                        toast.success('Internal user updated.');
                    }}
                    onError={() =>
                        toast.error('Please check the internal user form.')
                    }
                />

                <AlertDialog
                    open={!!deletingUser}
                    onOpenChange={(open) => !open && setDeletingUser(null)}
                >
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>
                                Deactivate internal user?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                                This deactivates {deletingUser?.name} from
                                internal access.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            {deletingUser && (
                                <Form
                                    action={`/users/${deletingUser.slug}`}
                                    method="delete"
                                    onSuccess={() => {
                                        setDeletingUser(null);
                                        toast.success(
                                            'Internal user deactivated.',
                                        );
                                    }}
                                    onError={() =>
                                        toast.error(
                                            'Internal user could not be deactivated.',
                                        )
                                    }
                                >
                                    {({ processing }) => (
                                        <Button
                                            type="submit"
                                            variant="destructive"
                                            disabled={processing}
                                        >
                                            Deactivate
                                        </Button>
                                    )}
                                </Form>
                            )}
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                <div className="grid gap-4 md:grid-cols-3">
                    <SummaryCard
                        icon={Users}
                        label="Total internal"
                        value={users.length}
                    />
                    <SummaryCard
                        icon={ShieldCheck}
                        label="Super admins"
                        value={superAdminCount}
                    />
                    <SummaryCard
                        icon={UserRoundCheck}
                        label="Assigned roles"
                        value={assignedRoleCount}
                    />
                </div>

                <Card>
                    <CardHeader className="gap-4 md:flex-row md:items-center md:justify-between">
                        <CardTitle>Internal users</CardTitle>
                        <TableSearch
                            value={searchQuery}
                            onChange={(value) => {
                                setSearchQuery(value);
                                resetPage();
                            }}
                            placeholder="Search internal users..."
                        />
                    </CardHeader>
                    <CardContent>
                        {users.length === 0 ? (
                            <EmptyState>
                                No internal users added yet.
                            </EmptyState>
                        ) : filteredUsers.length === 0 ? (
                            <EmptyState>
                                No internal users match your search.
                            </EmptyState>
                        ) : (
                            <>
                                <div className="rounded-2xl border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Name</TableHead>
                                                <TableHead>Email</TableHead>
                                                <TableHead>Role</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Created</TableHead>
                                                <TableHead className="w-12 text-right" />
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {visibleUsers.map((user) => (
                                                <TableRow key={user.id}>
                                                    <TableCell>
                                                        <p className="font-medium">
                                                            {user.name}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {user.nickname}
                                                        </p>
                                                    </TableCell>
                                                    <TableCell>
                                                        {user.email}
                                                    </TableCell>
                                                    <TableCell>
                                                        {user.internalRole ??
                                                            'Super admin'}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            {...getBadgeProps(
                                                                getStatusBadgeTone(
                                                                    user.status,
                                                                ),
                                                            )}
                                                        >
                                                            {formatBadgeLabel(
                                                                user.status,
                                                            )}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        {user.createdAt ?? '-'}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <ActionMenu label="Open internal user actions">
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
                                    entity="internal users"
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
