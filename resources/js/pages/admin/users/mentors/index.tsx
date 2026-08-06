import { Form, Head, Link } from '@inertiajs/react';
import { Eye, Pencil, PowerOff, ShieldCheck, UserCheck } from 'lucide-react';
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
import { useUserTimezone } from '@/hooks/use-user-timezone';
import { formatBadgeLabel, getBadgeProps } from '@/lib/badge';
import { formatDate } from '@/lib/date-time';
import { CreateDialogMentor } from '@/pages/admin/users/mentors/components/create-dialog-mentor';
import type {
    MentorFormUser,
    MentorLevelOption,
    SubjectOption,
} from '@/pages/admin/users/mentors/components/form-mentor';
import { UpdateDialogMentor } from '@/pages/admin/users/mentors/components/update-dialog-mentor';

type User = MentorFormUser & {
    createdAt: string | null;
    id: number;
    slug: string;
    status: string;
    nickname: string;
};

export default function Mentors({
    mentorLevelOptions,
    subjectOptions,
    users,
}: {
    mentorLevelOptions: MentorLevelOption[];
    subjectOptions: SubjectOption[];
    users: User[];
}) {
    const timezone = useUserTimezone();
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [deletingUser, setDeletingUser] = useState<User | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const activeMentorsCount = users.filter(
        (user) => user.status === 'active',
    ).length;
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
                user.mentorLevel?.name ?? '',
                user.status,
            ].some((value) => value.toLowerCase().includes(normalizedSearch)),
        );
    }, [users, searchQuery, statusFilter]);

    return (
        <>
            <Head title="Mentors" />
            <div className="flex min-h-full max-w-full min-w-0 flex-1 flex-col gap-6 p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="font-heading text-2xl font-semibold">
                            Mentors
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Manage mentor accounts and access.
                        </p>
                    </div>
                    <CreateDialogMentor
                        open={addDialogOpen}
                        onOpenChange={setAddDialogOpen}
                        mentorLevelOptions={mentorLevelOptions}
                        subjectOptions={subjectOptions}
                        onSuccess={() => {
                            setAddDialogOpen(false);
                            toast.success('Mentor added.');
                        }}
                        onError={() =>
                            toast.error('Please check the mentor form.')
                        }
                    />
                </div>

                <UpdateDialogMentor
                    open={!!editingUser}
                    onOpenChange={(open) => !open && setEditingUser(null)}
                    user={editingUser}
                    mentorLevelOptions={mentorLevelOptions}
                    subjectOptions={subjectOptions}
                    onSuccess={() => {
                        setEditingUser(null);
                        toast.success('Mentor updated.');
                    }}
                    onError={() => toast.error('Please check the mentor form.')}
                />

                <AlertDialog
                    open={!!deletingUser}
                    onOpenChange={(open) => !open && setDeletingUser(null)}
                >
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>
                                Deactivate mentor?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                                This will deactivate {deletingUser?.name} from
                                mentor accounts.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        {deletingUser && (
                            <Form
                                action={`/users/${deletingUser.slug}`}
                                method="delete"
                                disableWhileProcessing
                                onSuccess={() => {
                                    setDeletingUser(null);
                                    toast.success('Mentor deactivated.');
                                }}
                                onError={() =>
                                    toast.error(
                                        'Unable to deactivate this mentor.',
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
                                            Deactivate mentor
                                        </Button>
                                    </AlertDialogFooter>
                                )}
                            </Form>
                        )}
                    </AlertDialogContent>
                </AlertDialog>

                <div className="grid gap-4 md:grid-cols-2">
                    <SummaryCard
                        icon={UserCheck}
                        label="Total mentors"
                        value={users.length}
                    />
                    <SummaryCard
                        icon={ShieldCheck}
                        label="Active mentors"
                        value={activeMentorsCount}
                    />
                </div>

                <AdminTableSection
                    emptyMessage="No mentors added yet."
                    emptySearchMessage="No mentors match your search."
                    filteredItems={filteredUsers.length}
                    search={{
                        value: searchQuery,
                        onChange: setSearchQuery,
                        placeholder: 'Search mentors...',
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
                            onValueChange={setStatusFilter}
                        />
                    }
                    totalItems={users.length}
                >
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Nickname</TableHead>
                                <TableHead>Level</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Joined</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="w-12 text-right" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredUsers.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">
                                        {user.name}
                                    </TableCell>
                                    <TableCell>{user.nickname}</TableCell>
                                    <TableCell>
                                        {user.mentorLevel ? (
                                            <div>
                                                <p className="font-medium">
                                                    {user.mentorLevel.name}
                                                </p>
                                            </div>
                                        ) : (
                                            '-'
                                        )}
                                    </TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>
                                        {user.createdAt
                                            ? formatDate(user.createdAt, timezone)
                                            : '-'}
                                    </TableCell>
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
                                        <ActionMenu label="Open mentor actions">
                                            <DropdownMenuItem asChild>
                                                <Link
                                                    href={`/users/mentors/${user.slug}`}
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

Mentors.layout = {
    breadcrumbs: [
        { title: 'Users', href: '/users/students' },
        { title: 'Mentors', href: '/users/mentors' },
    ],
};
