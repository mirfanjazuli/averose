import { Form, Head } from '@inertiajs/react';
import {
    KeyRound,
    Pencil,
    PowerOff,
    Plus,
    ShieldCheck,
    Users,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ActionMenu } from '@/components/admin/action-menu';
import { formatBadgeLabel, getBadgeProps } from '@/lib/badge';
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
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    DropdownMenuItem,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Textarea } from '@/components/ui/textarea';
import { useClientPagination } from '@/hooks/use-client-pagination';

type Permission = {
    description: string;
    key: string;
    label: string;
};

type Role = {
    description: string | null;
    id: number;
    isSystem: boolean;
    name: string;
    permissions: string[];
    slug: string;
    status: string;
    usersCount: number;
};

type RoleFormProps = {
    action: string;
    method: 'post' | 'put';
    onSuccess: () => void;
    permissionGroups: Record<string, Permission[]>;
    role?: Role;
    submitLabel: string;
};

function RoleForm({
    action,
    method,
    onSuccess,
    permissionGroups,
    role,
    submitLabel,
}: RoleFormProps) {
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>(
        role?.permissions ?? [],
    );

    const togglePermission = (permission: string) => {
        setSelectedPermissions((current) =>
            current.includes(permission)
                ? current.filter((item) => item !== permission)
                : [...current, permission],
        );
    };

    const toggleGroup = (permissions: Permission[]) => {
        const keys = permissions.map((permission) => permission.key);
        const allSelected = keys.every((key) =>
            selectedPermissions.includes(key),
        );

        setSelectedPermissions((current) =>
            allSelected
                ? current.filter((item) => !keys.includes(item))
                : Array.from(new Set([...current, ...keys])),
        );
    };

    return (
        <Form
            action={action}
            method={method}
            disableWhileProcessing
            onSuccess={onSuccess}
            onError={() => toast.error('Please check the role form.')}
            className="grid gap-5"
        >
            {({ errors, processing }) => (
                <>
                    {selectedPermissions.map((permission) => (
                        <input
                            key={permission}
                            type="hidden"
                            name="permissions[]"
                            value={permission}
                        />
                    ))}
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor="role-name">Name</Label>
                            <Input
                                id="role-name"
                                name="name"
                                defaultValue={role?.name}
                                placeholder="Academic Admin"
                                aria-invalid={!!errors.name}
                            />
                            {errors.name && (
                                <p className="text-sm text-destructive">
                                    {errors.name}
                                </p>
                            )}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="role-status">Status</Label>
                            <Select
                                name="status"
                                defaultValue={role?.status ?? 'active'}
                            >
                                <SelectTrigger
                                    id="role-status"
                                    className="w-full"
                                >
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">
                                        Active
                                    </SelectItem>
                                    <SelectItem value="inactive">
                                        Inactive
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="role-description">Description</Label>
                        <Textarea
                            id="role-description"
                            name="description"
                            defaultValue={role?.description ?? ''}
                            placeholder="Short role description"
                        />
                    </div>
                    <div className="grid gap-3">
                        {Object.entries(permissionGroups).map(
                            ([group, permissions]) => {
                                const allSelected = permissions.every(
                                    (permission) =>
                                        selectedPermissions.includes(
                                            permission.key,
                                        ),
                                );

                                return (
                                    <div
                                        key={group}
                                        className="rounded-lg border p-4"
                                    >
                                        <div className="mb-3 flex items-center justify-between gap-3">
                                            <div>
                                                <p className="font-medium">
                                                    {group}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {permissions.length}{' '}
                                                    permissions
                                                </p>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    toggleGroup(permissions)
                                                }
                                            >
                                                {allSelected
                                                    ? 'Clear group'
                                                    : 'Select group'}
                                            </Button>
                                        </div>
                                        <div className="grid gap-3 md:grid-cols-2">
                                            {permissions.map((permission) => (
                                                <label
                                                    key={permission.key}
                                                    className="flex items-start gap-3 rounded-md border p-3"
                                                >
                                                    <Checkbox
                                                        checked={selectedPermissions.includes(
                                                            permission.key,
                                                        )}
                                                        onCheckedChange={() =>
                                                            togglePermission(
                                                                permission.key,
                                                            )
                                                        }
                                                    />
                                                    <span>
                                                        <span className="block text-sm font-medium">
                                                            {permission.label}
                                                        </span>
                                                        <span className="block text-xs text-muted-foreground">
                                                            {
                                                                permission.description
                                                            }
                                                        </span>
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                );
                            },
                        )}
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={processing}>
                            {submitLabel}
                        </Button>
                    </DialogFooter>
                </>
            )}
        </Form>
    );
}

export default function Roles({
    permissionGroups,
    roles,
}: {
    permissionGroups: Record<string, Permission[]>;
    roles: Role[];
}) {
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | null>(null);
    const [deletingRole, setDeletingRole] = useState<Role | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredRoles = useMemo(() => {
        const normalizedSearch = searchQuery.trim().toLowerCase();

        if (!normalizedSearch) {
            return roles;
        }

        return roles.filter((role) =>
            [role.name, role.description ?? '', role.status].some((value) =>
                value.toLowerCase().includes(normalizedSearch),
            ),
        );
    }, [roles, searchQuery]);
    const {
        changeRowsPerPage,
        firstItemIndex,
        goToPage,
        resetPage,
        rowsPerPage,
        safeCurrentPage,
        totalPages,
        visibleItems: visibleRoles,
    } = useClientPagination({ items: filteredRoles });
    const activeRoles = roles.filter((role) => role.status === 'active').length;
    const assignedUsers = roles.reduce(
        (total, role) => total + role.usersCount,
        0,
    );

    return (
        <>
            <Head title="Roles & Permissions" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="font-heading text-2xl font-semibold">
                            Roles & Permissions
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Configure internal role access.
                        </p>
                    </div>
                    <Dialog
                        open={addDialogOpen}
                        onOpenChange={setAddDialogOpen}
                    >
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="size-4" />
                                Create role
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
                            <DialogHeader>
                                <DialogTitle>Create role</DialogTitle>
                                <DialogDescription>
                                    Select the permissions for this internal
                                    role.
                                </DialogDescription>
                            </DialogHeader>
                            <RoleForm
                                action="/users/roles"
                                method="post"
                                permissionGroups={permissionGroups}
                                submitLabel="Save role"
                                onSuccess={() => {
                                    setAddDialogOpen(false);
                                    toast.success('Role created.');
                                }}
                            />
                        </DialogContent>
                    </Dialog>
                </div>

                <Dialog
                    open={!!editingRole}
                    onOpenChange={(open) => !open && setEditingRole(null)}
                >
                    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
                        <DialogHeader>
                            <DialogTitle>Edit role</DialogTitle>
                            <DialogDescription>
                                Update permissions for this internal role.
                            </DialogDescription>
                        </DialogHeader>
                        {editingRole && (
                            <RoleForm
                                key={editingRole.id}
                                action={`/users/roles/${editingRole.slug}`}
                                method="put"
                                role={editingRole}
                                permissionGroups={permissionGroups}
                                submitLabel="Save changes"
                                onSuccess={() => {
                                    setEditingRole(null);
                                    toast.success('Role updated.');
                                }}
                            />
                        )}
                    </DialogContent>
                </Dialog>

                <AlertDialog
                    open={!!deletingRole}
                    onOpenChange={(open) => !open && setDeletingRole(null)}
                >
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>
                                Deactivate role?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                                This deactivates {deletingRole?.name}. Assigned
                                users will become super admins until another
                                role is set.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            {deletingRole && (
                                <Form
                                    action={`/users/roles/${deletingRole.slug}`}
                                    method="delete"
                                    onSuccess={() => {
                                        setDeletingRole(null);
                                        toast.success('Role deactivated.');
                                    }}
                                    onError={() =>
                                        toast.error(
                                            'Role could not be deactivated.',
                                        )
                                    }
                                >
                                    {({ processing }) => (
                                        <Button
                                            type="submit"
                                            variant="destructive"
                                            disabled={
                                                processing ||
                                                deletingRole.isSystem
                                            }
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
                        icon={ShieldCheck}
                        label="Total roles"
                        value={roles.length}
                    />
                    <SummaryCard
                        icon={KeyRound}
                        label="Active roles"
                        value={activeRoles}
                    />
                    <SummaryCard
                        icon={Users}
                        label="Assigned users"
                        value={assignedUsers}
                    />
                </div>

                <Card>
                    <CardHeader className="gap-4 md:flex-row md:items-center md:justify-between">
                        <CardTitle>Internal roles</CardTitle>
                        <TableSearch
                            value={searchQuery}
                            onChange={(value) => {
                                setSearchQuery(value);
                                resetPage();
                            }}
                            placeholder="Search roles..."
                        />
                    </CardHeader>
                    <CardContent>
                        {roles.length === 0 ? (
                            <EmptyState>No roles added yet.</EmptyState>
                        ) : filteredRoles.length === 0 ? (
                            <EmptyState>No roles match your search.</EmptyState>
                        ) : (
                            <>
                                <div className="rounded-2xl border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Role</TableHead>
                                                <TableHead>
                                                    Permissions
                                                </TableHead>
                                                <TableHead>Users</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="w-12 text-right" />
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {visibleRoles.map((role) => (
                                                <TableRow key={role.id}>
                                                    <TableCell>
                                                        <p className="font-medium">
                                                            {role.name}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {role.description ??
                                                                '-'}
                                                        </p>
                                                    </TableCell>
                                                    <TableCell>
                                                        {
                                                            role.permissions
                                                                .length
                                                        }
                                                    </TableCell>
                                                    <TableCell>
                                                        {role.usersCount}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            {...getBadgeProps(
                                                                'outline',
                                                            )}
                                                        >
                                                            {formatBadgeLabel(
                                                                role.status,
                                                            )}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <ActionMenu label="Open role actions">
                                                            <DropdownMenuItem
                                                                onClick={() =>
                                                                    setEditingRole(
                                                                        role,
                                                                    )
                                                                }
                                                            >
                                                                <Pencil className="size-4" />
                                                                Edit
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                disabled={
                                                                    role.isSystem
                                                                }
                                                                variant="destructive"
                                                                onClick={() =>
                                                                    setDeletingRole(
                                                                        role,
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
                                    entity="roles"
                                    firstItemIndex={firstItemIndex}
                                    onPageChange={goToPage}
                                    onRowsPerPageChange={changeRowsPerPage}
                                    rowsPerPage={rowsPerPage}
                                    safeCurrentPage={safeCurrentPage}
                                    totalItems={filteredRoles.length}
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
