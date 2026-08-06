import { Form, Head, Link } from '@inertiajs/react';
import {
    CalendarClock,
    CircleAlert,
    Eye,
    Pencil,
    RotateCcw,
    PowerOff,
    ShieldCheck,
    Video,
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
import { formatDate, formatRelativeDateTime } from '@/lib/date-time';
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
    status: string;
    updatedAt: string | null;
};

type CapacitySummary = {
    fullAccounts: number;
    nearestRelease: {
        activeMeetings: number;
        name: string;
        releaseAt: string;
        slug: string;
    } | null;
};

function accountStatusLabel(account: ZoomAccount) {
    if (account.status !== 'active') {
        return account.status;
    }

    return account.isFull ? 'Full' : 'Active';
}

export default function ZoomAccounts({
    accounts,
    capacity,
}: {
    accounts: ZoomAccount[];
    capacity: CapacitySummary;
}) {
    const timezone = useUserTimezone();
    const [addAccountDialogOpen, setAddAccountDialogOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [editingAccount, setEditingAccount] = useState<ZoomAccount | null>(
        null,
    );
    const [deletingAccount, setDeletingAccount] = useState<ZoomAccount | null>(
        null,
    );
    const filteredAccounts = useMemo(() => {
        const normalizedSearch = searchQuery.trim().toLowerCase();

        return accounts.filter((account) =>
            (statusFilter === 'all' ||
                accountStatusLabel(account).toLowerCase() ===
                    statusFilter) &&
            [
                account.name,
                account.accountId,
                account.clientId,
                account.status,
                accountStatusLabel(account),
            ].some((value) => value.toLowerCase().includes(normalizedSearch)),
        );
    }, [accounts, searchQuery, statusFilter]);
    const availableStatuses = useMemo(
        () =>
            Array.from(
                new Set(
                    accounts.map((account) =>
                        accountStatusLabel(account).toLowerCase(),
                    ),
                ),
            ).sort((firstStatus, secondStatus) =>
                firstStatus.localeCompare(secondStatus),
            ),
        [accounts],
    );
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
            <div className="flex min-h-full min-w-0 max-w-full flex-1 flex-col gap-6 p-4">
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
                                {formatRelativeDateTime(
                                    capacity.nearestRelease.releaseAt,
                                )}
                            </Link>
                        )}
                    </SummaryCard>
                </div>

                <AdminTableSection
                    emptyMessage="No Zoom accounts added yet."
                    emptySearchMessage="No Zoom accounts match your search."
                    filteredItems={filteredAccounts.length}
                    pagination={{
                        entity: 'accounts',
                        firstItemIndex,
                        onPageChange: goToPage,
                        onRowsPerPageChange: changeRowsPerPage,
                        rowsPerPage,
                        safeCurrentPage,
                        totalItems: filteredAccounts.length,
                        totalPages,
                    }}
                    search={{
                        value: searchQuery,
                        onChange: (value) => {
                            setSearchQuery(value);
                            resetPage();
                        },
                        placeholder: 'Search accounts...',
                    }}
                    toolbarEnd={
                        <AdminStatusFilter
                            value={statusFilter}
                            widthClassName="w-40"
                            options={[
                                { label: 'All statuses', value: 'all' },
                                ...availableStatuses.map((status) => ({
                                    label: formatBadgeLabel(status),
                                    value: status,
                                })),
                            ]}
                            onValueChange={(value) => {
                                setStatusFilter(value);
                                resetPage();
                            }}
                        />
                    }
                    totalItems={accounts.length}
                >
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Account ID</TableHead>
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
                                    <TableCell>{account.accountId}</TableCell>
                                    <TableCell>{account.clientId}</TableCell>
                                    <TableCell>
                                        {account.createdAt
                                            ? formatDate(account.createdAt, timezone)
                                            : '-'}
                                    </TableCell>
                                    <TableCell>
                                        <div className="space-y-1">
                                            <Badge
                                                {...getBadgeProps(
                                                    account.status !== 'active'
                                                        ? getStatusBadgeTone(
                                                              account.status,
                                                          )
                                                        : account.isFull
                                                          ? 'danger'
                                                          : 'success',
                                                )}
                                            >
                                                {formatBadgeLabel(
                                                    accountStatusLabel(account),
                                                )}
                                            </Badge>
                                            {account.status === 'active' &&
                                                account.isFull &&
                                                account.releaseAt && (
                                                    <p className="text-xs text-muted-foreground">
                                                        Frees{' '}
                                                        {formatRelativeDateTime(
                                                            account.releaseAt,
                                                        )}
                                                    </p>
                                                )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <ActionMenu label="Open account actions">
                                            <DropdownMenuItem asChild>
                                                <Link
                                                    href={`/zoom-accounts/${account.slug}`}
                                                >
                                                    <Eye className="size-4" />
                                                    View
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() =>
                                                    setEditingAccount(account)
                                                }
                                            >
                                                <Pencil className="size-4" />
                                                Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            {account.status !== 'active' && (
                                                <DropdownMenuItem asChild>
                                                    <Form
                                                        action={`/zoom-accounts/${account.slug}/activate`}
                                                        method="put"
                                                        disableWhileProcessing
                                                        onSuccess={() =>
                                                            toast.success(
                                                                'Zoom account activated.',
                                                            )
                                                        }
                                                        onError={() =>
                                                            toast.error(
                                                                'Unable to activate this Zoom account.',
                                                            )
                                                        }
                                                        className="w-full"
                                                    >
                                                        <button
                                                            type="submit"
                                                            className="flex w-full items-center gap-2"
                                                        >
                                                            <RotateCcw className="size-4" />
                                                            Activate
                                                        </button>
                                                    </Form>
                                                </DropdownMenuItem>
                                            )}
                                            {account.status === 'active' && (
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
                </AdminTableSection>
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
