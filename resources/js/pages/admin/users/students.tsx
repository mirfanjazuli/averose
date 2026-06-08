import { Form, Head, Link } from '@inertiajs/react';
import {
    Eye,
    MoreVertical,
    Pencil,
    Plus,
    Search,
    Trash2,
    UserCheck,
    UsersRound,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
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
import type { ManagedUser } from '@/components/user-management-form';
import { UserManagementForm } from '@/components/user-management-form';

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
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(5);

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
    const totalPages = Math.max(1, Math.ceil(filteredUsers.length / rowsPerPage));
    const safeCurrentPage = Math.min(currentPage, totalPages);
    const firstIndex = (safeCurrentPage - 1) * rowsPerPage;
    const visibleUsers = filteredUsers.slice(firstIndex, firstIndex + rowsPerPage);

    const goToPage = (page: number) => {
        setCurrentPage(Math.min(Math.max(page, 1), totalPages));
    };

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
                    <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2">
                                <Plus className="size-4" />
                                Add student
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add student</DialogTitle>
                                <DialogDescription>
                                    Create a student account with default access.
                                </DialogDescription>
                            </DialogHeader>
                            <UserManagementForm
                                action="/users/students"
                                idPrefix="student"
                                resetOnSuccess
                                onSuccess={() => {
                                    setAddDialogOpen(false);
                                    toast.success('Student added.');
                                }}
                                onError={() => toast.error('Please check the student form.')}
                                submitLabel="Save student"
                            />
                        </DialogContent>
                    </Dialog>
                </div>

                <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Edit student</DialogTitle>
                            <DialogDescription>Update student account details.</DialogDescription>
                        </DialogHeader>
                        {editingUser && (
                            <UserManagementForm
                                action={`/users/${editingUser.slug}`}
                                idPrefix="edit-student"
                                method="put"
                                user={editingUser}
                                onSuccess={() => {
                                    setEditingUser(null);
                                    toast.success('Student updated.');
                                }}
                                onError={() => toast.error('Please check the student form.')}
                                submitLabel="Save changes"
                            />
                        )}
                    </DialogContent>
                </Dialog>

                <AlertDialog open={!!deletingUser} onOpenChange={(open) => !open && setDeletingUser(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Delete student?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will remove {deletingUser?.name} from student accounts.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        {deletingUser && (
                            <Form
                                action={`/users/${deletingUser.slug}`}
                                method="delete"
                                disableWhileProcessing
                                onSuccess={() => {
                                    setDeletingUser(null);
                                    toast.success('Student deleted.');
                                }}
                                onError={() => toast.error('Unable to delete this student.')}
                            >
                                {({ processing }) => (
                                    <AlertDialogFooter>
                                        <AlertDialogCancel type="button" disabled={processing}>
                                            Cancel
                                        </AlertDialogCancel>
                                        <Button type="submit" variant="destructive" disabled={processing}>
                                            Delete student
                                        </Button>
                                    </AlertDialogFooter>
                                )}
                            </Form>
                        )}
                    </AlertDialogContent>
                </AlertDialog>

                <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                        <CardContent className="flex items-center gap-4 px-6 py-5">
                            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                <UsersRound className="size-5" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Total students</p>
                                <p className="text-2xl font-semibold">{users.length}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="flex items-center gap-4 px-6 py-5">
                            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                <UserCheck className="size-5" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Active students</p>
                                <p className="text-2xl font-semibold">
                                    {users.filter((user) => user.status === 'active').length}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader className="gap-4 md:flex-row md:items-center md:justify-between">
                        <CardTitle>Student list</CardTitle>
                        <div className="flex h-10 min-w-64 items-center gap-2 rounded-2xl border bg-background px-3 text-sm text-muted-foreground">
                            <Search className="size-4" />
                            <Input
                                value={searchQuery}
                                onChange={(event) => {
                                    setSearchQuery(event.target.value);
                                    setCurrentPage(1);
                                }}
                                placeholder="Search students..."
                                className="h-auto border-0 bg-transparent px-0 py-0 shadow-none focus-visible:ring-0"
                            />
                        </div>
                    </CardHeader>
                    <CardContent>
                        {users.length === 0 ? (
                            <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                                No students added yet.
                            </div>
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
                                                    <TableCell className="font-medium">{user.name}</TableCell>
                                                    <TableCell>{user.nickname}</TableCell>
                                                    <TableCell>{user.email}</TableCell>
                                                    <TableCell>{user.createdAt}</TableCell>
                                                    <TableCell>
                                                        <Badge>{user.status}</Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon-sm" className="rounded-full">
                                                                    <MoreVertical className="size-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end" className="w-40">
                                                                <DropdownMenuItem asChild>
                                                                    <Link href={`/users/students/${user.slug}`}>
                                                                        <Eye className="size-4" />
                                                                        View
                                                                    </Link>
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => setEditingUser(user)}>
                                                                    <Pencil className="size-4" />
                                                                    Edit
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem variant="destructive" onClick={() => setDeletingUser(user)}>
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
                                        Showing {firstIndex + 1}-{Math.min(firstIndex + rowsPerPage, filteredUsers.length)} of {filteredUsers.length} students
                                    </p>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground lg:justify-center">
                                        <span>Rows per page</span>
                                        <Select value={String(rowsPerPage)} onValueChange={(value) => {
 setRowsPerPage(Number(value)); setCurrentPage(1); 
}}>
                                            <SelectTrigger className="h-9 w-20 rounded-xl"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="5">5</SelectItem>
                                                <SelectItem value="10">10</SelectItem>
                                                <SelectItem value="20">20</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <Pagination className="mx-0 w-auto justify-start lg:justify-end">
                                        <PaginationContent>
                                            <PaginationItem>
                                                <PaginationPrevious href="#" className={safeCurrentPage === 1 ? 'pointer-events-none opacity-50' : undefined} onClick={(event) => {
 event.preventDefault(); goToPage(safeCurrentPage - 1); 
}} />
                                            </PaginationItem>
                                            {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                                                <PaginationItem key={page}>
                                                    <PaginationButton type="button" isActive={safeCurrentPage === page} onClick={() => goToPage(page)}>
                                                        {page}
                                                    </PaginationButton>
                                                </PaginationItem>
                                            ))}
                                            {totalPages > 5 && <PaginationItem><PaginationEllipsis /></PaginationItem>}
                                            <PaginationItem>
                                                <PaginationNext href="#" className={safeCurrentPage === totalPages ? 'pointer-events-none opacity-50' : undefined} onClick={(event) => {
 event.preventDefault(); goToPage(safeCurrentPage + 1); 
}} />
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

Students.layout = {
    breadcrumbs: [
        { title: 'Users', href: '/users/students' },
        { title: 'Students', href: '/users/students' },
    ],
};
