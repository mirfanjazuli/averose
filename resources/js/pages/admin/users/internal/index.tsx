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
import { useUserTimezone } from '@/hooks/use-user-timezone';
import {
    formatBadgeLabel,
    getBadgeProps,
    getStatusBadgeTone,
} from '@/lib/badge';
import { formatDate } from '@/lib/date-time';
import { CreateDialogInternal } from '@/pages/admin/users/internal/components/create-dialog-internal';
import type {
    InternalFormUser,
    InternalRoleOption,
} from '@/pages/admin/users/internal/components/form-internal';
import { UpdateDialogInternal } from '@/pages/admin/users/internal/components/update-dialog-internal';

type User = InternalFormUser & {
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
    roleOptions: InternalRoleOption[];
    users: User[];
}) {
    const timezone = useUserTimezone();
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
            [
                user.name,
                user.nickname,
                user.email,
                user.internalRole ?? 'Super admin',
                user.status,
            ].some((value) => value.toLowerCase().includes(normalizedSearch)),
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
    const superAdminCount = users.filter((user) => user.roleId === null).length;
    const assignedRoleCount = users.length - superAdminCount;

    return (
        <>
            <Head title="Internal" />
            <div className="flex min-h-full min-w-0 max-w-full flex-1 flex-col gap-6 p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="font-heading text-2xl font-semibold">
                            Internal
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Manage internal users and role access.
                        </p>
                    </div>
                    <CreateDialogInternal
                        open={addDialogOpen}
                        onOpenChange={setAddDialogOpen}
                        roleOptions={roleOptions}
                        onSuccess={() => {
                            setAddDialogOpen(false);
                            toast.success('Internal user added.');
                        }}
                        onError={() =>
                            toast.error('Please check the internal user form.')
                        }
                    />
                </div>

                <UpdateDialogInternal
                    open={!!editingUser}
                    onOpenChange={(open) => !open && setEditingUser(null)}
                    user={editingUser}
                    roleOptions={roleOptions}
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

                <AdminTableSection
                    emptyMessage="No internal users added yet."
                    emptySearchMessage="No internal users match your search."
                    filteredItems={filteredUsers.length}
                    pagination={{
                        entity: 'internal users',
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
                        placeholder: 'Search internal users...',
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
                                    </TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>
                                        {user.internalRole ?? 'Super admin'}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            {...getBadgeProps(
                                                getStatusBadgeTone(user.status),
                                            )}
                                        >
                                            {formatBadgeLabel(user.status)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {user.createdAt
                                            ? formatDate(user.createdAt, timezone)
                                            : '-'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <ActionMenu label="Open internal user actions">
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
