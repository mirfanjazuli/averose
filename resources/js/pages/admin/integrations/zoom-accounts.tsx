import { Form, Head, Link } from '@inertiajs/react';
import {
    CalendarClock,
    CircleAlert,
    Eye,
    MoreVertical,
    Pencil,
    Plus,
    Search,
    ShieldCheck,
    Trash2,
    Video,
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
import { ZoomAccountForm } from '@/components/zoom-account-form';

type ZoomAccount = {
    activeMeetings?: number;
    id: number;
    isFull?: boolean;
    name: string;
    slug: string;
    accountId: string;
    clientId: string;
    createdAt: string | null;
    releaseAt?: string | null;
    releaseIn?: string | null;
    updatedAt: string | null;
};

type CapacitySummary = {
    fullAccounts: number;
    nearestRelease: {
        activeMeetings: number;
        name: string;
        releaseAt: string;
        releaseIn: string;
        slug: string;
    } | null;
};

export default function ZoomAccounts({
    accounts,
    capacity,
}: {
    accounts: ZoomAccount[];
    capacity: CapacitySummary;
}) {
    const [addAccountDialogOpen, setAddAccountDialogOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [accountsPerPage, setAccountsPerPage] = useState(5);
    const [editingAccount, setEditingAccount] = useState<ZoomAccount | null>(
        null,
    );
    const [deletingAccount, setDeletingAccount] = useState<ZoomAccount | null>(
        null,
    );
    const filteredAccounts = useMemo(() => {
        const normalizedSearch = searchQuery.trim().toLowerCase();

        if (!normalizedSearch) {
            return accounts;
        }

        return accounts.filter((account) =>
            [account.name, account.accountId, account.clientId].some((value) =>
                value.toLowerCase().includes(normalizedSearch),
            ),
        );
    }, [accounts, searchQuery]);
    const totalPages = Math.max(
        1,
        Math.ceil(filteredAccounts.length / accountsPerPage),
    );
    const safeCurrentPage = Math.min(currentPage, totalPages);
    const firstAccountIndex = (safeCurrentPage - 1) * accountsPerPage;
    const visibleAccounts = filteredAccounts.slice(
        firstAccountIndex,
        firstAccountIndex + accountsPerPage,
    );

    const goToPage = (page: number) => {
        setCurrentPage(Math.min(Math.max(page, 1), totalPages));
    };

    return (
        <>
            <Head title="Zoom Accounts" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="font-heading text-2xl font-semibold">
                            Zoom Accounts
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Manage Zoom accounts used for classes, mentoring,
                            and workshops.
                        </p>
                    </div>
                    <Dialog
                        open={addAccountDialogOpen}
                        onOpenChange={setAddAccountDialogOpen}
                    >
                        <DialogTrigger asChild>
                            <Button className="gap-2">
                                <Plus className="size-4" />
                                Add account
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add Zoom account</DialogTitle>
                                <DialogDescription>
                                    Store Zoom credentials used to create and
                                    manage meeting rooms.
                                </DialogDescription>
                            </DialogHeader>
                            <ZoomAccountForm
                                action="/zoom-accounts"
                                idPrefix="zoom"
                                method="post"
                                resetOnSuccess
                                onSuccess={() => {
                                    setAddAccountDialogOpen(false);
                                    toast.success('Zoom account added.');
                                }}
                                onError={() => {
                                    toast.error(
                                        'Please check the Zoom account form.',
                                    );
                                }}
                                submitLabel="Save account"
                            />
                        </DialogContent>
                    </Dialog>
                </div>

                <Dialog
                    open={!!editingAccount}
                    onOpenChange={(open) => {
                        if (!open) {
                            setEditingAccount(null);
                        }
                    }}
                >
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Edit Zoom account</DialogTitle>
                            <DialogDescription>
                                Update account details or rotate credentials.
                            </DialogDescription>
                        </DialogHeader>
                        {editingAccount && (
                            <ZoomAccountForm
                                account={editingAccount}
                                key={editingAccount.id}
                                action={`/zoom-accounts/${editingAccount.slug}`}
                                idPrefix="edit-zoom"
                                method="put"
                                onSuccess={() => {
                                    setEditingAccount(null);
                                    toast.success('Zoom account updated.');
                                }}
                                onError={() => {
                                    toast.error(
                                        'Please check the Zoom account form.',
                                    );
                                }}
                                submitLabel="Save changes"
                            />
                        )}
                    </DialogContent>
                </Dialog>

                <AlertDialog
                    open={!!deletingAccount}
                    onOpenChange={(open) => {
                        if (!open) {
                            setDeletingAccount(null);
                        }
                    }}
                >
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>
                                Delete Zoom account?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                                This will remove {deletingAccount?.name} from
                                the available Zoom accounts.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        {deletingAccount && (
                            <Form
                                action={`/zoom-accounts/${deletingAccount.slug}`}
                                method="delete"
                                disableWhileProcessing
                                onSuccess={() => {
                                    setDeletingAccount(null);
                                    toast.success('Zoom account deleted.');
                                }}
                                onError={() => {
                                    toast.error(
                                        'Unable to delete this Zoom account.',
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
                                            Delete account
                                        </Button>
                                    </AlertDialogFooter>
                                )}
                            </Form>
                        )}
                    </AlertDialogContent>
                </AlertDialog>

                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardContent className="flex items-center gap-4 px-6 py-5">
                            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                <Video className="size-5" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Total accounts
                                </p>
                                <p className="text-2xl font-semibold">
                                    {accounts.length}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="flex items-center gap-4 px-6 py-5">
                            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                <ShieldCheck className="size-5" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Active accounts
                                </p>
                                <p className="text-2xl font-semibold">
                                    {accounts.length}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="flex items-center gap-4 px-6 py-5">
                            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                {capacity.nearestRelease ? (
                                    <CircleAlert className="size-5" />
                                ) : (
                                    <CalendarClock className="size-5" />
                                )}
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm text-muted-foreground">
                                    Full accounts
                                </p>
                                <p className="text-2xl font-semibold">
                                    {capacity.fullAccounts}
                                </p>
                                {capacity.nearestRelease && (
                                    <Link
                                        href={`/zoom-accounts/${capacity.nearestRelease.slug}`}
                                        className="mt-1 block truncate text-xs text-primary hover:underline"
                                    >
                                        {capacity.nearestRelease.name} frees{' '}
                                        {capacity.nearestRelease.releaseIn}
                                    </Link>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader className="gap-4 md:flex-row md:items-center md:justify-between">
                        <CardTitle>Account list</CardTitle>
                        <div className="flex h-10 min-w-64 items-center gap-2 rounded-2xl border bg-background px-3 text-sm text-muted-foreground">
                            <Search className="size-4" />
                            <Input
                                value={searchQuery}
                                onChange={(event) => {
                                    setSearchQuery(event.target.value);
                                    setCurrentPage(1);
                                }}
                                placeholder="Search accounts..."
                                className="h-auto border-0 bg-transparent px-0 py-0 shadow-none focus-visible:ring-0"
                            />
                        </div>
                    </CardHeader>
                    <CardContent>
                        {accounts.length === 0 ? (
                            <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                                No Zoom accounts added yet.
                            </div>
                        ) : filteredAccounts.length === 0 ? (
                            <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                                No Zoom accounts match your search.
                            </div>
                        ) : (
                            <>
                                <div className="rounded-2xl border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Name</TableHead>
                                                <TableHead>
                                                    Account ID
                                                </TableHead>
                                                <TableHead>Client ID</TableHead>
                                                <TableHead>Created</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="w-12 text-right" />
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {visibleAccounts.map((account) => (
                                                <TableRow key={account.id}>
                                                    <TableCell className="font-medium">
                                                        {account.name}
                                                    </TableCell>
                                                    <TableCell>
                                                        {account.accountId}
                                                    </TableCell>
                                                    <TableCell>
                                                        {account.clientId}
                                                    </TableCell>
                                                    <TableCell>
                                                        {account.createdAt}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="space-y-1">
                                                            <Badge
                                                                variant={
                                                                    account.isFull
                                                                        ? 'destructive'
                                                                        : 'default'
                                                                }
                                                            >
                                                                {account.isFull
                                                                    ? 'Full'
                                                                    : 'Active'}
                                                            </Badge>
                                                            {account.isFull &&
                                                                account.releaseAt && (
                                                                    <p className="text-xs text-muted-foreground">
                                                                        Frees{' '}
                                                                        {
                                                                            account.releaseIn
                                                                        }
                                                                    </p>
                                                                )}
                                                        </div>
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
                                                                        account
                                                                        actions
                                                                    </span>
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent
                                                                align="end"
                                                                className="w-40"
                                                            >
                                                                <DropdownMenuItem
                                                                    asChild
                                                                >
                                                                    <Link
                                                                        href={`/zoom-accounts/${account.slug}`}
                                                                    >
                                                                        <Eye className="size-4" />
                                                                        View
                                                                    </Link>
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    onClick={() =>
                                                                        setEditingAccount(
                                                                            account,
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
                                                                        setDeletingAccount(
                                                                            account,
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
                                        Showing {firstAccountIndex + 1}-
                                        {Math.min(
                                            firstAccountIndex + accountsPerPage,
                                            filteredAccounts.length,
                                        )}{' '}
                                        of {filteredAccounts.length} accounts
                                    </p>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground lg:justify-center">
                                        <span>Rows per page</span>
                                        <Select
                                            value={String(accountsPerPage)}
                                            onValueChange={(value) => {
                                                setAccountsPerPage(
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

ZoomAccounts.layout = {
    breadcrumbs: [
        {
            title: 'Zoom Accounts',
            href: '/zoom-accounts',
        },
    ],
};
