import { useState, useEffect, useRef } from "react";
import { fetchForms } from "../../services/FormService";
import { usePagination } from "../../hooks/api/usePagination";
import { useQuery } from "@tanstack/react-query";

export function useForms(request, { user }) {
    const [items, setItems] = useState([]);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [filterState, setFilterState] = useState(() => localStorage.getItem("filterState") || "active");
    const [showAllVersions, setShowAllVersions] = useState(false);

    const [sortConfig, setSortConfig] = useState({ key: "created_at", direction: "desc" });

    const [loading, setLoading] = useState(false);
    // const [error, setError] = useState(null);

    const pagination = usePagination({ initialPageSize: 10 });
    const { page, pageSize, setTotalCount } = pagination;

    // const isFetching = useRef(false);

    // Debounce search
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(search);
        }, 600);
        return () => clearTimeout(handler);
    }, [search]);

    const queryKey = ["forms", page, pageSize, debouncedSearch, filterState, showAllVersions, sortConfig];

    // const doFetch = async () => {
    //     if (isFetching.current) return;
    //     isFetching.current = true;

    //     setLoading(true);
    //     setError(null);
    //     try {
    //         const res = await fetchForms(request, {
    //             page,
    //             pageSize,
    //             search: debouncedSearch,
    //             filterState,
    //             showAllVersions,
    //         });

    //         // only update if changed
    //         if (JSON.stringify(res.results) !== JSON.stringify(items)) {
    //             setItems(res.results || []);
    //             setTotalCount(res.count || 0);
    //         }
    //     } catch (err) {
    //         console.error("fetchForms failed:", err);
    //         setError(err.message);
    //     } finally {
    //         setLoading(false);
    //         isFetching.current = false;
    //     }
    // };

    // Fetch forms
    // useEffect(() => {
    //     doFetch();

    //     // refresh every 5 min, but clear on unmount
    //     const interval = setInterval(doFetch, 5 * 60 * 1000);
    //     return () => clearInterval(interval);
    // }, [page, pageSize, debouncedSearch, filterState, showAllVersions]);

    const { data, error, isLoading, isFetching, refetch } = useQuery({
        queryKey: ["forms", page, pageSize, debouncedSearch, filterState, showAllVersions, sortConfig],
        queryFn: async () => {
            const res = await fetchForms(request, {
                page,
                pageSize,
                search: debouncedSearch,
                filterState,
                showAllVersions,
                sortConfig,
            });
            setTotalCount(res.count || 0);
            return res;
        },
        keepPreviousData: true,
        staleTime: 1000 * 60 * 5,
    });

    return {
        items: data?.results || [],
        search,
        setSearch,
        filterState,
        setFilterState,
        showAllVersions,
        setShowAllVersions,
        sortConfig,
        setSortConfig,
        loading: isLoading,
        error,
        pagination,
        refetch,
        isFetching,
    };

    // return {
    //     items,
    //     setItems,
    //     search,
    //     setSearch,
    //     filterState,
    //     setFilterState,
    //     showAllVersions,
    //     setShowAllVersions,
    //     sortConfig,
    //     setSortConfig,
    //     loading,
    //     error,
    //     pagination,
    //     refetch: doFetch,
    // };
}
