import { useState, useEffect, useRef } from "react";
import { fetchForms } from "../../services/FormService";
import { usePagination } from "../../hooks/api/usePagination";
import { useQuery } from "@tanstack/react-query";

export function useForms(request, { user }) {
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [filterState, setFilterState] = useState(() => localStorage.getItem("filterState") || "active");
    const [showAllVersions, setShowAllVersions] = useState(false);

    const [sortConfig, setSortConfig] = useState({ key: "created_at", direction: "desc" });

    const pagination = usePagination({ initialPageSize: 10 });
    const { page, setPage, pageSize, setPageSize, totalCount, setTotalCount } = pagination;

    // Debounce search
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(search);
        }, 600);
        return () => clearTimeout(handler);
    }, [search]);

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
            return res;
        },
        keepPreviousData: true,
        staleTime: 1000 * 60 * 5,
    });

    useEffect(() => {
        if (data?.count !== undefined) {
            setTotalCount(data.count);
        }
    }, [data?.count, setTotalCount]);

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
}
