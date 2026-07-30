import type { ReactNode } from 'react';
import { EmptyState } from '@/components/admin/empty-state';
import {
    TablePagination
    
} from '@/components/admin/table-pagination';
import type {TablePaginationProps} from '@/components/admin/table-pagination';
import { TableScrollArea } from '@/components/admin/table-scroll-area';
import { TableSearch } from '@/components/admin/table-search';

type AdminTableSectionProps = {
    children: ReactNode;
    emptyMessage: ReactNode;
    emptySearchMessage: ReactNode;
    filteredItems: number;
    pagination?: TablePaginationProps;
    search: {
        onChange: (value: string) => void;
        placeholder: string;
        value: string;
    };
    tableMinWidth?: string;
    toolbarEnd?: ReactNode;
    totalItems: number;
};

export function AdminTableSection({
    children,
    emptyMessage,
    emptySearchMessage,
    filteredItems,
    pagination,
    search,
    tableMinWidth,
    toolbarEnd,
    totalItems,
}: AdminTableSectionProps) {
    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <TableSearch
                    value={search.value}
                    onChange={search.onChange}
                    placeholder={search.placeholder}
                />
                {toolbarEnd}
            </div>

            {totalItems === 0 ? (
                <EmptyState>{emptyMessage}</EmptyState>
            ) : filteredItems === 0 ? (
                <EmptyState>{emptySearchMessage}</EmptyState>
            ) : (
                <>
                    <TableScrollArea minWidth={tableMinWidth}>
                        {children}
                    </TableScrollArea>
                    {pagination ? <TablePagination {...pagination} /> : null}
                </>
            )}
        </div>
    );
}
