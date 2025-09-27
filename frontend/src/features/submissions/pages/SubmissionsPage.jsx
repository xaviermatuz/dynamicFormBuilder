import React, { useState, useEffect, useMemo } from "react";
import { notifyError } from "../../../utils/toast";
import { useDeleteItem } from "../../../hooks/api/useDelete";
import DataTable from "../../../common/components/DataTable";
import ViewSubmissionModal from "../modals/ViewSubmissionModal";
import { useAuth } from "../../../context/AuthContext";
import * as Tooltip from "@radix-ui/react-tooltip";
import { ScanEyeIcon, Trash2Icon, FileUp } from "lucide-react";
import { useApi } from "../../../hooks/api/useApi";

export default function SubmissionsPage({ formId }) {
    const apiUrl = formId ? `/forms/${formId}/submissions/` : `/submissions/`;

    const { deleteItem } = useDeleteItem();
    const { user } = useAuth();

    // Table state
    const [items, setItems] = useState([]);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalCount, setTotalCount] = useState(0);

    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [sortConfig, setSortConfig] = useState({ key: "submitted_at", direction: "desc" });

    const { request, loading, error } = useApi();

    // Modals
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [viewItem, setViewItem] = useState(null);

    // Columns
    const baseColumns = [
        { key: "form_name", label: "Form" },
        { key: "submitted_at", label: "Submitted At" },
        { key: "actions", label: "Actions", isAction: true },
    ];

    const adminColumns = [
        { key: "id", label: "ID" },
        { key: "form", label: "Form ID" },
        { key: "form_name", label: "Form" },
        { key: "form_version", label: "Version" },
        { key: "submitted_by", label: "Submitted By" },
        { key: "submitted_at", label: "Submitted At" },
        { key: "actions", label: "Actions", isAction: true },
    ];
    const columns = user?.roles?.includes("admin")
        ? [...adminColumns] // admin sees all these
        : [...baseColumns];

    const searchableColumns = columns.filter((col) => !col.isAction).map((col) => col.key);

    // Function to generate visible page numbers with ellipsis
    const getPageNumbers = (current, total) => {
        const pages = [];
        if (total <= 7) {
            // Small number of pages: show all
            for (let i = 1; i <= total; i++) pages.push(i);
        } else {
            // Always show first and last
            pages.push(1);

            const left = Math.max(current - 1, 2);
            const right = Math.min(current + 1, total - 1);

            if (left > 2) pages.push("...");
            for (let i = left; i <= right; i++) pages.push(i);
            if (right < total - 1) pages.push("...");

            pages.push(total);
        }
        return pages;
    };

    // Debounce effect: update debouncedSearch after delay
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1); // reset to first page whenever a new search starts
        }, 1200);

        return () => clearTimeout(handler);
    }, [search]);

    // Fetch data
    const fetchData = async (currentPage = page, currentPageSize = pageSize, searchTerm = debouncedSearch) => {
        let url = `${apiUrl}?page=${currentPage}&page_size=${currentPageSize}&search=${encodeURIComponent(searchTerm)}`;

        try {
            const res = await request({
                endpoint: url,
            });

            setItems(res.results || []);
            setTotalCount(res.count || 0);
        } catch (err) {
            console.error(err);
            notifyError("Failed to fetch submissions.  Please try again.");
        }
    };

    // Fetch on page/pageSize/search changes
    useEffect(() => {
        fetchData(page, pageSize, debouncedSearch);

        const interval = setInterval(() => fetchData(page, pageSize, debouncedSearch), 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [page, pageSize, debouncedSearch]);

    const handleSort = (key) => {
        setSortConfig((prev) => {
            if (prev.key === key) {
                return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
            }
            return { key, direction: "asc" };
        });
    };

    // Derived data: filter + sort
    const filteredItems = useMemo(() => {
        let data = [...items];

        // Search filter
        if (search.trim() !== "") {
            data = data.filter((item) =>
                searchableColumns.some((key) => {
                    const value = item[key];
                    return value && value.toString().toLowerCase().includes(search.toLowerCase());
                })
            );
        }

        // Sorting
        if (sortConfig?.key) {
            data.sort((a, b) => {
                const aVal = a[sortConfig.key];
                const bVal = b[sortConfig.key];

                if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
                return 0;
            });
        }

        return data;
    }, [items, search, sortConfig]);

    const handleDelete = async (id) => {
        const success = await deleteItem("submissions", id, user);
        if (success) setItems((prev) => prev.filter((i) => i.id !== id));
    };

    return (
        <Tooltip.Provider delayDuration={200}>
            <div className='p-2 sm:p-4 lg:p-6 xl:p-8'>
                <h1 className='text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold mb-4 flex items-center gap-2'>
                    <FileUp className='w-6 h-6' />
                    Submissions
                </h1>

                <div className='relative overflow-x-auto'>
                    <DataTable
                        columns={columns}
                        items={filteredItems}
                        page={page}
                        setPage={setPage}
                        pageSize={pageSize}
                        setPageSize={setPageSize}
                        totalCount={totalCount}
                        sortConfig={sortConfig}
                        onSort={handleSort}
                        getPageNumbers={getPageNumbers}
                        loading={loading}
                        error={error}
                        searchable
                        search={search}
                        setSearch={setSearch}
                        renderRow={(item) => (
                            <tr key={item.id} className='border-t hover:bg-gray-50 text-center'>
                                {user?.roles?.includes("admin") ? (
                                    // Admin view
                                    <>
                                        <td className='py-2 px-4'>{item.id}</td>
                                        <td className='py-2 px-4'>{item.form}</td>
                                        <td className='py-2 px-4'>{item.form_name}</td>
                                        <td className='py-2 px-4'>{item.form_version}</td>
                                        <td className='py-2 px-4'>{item.submitted_by}</td>
                                        <td className='py-2 px-4'>{new Date(item.submitted_at).toLocaleString()}</td>
                                    </>
                                ) : (
                                    // Editor/Viewer view
                                    <>
                                        <td className='py-2 px-4'>{item.form_name}</td>
                                        <td className='py-2 px-4'>{new Date(item.submitted_at).toLocaleString()}</td>
                                    </>
                                )}
                                <td className='py-2 px-4 flex flex-wrap gap-1 justify-center'>
                                    <Tooltip.Root>
                                        <Tooltip.Trigger asChild>
                                            <button
                                                className='px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600'
                                                onClick={() => {
                                                    setViewItem(item);
                                                    setIsViewModalOpen(true);
                                                }}
                                            >
                                                <ScanEyeIcon />
                                            </button>
                                        </Tooltip.Trigger>
                                        <Tooltip.Content className='bg-gray-800 text-white text-xs rounded px-2 py-1 shadow-md'>
                                            View submission
                                            <Tooltip.Arrow className='fill-gray-800' />
                                        </Tooltip.Content>
                                    </Tooltip.Root>

                                    {/* Delete (Admin only) */}
                                    {user?.roles?.includes("admin") && (
                                        <Tooltip.Root>
                                            <Tooltip.Trigger asChild>
                                                <button
                                                    className='px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600'
                                                    onClick={() => handleDelete(item.id)}
                                                >
                                                    <Trash2Icon />
                                                </button>
                                            </Tooltip.Trigger>
                                            <Tooltip.Content className='bg-gray-800 text-white text-xs rounded px-2 py-1 shadow-md'>
                                                Delete submission
                                                <Tooltip.Arrow className='fill-gray-800' />
                                            </Tooltip.Content>
                                        </Tooltip.Root>
                                    )}
                                </td>
                            </tr>
                        )}
                        renderMobileRow={(item) => (
                            <div key={item.id} className='bg-white shadow rounded p-4 flex flex-col gap-2 text-sm sm:text-base'>
                                <div>
                                    <span className='font-medium'>ID:</span> {item.id}
                                </div>
                                <div>
                                    <span className='font-medium'>Name:</span> {item.name}
                                </div>
                                <div>
                                    <span className='font-medium'>Created:</span> {new Date(item.created_at).toLocaleString()}
                                </div>
                                <div className='flex flex-wrap gap-2 mt-2'>
                                    {/* View */}
                                    <Tooltip.Root>
                                        <Tooltip.Trigger asChild>
                                            <button
                                                className='px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600'
                                                onClick={() => {
                                                    setViewItem(item);
                                                    setIsViewModalOpen(true);
                                                }}
                                            >
                                                <ScanEyeIcon />
                                            </button>
                                        </Tooltip.Trigger>
                                        <Tooltip.Content className='bg-gray-800 text-white text-xs rounded px-2 py-1 shadow-md'>
                                            View form details
                                            <Tooltip.Arrow className='fill-gray-800' />
                                        </Tooltip.Content>
                                    </Tooltip.Root>

                                    {/* Delete (Admin only) */}
                                    {user?.roles?.includes("admin") && (
                                        <Tooltip.Root>
                                            <Tooltip.Trigger asChild>
                                                <button
                                                    className='px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600'
                                                    onClick={() => handleDelete(item.id)}
                                                >
                                                    <Trash2Icon />
                                                </button>
                                            </Tooltip.Trigger>
                                            <Tooltip.Content className='bg-gray-800 text-white text-xs rounded px-2 py-1 shadow-md'>
                                                Delete submission
                                                <Tooltip.Arrow className='fill-gray-800' />
                                            </Tooltip.Content>
                                        </Tooltip.Root>
                                    )}
                                </div>
                            </div>
                        )}
                    />
                </div>

                {/* View Modal */}
                <ViewSubmissionModal isViewModalOpen={isViewModalOpen} setIsViewModalOpen={setIsViewModalOpen} viewItem={viewItem} user={user} />
            </div>
        </Tooltip.Provider>
    );
}
