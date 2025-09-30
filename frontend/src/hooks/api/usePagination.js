import { useState, useCallback, useMemo } from "react";

export function usePagination({ initialPage = 1, initialPageSize = 10 } = {}) {
    const [page, setPage] = useState(initialPage);
    const [pageSize, setPageSize] = useState(initialPageSize);
    const [totalCount, setTotalCount] = useState(0);

    // Derived total pages
    const totalPages = useMemo(() => Math.max(1, Math.ceil(totalCount / pageSize)), [totalCount, pageSize]);

    // Handlers
    const goToPage = useCallback(
        (next) => {
            const proposed = typeof next === "function" ? next(page) : next;
            const numeric = Number(proposed);
            const safe = Number.isFinite(numeric) ? numeric : 1;
            const clamped = Math.max(1, Math.min(safe, totalPages));
            setPage(clamped);
        },
        [page, totalPages]
    );

    const nextPage = useCallback(() => {
        goToPage((prev) => prev + 1);
    }, [goToPage]);

    const prevPage = useCallback(() => {
        goToPage((prev) => prev - 1);
    }, [goToPage]);

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
