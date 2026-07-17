import { useMemo, useState } from 'react';

type UseClientPaginationOptions<TItem> = {
    items: TItem[];
    initialRowsPerPage?: number;
};

export function useClientPagination<TItem>({
    items,
    initialRowsPerPage = 10,
}: UseClientPaginationOptions<TItem>) {
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(initialRowsPerPage);
    const totalPages = Math.max(1, Math.ceil(items.length / rowsPerPage));
    const safeCurrentPage = Math.min(currentPage, totalPages);
    const firstItemIndex = (safeCurrentPage - 1) * rowsPerPage;
    const visibleItems = useMemo(
        () => items.slice(firstItemIndex, firstItemIndex + rowsPerPage),
        [firstItemIndex, items, rowsPerPage],
    );

    const goToPage = (page: number) => {
        setCurrentPage(Math.min(Math.max(page, 1), totalPages));
    };

    const changeRowsPerPage = (value: number) => {
        setRowsPerPage(value);
        setCurrentPage(1);
    };

    return {
        changeRowsPerPage,
        firstItemIndex,
        goToPage,
        resetPage: () => setCurrentPage(1),
        rowsPerPage,
        safeCurrentPage,
        totalPages,
        visibleItems,
    };
}
