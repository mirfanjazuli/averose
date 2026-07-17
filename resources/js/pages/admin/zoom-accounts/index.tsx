import { Form, Head, Link } from '@inertiajs/react';
import {
    CalendarClock,
    CircleAlert,
    Eye,
    Pencil,
    PowerOff,
    ShieldCheck,
    Video,
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
import { CreateDialogZoomAccount } from '@/pages/admin/zoom-accounts/components/create-dialog-zoom-account';
import { UpdateDialogZoomAccount } from '@/pages/admin/zoom-accounts/components/update-dialog-zoom-account';

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
    status: string;
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
            [
                account.name,
                account.accountId,
                account.clientId,
                account.status,
            ].some((value) => value.toLowerCase().includes(normalizedSearch)),
        );
    }, [accounts, searchQuery]);
    const {
        changeRowsPerPage,
        firstItemIndex,
        goToPage,
        resetPage,
        rowsPerPage,
        safeCurrentPage,
        totalPages,
        visibleItems: visibleAccounts,
    } = useClientPagination({ items: filteredAccounts });

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
                    <CreateDialogZoomAccount
                        open={addAccountDialogOpen}
                        onOpenChange={setAddAccountDialogOpen}
                        onSuccess={() => {
                            setAddAccountDialogOpen(false);
                            toast.success('Zoom account added.');
                        }}
                        onError={() => {
                            toast.error('Please check the Zoom account form.');
                        }}
                    />
                </div>

                <UpdateDialogZoomAccount
                    open={!!editingAccount}
                    onOpenChange={(open) => {
                        if (!open) {
                            setEditingAccount(null);
                        }
                    }}
                    account={editingAccount}
                    onSuccess={() => {
                        setEditingAccount(null);
                        toast.success('Zoom account updated.');
                    }}
                    onError={() => {
                        toast.error('Please check the Zoom account form.');
                    }}
                />

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
                                Deactivate Zoom account?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                                This will deactivate {deletingAccount?.name} and
                                remove it from available Zoom accounts.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        {deletingAccount && (
                            <Form
                                action={`/zoom-accounts/${deletingAccount.slug}`}
                                method="delete"
                                disableWhileProcessing
                                onSuccess={() => {
                                    setDeletingAccount(null);
                                    toast.success('Zoom account deactivated.');
                                }}
                                onError={() => {
                                    toast.error(
                                        'Unable to deactivate this Zoom account.',
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
                                            Deactivate account
                                        </Button>
                                    </AlertDialogFooter>
                                )}
                            </Form>
                        )}
                    </AlertDialogContent>
                </AlertDialog>

                <div className="grid gap-4 md:grid-cols-3">
                    <SummaryCard
                        icon={Video}
                        label="Total accounts"
                        value={accounts.length}
                    />
                    <SummaryCard
                        icon={ShieldCheck}
                        label="Active accounts"
                        value={accounts.length}
                    />
                    <SummaryCard
                        icon={
                            capacity.nearestRelease
                                ? CircleAlert
                                : CalendarClock
                        }
                        label="Full accounts"
                        value={capacity.fullAccounts}
                    >
                        {capacity.nearestRelease && (
                            <Link
                                href={`/zoom-accounts/${capacity.nearestRelease.slug}`}
                                className="mt-1 block truncate text-xs text-primary hover:underline"
                            >
                                {capacity.nearestRelease.name} frees{' '}
                                {capacity.nearestRelease.releaseIn}
                            </Link>
                        )}
                    </SummaryCard>
                </div>

                <Card>
                    <CardHeader className="gap-4 md:flex-row md:items-center md:justify-between">
                        <CardTitle>Account list</CardTitle>
                        <TableSearch
                            value={searchQuery}
                            onChange={(value) => {
                                setSearchQuery(value);
                                resetPage();
                            }}
                            placeholder="Search accounts..."
                        />
                    </CardHeader>
                    <CardContent>
                        {accounts.length === 0 ? (
                            <EmptyState>No Zoom accounts added yet.</EmptyState>
                        ) : filteredAccounts.length === 0 ? (
                            <EmptyState>
                                No Zoom accounts match your search.
                            </EmptyState>
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
                                                                {...getBadgeProps(
                                                                    account.status !==
                                                                        'active'
                                                                        ? getStatusBadgeTone(
                                                                              account.status,
                                                                          )
                                                                        : account.isFull
                                                                          ? 'danger'
                                                                          : 'success',
                                                                )}
                                                            >
                                                                {formatBadgeLabel(
                                                                    account.status !==
                                                                        'active'
                                                                        ? account.status
                                                                        : account.isFull
                                                                          ? 'Full'
                                                                          : 'Active',
                                                                )}
                                                            </Badge>
                                                            {account.status ===
                                                                'active' &&
                                                                account.isFull &&
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
                                                        <ActionMenu label="Open account actions">
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
                                                            {account.status ===
                                                                'active' && (
                                                                <DropdownMenuItem
                                                                    variant="destructive"
                                                                    onClick={() =>
                                                                        setDeletingAccount(
                                                                            account,
                                                                        )
                                                                    }
                                                                >
                                                                    <PowerOff className="size-4" />
                                                                    Deactivate
                                                                </DropdownMenuItem>
                                                            )}
                                                        </ActionMenu>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                                <TablePagination
                                    entity="accounts"
                                    firstItemIndex={firstItemIndex}
                                    onPageChange={goToPage}
                                    onRowsPerPageChange={changeRowsPerPage}
                                    rowsPerPage={rowsPerPage}
                                    safeCurrentPage={safeCurrentPage}
                                    totalItems={filteredAccounts.length}
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

ZoomAccounts.layout = {
    breadcrumbs: [
        {
            title: 'Zoom Accounts',
            href: '/zoom-accounts',
        },
    ],
};
