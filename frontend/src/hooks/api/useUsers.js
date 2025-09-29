import { useState, useEffect, useRef } from "react";
import { fetchUsers } from "../../services/UserService";
import { usePagination } from "../../hooks/api/usePagination";

export function useUsers(request, { user }) {
    const [items, setItems] = useState([]);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [filterState, setFilterState] = useState(() => localStorage.getItem("filterState") || "active");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [sortConfig, setSortConfig] = useState({ key: "is_active", direction: "desc" });

    const pagination = usePagination({ initialPageSize: 10 });
    const { page, pageSize, setTotalCount } = pagination;

    const isFetching = useRef(false);

    // Debounce search
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(search);
        }, 600);
        return () => clearTimeout(handler);
    }, [search]);

    const doFetch = async () => {
        if (isFetching.current) return;
        isFetching.current = true;

        setLoading(true);
        setError(null);
        try {
            const res = await fetchUsers(request, {
                page,
                pageSize,
                search: debouncedSearch,
                filterState,
                ordering: sortConfig ? (sortConfig.direction === "asc" ? sortConfig.key : `-${sortConfig.key}`) : undefined,
            });
            setItems(res.results || []);
            setTotalCount(res.count || 0);
        } catch (err) {
            console.error("fetchUsers failed:", err);
            setError(err.message);
        } finally {
            setLoading(false);
            isFetching.current = false;
        }
    };

    useEffect(() => {
        localStorage.setItem("filterState", filterState);

        doFetch();
        // refresh every 2 min, but clear on unmount
        const interval = setInterval(doFetch, 2 * 60 * 1000);
        return () => clearInterval(interval);
    }, [page, pageSize, debouncedSearch, filterState, sortConfig]);

    return {
        items,
        setItems,
        search,
        setSearch,
        filterState,
        setFilterState,
        sortConfig,
        setSortConfig,
        loading,
        error,
        pagination,
        fetchData: doFetch,
    };
}
