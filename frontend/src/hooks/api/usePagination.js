import { useState, useCallback, useMemo } from "react";

export function usePagination({ initialPage = 1, initialPageSize = 10 } = {}) {
    const [page, setPage] = useState(initialPage);
    const [pageSize, setPageSize] = useState(initialPageSize);
    const [totalCount, setTotalCount] = useState(0);

    // Derived total pages
    const totalPages = useMemo(() => Math.max(1, Math.ceil(totalCount / pageSize)), [totalCount, pageSize]);

    // Handlers
    const goToPage = useCallback(
        (newPage) => {
            const safePage = Math.max(1, Math.min(newPage, totalPages));
            setPage(safePage);
        },
        [totalPages]
    );

    const nextPage = useCallback(() => {
        setPage((prev) => Math.min(prev + 1, totalPages));
    }, [totalPages]);

    const prevPage = useCallback(() => {
        setPage((prev) => Math.max(prev - 1, 1));
    }, []);

    // Reset when data set changes
    const reset = useCallback(() => {
        setPage(1);
        setTotalCount(0);
    }, []);

    return {
        page,
        setPage: goToPage,
        pageSize,
        setPageSize,
        totalCount,
        setTotalCount,
        totalPages,
        nextPage,
        prevPage,
        reset,
    };
}
