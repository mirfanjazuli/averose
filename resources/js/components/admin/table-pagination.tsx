import { Fragment } from 'react';
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

export type TablePaginationProps = {
    entity: string;
    firstItemIndex: number;
    onPageChange: (page: number) => void;
    onRowsPerPageChange: (rowsPerPage: number) => void;
    rowsPerPage: number;
    safeCurrentPage: number;
    totalItems: number;
    totalPages: number;
};

function getPageItems(currentPage: number, totalPages: number) {
    if (totalPages <= 5) {
        return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const pages = new Set([
        1,
        totalPages,
        currentPage - 1,
        currentPage,
        currentPage + 1,
    ]);

    return Array.from(pages)
        .filter((page) => page >= 1 && page <= totalPages)
        .sort((firstPage, secondPage) => firstPage - secondPage);
}

export function TablePagination({
    entity,
    firstItemIndex,
    onPageChange,
    onRowsPerPageChange,
    rowsPerPage,
    safeCurrentPage,
    totalItems,
    totalPages,
}: TablePaginationProps) {
    const pages = getPageItems(safeCurrentPage, totalPages);

    return (
        <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
            <p className="text-sm text-muted-foreground">
                Showing {firstItemIndex + 1}-
                {Math.min(firstItemIndex + rowsPerPage, totalItems)} of{' '}
                {totalItems} {entity}
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground lg:justify-center">
                <span>Rows per page</span>
                <Select
                    value={String(rowsPerPage)}
                    onValueChange={(value) =>
                        onRowsPerPageChange(Number(value))
                    }
                >
                    <SelectTrigger
                        size="sm"
                        className="h-10 min-h-10 w-20 rounded-xl py-0"
                    >
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="p-1.5">
                        <SelectItem value="5">5</SelectItem>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
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
                                onPageChange(safeCurrentPage - 1);
                            }}
                        />
                    </PaginationItem>
                    {pages.map((page, index) => (
                        <Fragment key={page}>
                            {index > 0 && page - pages[index - 1] > 1 && (
                                <PaginationItem key={`ellipsis-${page}`}>
                                    <PaginationEllipsis />
                                </PaginationItem>
                            )}
                            <PaginationItem key={page}>
                                <PaginationButton
                                    type="button"
                                    isActive={safeCurrentPage === page}
                                    onClick={() => onPageChange(page)}
                                >
                                    {page}
                                </PaginationButton>
                            </PaginationItem>
                        </Fragment>
                    ))}
                    <PaginationItem>
                        <PaginationNext
                            href="#"
                            className={
                                safeCurrentPage === totalPages
                                    ? 'pointer-events-none opacity-50'
                                    : undefined
                            }
                            onClick={(event) => {
                                event.preventDefault();
                                onPageChange(safeCurrentPage + 1);
                            }}
                        />
                    </PaginationItem>
                </PaginationContent>
            </Pagination>
        </div>
    );
}
