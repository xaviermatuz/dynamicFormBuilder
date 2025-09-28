import { useState, useEffect, useRef } from "react";
import { fetchSubmissions } from "../../services/SubmissionService";
import { usePagination } from "./usePagination";

export function useSubmissions(request, { formId }) {
    const [items, setItems] = useState([]);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [sortConfig, setSortConfig] = useState({ key: "submitted_at", direction: "desc" });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const pagination = usePagination({ initialPageSize: 10 });
    const { page, pageSize, setTotalCount } = pagination;

    const isFetching = useRef(false);

    // Debounce search
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedSearch(search), 600);
        return () => clearTimeout(handler);
    }, [search]);

    const doFetch = async () => {
        if (isFetching.current) return;
        isFetching.current = true;

        setLoading(true);
        setError(null);

        try {
            const res = await fetchSubmissions(request, {
                formId,
                page,
                pageSize,
                search: debouncedSearch,
                ordering: sortConfig ? (sortConfig.direction === "asc" ? sortConfig.key : `-${sortConfig.key}`) : undefined,
            });

            setItems(res.results || []);
            setTotalCount(res.count || 0);
        } catch (err) {
            console.error("fetchSubmissions failed:", err);
            setError(err.message);
        } finally {
            setLoading(false);
            isFetching.current = false;
        }
    };

    useEffect(() => {
        doFetch();
        const interval = setInterval(doFetch, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [page, pageSize, debouncedSearch, sortConfig]);

    return {
        items,
        setItems,
        search,
        setSearch,
        sortConfig,
        setSortConfig,
        loading,
        error,
        pagination,
        fetchData: doFetch,
    };
}
