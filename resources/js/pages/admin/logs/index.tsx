import { Head } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { AdminStatusFilter } from '@/components/admin/status-filter';
import { AdminTableSection } from '@/components/admin/table-section';
import { Badge } from '@/components/ui/badge';
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
import type { BadgeTone } from '@/lib/badge';

type ActivityLog = {
    action: string;
    createdAt: string | null;
    description: string | null;
    id: number;
    ipAddress: string | null;
    method: string;
    path: string;
    properties: Record<string, unknown> | null;
    routeName: string | null;
    statusCode: number | null;
    userAgent: string | null;
    userEmail: string | null;
    userName: string | null;
    userRole: string | null;
};

function actionTone(action: string): BadgeTone {
    if (['Activate', 'Create', 'Login'].includes(action)) {
        return 'success';
    }

    if (action === 'Update') {
        return 'primary';
    }

    if (action === 'Deactivate' || action === 'Logout') {
        return 'warning';
    }

    return 'muted';
}

export default function Logs({
    logs,
}: {
    logs: ActivityLog[];
}) {
    const [searchQuery, setSearchQuery] = useState('');
    const [actionFilter, setActionFilter] = useState('all');
    const availableActions = useMemo(
        () =>
            Array.from(new Set(logs.map((log) => log.action))).sort(
                (firstAction, secondAction) =>
                    firstAction.localeCompare(secondAction),
            ),
        [logs],
    );
    const filteredLogs = useMemo(() => {
        const normalizedSearch = searchQuery.trim().toLowerCase();

        return logs.filter((log) => {
            const matchesAction =
                actionFilter === 'all' || log.action === actionFilter;

            if (!matchesAction) {
                return false;
            }

            if (!normalizedSearch) {
                return true;
            }

            return [
                log.action,
                log.createdAt ?? '',
                log.description ?? '',
                log.ipAddress ?? '',
                log.method,
                log.path,
                log.routeName ?? '',
                log.userEmail ?? '',
                log.userName ?? '',
                log.userRole ?? '',
            ].some((value) => value.toLowerCase().includes(normalizedSearch));
        });
    }, [actionFilter, logs, searchQuery]);
    const {
        changeRowsPerPage,
        firstItemIndex,
        goToPage,
        resetPage,
        rowsPerPage,
        safeCurrentPage,
        totalPages,
        visibleItems: visibleLogs,
    } = useClientPagination({ items: filteredLogs });

    return (
        <>
            <Head title="Activity Logs" />
            <div className="flex min-h-full min-w-0 max-w-full flex-1 flex-col gap-6 p-4">
                <div>
                    <h1 className="font-heading text-2xl font-semibold">
                        Activity Logs
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Track important changes made across Averose.
                    </p>
                </div>

                <AdminTableSection
                    emptyMessage="No activity recorded yet."
                    emptySearchMessage="No activity matches your search."
                    filteredItems={filteredLogs.length}
                    pagination={{
                        entity: 'activity',
                        firstItemIndex,
                        onPageChange: goToPage,
                        onRowsPerPageChange: changeRowsPerPage,
                        rowsPerPage,
                        safeCurrentPage,
                        totalItems: filteredLogs.length,
                        totalPages,
                    }}
                    search={{
                        value: searchQuery,
                        onChange: (value) => {
                            setSearchQuery(value);
                            resetPage();
                        },
                        placeholder: 'Search activity...',
                    }}
                    toolbarEnd={
                        <AdminStatusFilter
                            value={actionFilter}
                            widthClassName="w-40"
                            options={[
                                { label: 'All actions', value: 'all' },
                                ...availableActions.map((action) => ({
                                    label: formatBadgeLabel(action),
                                    value: action,
                                })),
                            ]}
                            onValueChange={(value) => {
                                setActionFilter(value);
                                resetPage();
                            }}
                        />
                    }
                    totalItems={logs.length}
                >
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-48">Time</TableHead>
                                <TableHead>User</TableHead>
                                <TableHead className="w-32">Action</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead className="w-36">IP</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {visibleLogs.map((log) => (
                                <TableRow key={log.id}>
                                    <TableCell className="whitespace-nowrap text-muted-foreground">
                                        {log.createdAt ?? '-'}
                                    </TableCell>
                                    <TableCell>
                                        <span className="font-medium">
                                            {log.userName ?? 'Unknown user'}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            {...getBadgeProps(
                                                actionTone(log.action),
                                            )}
                                        >
                                            {formatBadgeLabel(log.action)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <p className="max-w-3xl text-sm">
                                            {log.description ?? '-'}
                                        </p>
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap text-muted-foreground">
                                        {log.ipAddress ?? '-'}
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

Logs.layout = {
    breadcrumbs: [
        {
            title: 'Activity Logs',
            href: '/logs',
        },
    ],
};
