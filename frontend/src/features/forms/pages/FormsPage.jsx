import React, { useState, useEffect, useMemo } from "react";
import clsx from "clsx";
import { notifyError, notifySuccess } from "../../../utils/toast";
import { deleteItem } from "../../../utils/useDelete";
import ViewSchemaModal from "../modals/ViewSchemaModal";
import CreateSchemaModal from "../modals/CreateSchemaModal";
import EditSchemaModal from "../modals/EditSchemaModal";
import PreviewSchemaModal from "../modals/PreviewSchemaModal";

export default function FormsPage() {
    // Table state variables
    const [items, setItems] = useState([]);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalCount, setTotalCount] = useState(0);
    const [search, setSearch] = useState("");
    const [sortConfig, setSortConfig] = useState({ key: "created_at", direction: "desc" });
    const totalPages = Math.ceil(totalCount / pageSize) || 1;

    const columns = [
        { key: "id", label: "ID" },
        { key: "name", label: "Name" },
        { key: "created_by", label: "Created By" },
        { key: "created_at", label: "Created" },
        { key: "actions", label: "Actions", isAction: true },
    ];

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

    // Derived state and ref for table before fetching
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Modal state variables
    const [isCreationModalOpen, setIsCreatiodModalOpen] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [viewItem, setViewItem] = useState(null);
    const [editItem, setEditItem] = useState(null);

    // Reusable variables
    const apiUrl = "http://127.0.0.1:8000/api/v1/forms/";
    const token = localStorage.getItem("accessToken");
    const currentUser = localStorage.getItem("roles");
    const allowedRoles = ["admin", "editor"]; // Define roles that are allowed to perform certain actions

    // fetch data from API
    const fetchData = async (page, pageSize) => {
        setLoading(true);
        setError(null);

        try {
            const res = await fetch(`${apiUrl}?page=${page}&page_size=${pageSize}`, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

            const data = await res.json();

            // Filter out soft-deleted items
            setItems((data.results || []).filter((item) => !item.is_deleted));
            setTotalCount(data.count || 0);
        } catch (err) {
            setError(err.message);
            notifyError("Failed to fetch data. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // Initial fetch and periodic refresh every 5 minutes
    useEffect(() => {
        fetchData(page, pageSize); // always fetch when page or pageSize changes

        const interval = setInterval(() => fetchData(page, pageSize), 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [page, pageSize]);

    const handleSort = (key) => {
        setSortConfig((prev) => {
            if (prev.key === key) {
                return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
            }
            return { key, direction: "asc" };
        });
    };

    // -------------------------------
    // Derived data: filter + sort
    // -------------------------------
    const filteredItems = useMemo(() => {
        let data = [...items];

        // Search filter
        if (search.trim() !== "") {
            data = data.filter((item) => item.name.toLowerCase().includes(search.toLowerCase()));
        }

        // Sorting (applies only to currently fetched items)
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

    const renderSortArrow = (colKey) => {
        if (!sortConfig || sortConfig.key !== colKey) return null;
        return sortConfig.direction === "asc" ? " ▲" : " ▼";
    };

    // -------------------------------
    // CRUD Handlers
    // -------------------------------
    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const text = await file.text();
            const jsonData = JSON.parse(text);

            // Normalize single object into array
            const forms = Array.isArray(jsonData) ? jsonData : [jsonData];

            // Get created_by value from localStorage
            const createdBy = localStorage.getItem("id");
            if (!createdBy) throw new Error("No user ID found in localStorage under key 'id'");

            // -------------------------
            // Frontend Validation (optional but helps)
            // -------------------------
            for (const [i, form] of forms.entries()) {
                if (!form.name || !form.description || !Array.isArray(form.fields)) {
                    throw new Error(`Form at index ${i} is missing required keys (name, description, fields)`);
                }

                for (const [j, field] of form.fields.entries()) {
                    const requiredKeys = ["name", "label", "field_type", "required", "order"];
                    for (const key of requiredKeys) {
                        if (!(key in field)) {
                            throw new Error(`Field at index ${j} in form "${form.name}" is missing required key: ${key}`);
                        }
                    }
                }

                // Add created_by key
                form.created_by = createdBy;
            }

            // -------------------------
            // Send to API
            // -------------------------
            const res = await fetch(apiUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(forms),
            });

            const resData = await res.json().catch(() => ({}));

            if (!res.ok) {
                // Extract detailed DRF serializer errors
                if (typeof resData === "object" && resData !== null) {
                    const errors = Object.entries(resData)
                        .map(([key, val]) => {
                            if (Array.isArray(val)) return `${key}: ${val.join(", ")}`;
                            if (typeof val === "object") return `${key}: ${JSON.stringify(val)}`;
                            return `${key}: ${val}`;
                        })
                        .join("\n");
                    throw new Error(errors || `HTTP ${res.status}`);
                } else {
                    throw new Error(`HTTP ${res.status}`);
                }
            }

            await fetchData(page, pageSize);
            setIsUploadModalOpen(false);
        } catch (err) {
            console.error("JSON upload failed:", err);
            notifyError(`Failed to upload JSON: ${err.message}`);
        }
    };

    // Soft delete on user different at admin level
    const handleDelete = async (id) => {
        const success = await deleteItem(id, apiUrl, token, currentUser);
        if (success) {
            // Optimistically update UI
            setItems(items.filter((item) => item.id !== id));
        }
    };

    return (
        <div className='p-0 sm:p-4 lg:p-6 xl:p-8'>
            <h1 className='text-2xl sm:text-3xl lg:text-4xl font-bold mb-4'>Forms</h1>

            {/* Search, Create & Upload */}
            <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-2 sm:space-y-0'>
                <input
                    type='text'
                    placeholder='Search...'
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(1); // reset to first page on search
                    }}
                    className='w-full sm:w-1/3 border px-3 py-2 rounded'
                />
                {allowedRoles.includes(currentUser.toLowerCase()) && (
                    <div className='gap-2 flex flex-col sm:flex-row'>
                        <button
                            onClick={() => setIsCreatiodModalOpen(true)}
                            className='w-full sm:w-auto mt-2 sm:mt-0 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600'
                        >
                            + New Schema
                        </button>
                        <button
                            onClick={() => setIsUploadModalOpen(true)}
                            className='w-full sm:w-auto mt-2 sm:mt-0 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600'
                        >
                            + Upload JSON
                        </button>
                    </div>
                )}
            </div>

            {loading && <p>Loading...</p>}
            {error && <p className='text-red-500'>Error: {error}</p>}

            {/* Table */}
            {!loading && !error && (
                <div className='overflow-x-auto'>
                    <div className='hidden md:table w-full bg-white rounded shadow text-sm sm:text-base lg:text-lg'>
                        <table className='min-w-full'>
                            <thead className='bg-gray-200 text-left'>
                                <tr>
                                    {columns.map((col) => (
                                        <th
                                            key={col.key}
                                            className={`py-2 px-4${!col.isAction ? " cursor-pointer select-none" : ""}`}
                                            onClick={() => !col.isAction && handleSort && handleSort(col.key)}
                                        >
                                            {col.label}
                                            {!col.isAction && renderSortArrow(col.key)}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredItems.length > 0 ? (
                                    filteredItems.map((item) => (
                                        <tr key={item.id} className='border-t hover:bg-gray-50'>
                                            <td className='py-2 px-4'>{item.id}</td>
                                            <td className='py-2 px-4'>{item.name}</td>
                                            <td className='py-2 px-4'>{item.created_by}</td>
                                            <td className='py-2 px-4'>{new Date(item.created_at).toLocaleString()}</td>
                                            <td className='py-2 px-4 flex flex-wrap gap-2'>
                                                <button
                                                    className='px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600'
                                                    onClick={() => {
                                                        setViewItem(item);
                                                        setIsViewModalOpen(true);
                                                    }}
                                                >
                                                    Preview
                                                </button>
                                                <button
                                                    className='px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600'
                                                    onClick={() => {
                                                        setViewItem(item);
                                                        setIsViewModalOpen(true);
                                                    }}
                                                >
                                                    View
                                                </button>
                                                {allowedRoles.includes(currentUser.toLowerCase()) && (
                                                    <>
                                                        <button
                                                            className='px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600'
                                                            onClick={() => {
                                                                setEditItem(item);
                                                                setIsEditModalOpen(true);
                                                            }}
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            className='px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600'
                                                            onClick={() => handleDelete(item.id)}
                                                        >
                                                            Delete
                                                        </button>
                                                    </>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan='4' className='text-center py-4 text-gray-500 italic'>
                                            No items found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile-friendly stacked table */}
                    <div className='md:hidden flex flex-col gap-4'>
                        {filteredItems.length > 0 ? (
                            filteredItems.map((item) => (
                                <div key={item.id} className='bg-white shadow rounded p-4 flex flex-col gap-2'>
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
                                        <button
                                            className='px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600'
                                            onClick={() => {
                                                setViewItem(item);
                                                setIsViewModalOpen(true);
                                            }}
                                        >
                                            View
                                        </button>
                                        <button
                                            className='px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600'
                                            onClick={() => {
                                                setEditItem(item);
                                                setIsEditModalOpen(true);
                                            }}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            className='px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600'
                                            onClick={() => handleDelete(item.id)}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className='text-center py-4 text-gray-500 italic'>No items found.</div>
                        )}
                    </div>

                    {/* Pagination with Page Size Selector */}
                    <div className='flex flex-col sm:flex-row justify-between items-center mt-4 gap-4'>
                        {/* Page Size Selector */}
                        <div className='flex items-center gap-2'>
                            <label htmlFor='pageSize' className='text-sm bold'>
                                Items per page:
                            </label>
                            <select
                                id='pageSize'
                                value={pageSize}
                                onChange={(e) => {
                                    setPageSize(Number(e.target.value));
                                    setPage(1);
                                }}
                                className='border rounded px-2 py-1'
                            >
                                <option value={5}>5</option>
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                            </select>
                        </div>

                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <div className='flex justify-center items-center gap-2 flex-wrap'>
                                {/* Prev Button */}
                                <button
                                    className={clsx("px-3 py-1 rounded bg-gray-200 hover:bg-gray-300", {
                                        "opacity-50 cursor-not-allowed": page === 1,
                                    })}
                                    onClick={() => setPage((p) => Math.max(p - 1, 1))}
                                    disabled={page === 1}
                                >
                                    ←
                                </button>

                                {/* Page Numbers */}
                                {getPageNumbers(page, totalPages).map((p, idx) =>
                                    p === "..." ? (
                                        <span key={idx} className='px-2 py-1'>
                                            ...
                                        </span>
                                    ) : (
                                        <button
                                            key={idx}
                                            className={clsx(
                                                "px-3 py-1 rounded",
                                                p === page ? "bg-blue-500 text-white" : "bg-gray-200 hover:bg-gray-300"
                                            )}
                                            onClick={() => setPage(p)}
                                        >
                                            {p}
                                        </button>
                                    )
                                )}

                                {/* Next Button */}
                                <button
                                    className={clsx("px-3 py-1 rounded bg-gray-200 hover:bg-gray-300", {
                                        "opacity-50 cursor-not-allowed": page === totalPages,
                                    })}
                                    onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                                    disabled={page === totalPages}
                                >
                                    →
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* View Modal */}
            <ViewSchemaModal isViewModalOpen={isViewModalOpen} setIsViewModalOpen={setIsViewModalOpen} viewItem={viewItem} />

            {/* Create Schema Modal */}
            <CreateSchemaModal
                isCreationModalOpen={isCreationModalOpen}
                setIsCreationModalOpen={setIsCreatiodModalOpen}
                fetchData={fetchData}
                token={token}
            />

            {/* Edit Modal */}
            <EditSchemaModal
                isEditModalOpen={isEditModalOpen}
                setIsEditModalOpen={setIsEditModalOpen}
                editItem={editItem}
                fetchData={fetchData}
                page={page}
                pageSize={pageSize}
                token={token}
            />

            {/* Upload JSON Modal */}
            {isUploadModalOpen && (
                <div className='fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4'>
                    <div className='bg-white rounded-lg shadow-lg w-full max-w-md sm:max-w-lg lg:max-w-xl p-6'>
                        <h3 className='text-xl sm:text-2xl font-semibold mb-4'>Upload JSON</h3>
                        <input type='file' accept='application/JSON' onChange={handleFileUpload} className='w-full border rounded px-3 py-2' />
                        <div className='flex justify-end mt-4'>
                            <button onClick={() => setIsUploadModalOpen(false)} className='px-4 py-2 rounded border'>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
