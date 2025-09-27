import React, { useState, useEffect, useMemo } from "react";
import { notifyError } from "../../../utils/toast";
import { useDeleteItem } from "../../../hooks/api/useDelete";
import DataTable from "../../../common/components/DataTable";
import ViewSchemaModal from "../modals/ViewSchemaModal";
import CreateSchemaModal from "../modals/CreateSchemaModal";
import EditSchemaModal from "../modals/EditSchemaModal";
import PreviewSchemaModal from "../modals/PreviewSchemaModal";
import { useAuth } from "../../../context/AuthContext";
import * as Tooltip from "@radix-ui/react-tooltip";
import { useApi } from "../../../hooks/api/useApi";
import {
    FileText,
    FilePlusIcon,
    FileInputIcon,
    ScanEyeIcon,
    SquareChartGanttIcon,
    PencilIcon,
    EraserIcon,
    ArchiveRestoreIcon,
    Trash2Icon,
    NotebookPenIcon,
} from "lucide-react";

export default function FormsPage() {
    // Reusable variables
    const endpoint = "/forms/";
    const token = localStorage.getItem("accessToken");
    const { user } = useAuth();
    const allowedRoles = ["admin", "editor"]; // Define roles that are allowed to perform certain actions

    const [isUploading, setIsUploading] = useState(false);
    const [uploadTime, setUploadTime] = useState(0);

    // Table state variables
    const [items, setItems] = useState([]);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalCount, setTotalCount] = useState(0);

    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [sortConfig, setSortConfig] = useState({ key: "created_at", direction: "desc" });
    const [filterState, setFilterState] = useState(() => {
        return localStorage.getItem("filterState") || "active";
    });

    const [showAllVersions, setShowAllVersions] = useState(false);

    const { deleteItem } = useDeleteItem();
    const { request, loading, error } = useApi();

    const baseColumns = [
        { key: "id", label: "ID" },
        { key: "name", label: "Name" },
        { key: "created_at", label: "Created" },
        { key: "actions", label: "Actions", isAction: true },
    ];

    const adminColumns = [
        { key: "version", label: "Version" },
        { key: "created_by", label: "Created By" },
    ];
    const columns = user?.roles?.includes("admin") ? [...baseColumns.slice(0, 2), ...adminColumns, ...baseColumns.slice(2)] : baseColumns;

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

    // Modal state variables
    const [isCreationModalOpen, setIsCreatiodModalOpen] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const [previewItem, setPreviewItem] = useState(null);
    const [viewItem, setViewItem] = useState(null);
    const [editItem, setEditItem] = useState(null);

    // Debounce effect: update debouncedSearch after delay
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1); // reset to first page whenever a new search starts
        }, 1200);

        return () => clearTimeout(handler);
    }, [search]);

    // fetch data
    const fetchData = async (currentPage = page, currentPageSize = pageSize, searchTerm = debouncedSearch, showAllVersions) => {
        // Agrega el parámetro show_deleted si el usuario es admin y el filtro está activo
        let url = `/forms/?page=${currentPage}&page_size=${currentPageSize}&search=${encodeURIComponent(searchTerm)}`;

        if (user?.roles?.includes("admin")) {
            url += `&state=${filterState}`;
        }

        // Add toggle to show all versions
        if (showAllVersions) {
            url += `&latest_only=false`;
        }

        try {
            const res = await request({
                endpoint: url,
            });

            setItems(res.results || []);
            setTotalCount(res.count || 0);
        } catch (err) {
            setError(err.message);
            notifyError("Failed to fetch forms. Please try again.");
        }
    };

    // Fetch on page/pageSize/search changes
    useEffect(() => {
        localStorage.setItem("filterState", filterState);

        fetchData(page, pageSize, debouncedSearch, showAllVersions);

        // Auto-refresh every 5 minutes
        const interval = setInterval(() => fetchData(page, pageSize, debouncedSearch), 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [page, pageSize, debouncedSearch, filterState, showAllVersions]);

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

    // -------------------------------
    // CRUD Handlers
    // -------------------------------
    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsUploading(true);
        setUploadTime(0);

        // Start timer
        const start = Date.now();
        const timer = setInterval(() => {
            setUploadTime(Math.floor((Date.now() - start) / 1000));
        }, 1000);

        try {
            const text = await file.text();
            const jsonData = JSON.parse(text);

            // Normalize single object into array
            const forms = Array.isArray(jsonData) ? jsonData : [jsonData];

            // Get created_by value from localStorage
            const createdBy = user.id;
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
                // form.created_by = createdBy;
            }

            // -------------------------
            // Send to API
            // -------------------------
            await request({
                endpoint: `/forms/`,
                method: "POST",
                body: forms,
            });

            await fetchData(page, pageSize);
            setIsUploadModalOpen(false);
        } catch (err) {
            console.error("JSON upload failed:", err);
            notifyError(`Failed to upload JSON: ${err.message}`);
        } finally {
            clearInterval(timer);
            setIsUploading(false);
        }
    };

    // Soft delete on user different at admin level
    const handleDelete = async (id) => {
        const success = await deleteItem("forms", id, user);
        if (success) {
            // Optimistically update UI
            setItems(items.filter((item) => item.id !== id));
        }
    };

    const handleRestore = async (id) => {
        try {
            await request({
                endpoint: `/forms/${id}/`,
                method: "PATCH",
                body: { is_deleted: false },
            });

            // Refresh table
            setItems((prevItems) => prevItems.map((item) => (item.id === id ? { ...item, is_deleted: false } : item)));
            setFilterState("active");
        } catch (err) {
            console.error("Restore failed:", err);
            notifyError("Failed to restore item.");
        }
    };

    return (
        <Tooltip.Provider delayDuration={200}>
            <div className='p-2 sm:p-4 lg:p-6 xl:p-8'>
                <h1 className='text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold mb-4 flex items-center gap-2'>
                    <FileText className='w-6 h-6' />
                    Forms
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
                        optionsMenu={
                            <>
                                {user && allowedRoles.some((role) => user.roles?.includes(role)) && (
                                    <div className='flex flex-row flex-wrap justify-center sm:justify-start gap-3'>
                                        {/* Create */}
                                        <Tooltip.Root>
                                            <Tooltip.Trigger asChild>
                                                <button
                                                    onClick={() => setIsCreatiodModalOpen(true)}
                                                    className='flex items-center justify-center bg-green-500 text-white rounded hover:bg-green-600
                           w-10 h-10 sm:w-auto sm:h-auto sm:px-4 sm:py-2'
                                                >
                                                    <FilePlusIcon className='w-5 h-5' />
                                                    <span className='hidden sm:inline ml-2'>Create</span>
                                                </button>
                                            </Tooltip.Trigger>
                                            <Tooltip.Content className='bg-gray-800 text-white text-xs rounded px-2 py-1 shadow-md'>
                                                Create a new schema
                                                <Tooltip.Arrow className='fill-gray-800' />
                                            </Tooltip.Content>
                                        </Tooltip.Root>

                                        {/* Upload */}
                                        <Tooltip.Root>
                                            <Tooltip.Trigger asChild>
                                                <button
                                                    onClick={() => setIsUploadModalOpen(true)}
                                                    className='flex items-center justify-center bg-blue-500 text-white rounded hover:bg-blue-600
                           w-10 h-10 sm:w-auto sm:h-auto sm:px-4 sm:py-2'
                                                >
                                                    <FileInputIcon className='w-5 h-5' />
                                                    <span className='hidden sm:inline ml-2'>Upload</span>
                                                </button>
                                            </Tooltip.Trigger>
                                            <Tooltip.Content className='bg-gray-800 text-white text-xs rounded px-2 py-1 shadow-md'>
                                                Upload JSON schema file
                                                <Tooltip.Arrow className='fill-gray-800' />
                                            </Tooltip.Content>
                                        </Tooltip.Root>

                                        {user && user.roles?.includes("admin") && (
                                            <>
                                                <div className='flex items-center gap-2'>
                                                    <label htmlFor='stateFilter' className='text-sm font-medium'>
                                                        Show:
                                                    </label>
                                                    <select
                                                        id='stateFilter'
                                                        value={filterState}
                                                        onChange={(e) => setFilterState(e.target.value)}
                                                        className='border rounded px-2 py-1'
                                                    >
                                                        <option value='active'>Active Only</option>
                                                        <option value='deleted'>Deleted Only</option>
                                                        <option value='all'>All Forms</option>
                                                    </select>
                                                </div>
                                                <div className='flex items-center gap-2'>
                                                    <label className='flex items-center text-sm font-medium gap-2'>
                                                        <input
                                                            type='checkbox'
                                                            checked={showAllVersions}
                                                            onChange={(e) => {
                                                                setShowAllVersions(e.target.checked);
                                                                setPage(1); // reset pagination
                                                            }}
                                                            className='h-4 w-4'
                                                        />
                                                        Show all versions
                                                    </label>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}
                            </>
                        }
                        renderRow={(item) => (
                            <tr key={item.id} className='border-t hover:bg-gray-50 text-center'>
                                <td className='py-2 px-4'>{item.id}</td>
                                <td className='py-2 px-4'>{item.name}</td>
                                {user.roles?.includes("admin") && (
                                    <>
                                        <td className='py-2 px-4'>{item.version}</td>
                                        <td className='py-2 px-4'>{item.created_by}</td>
                                    </>
                                )}
                                <td className='py-2 px-4'>{new Date(item.created_at).toLocaleString()}</td>
                                <td className='py-2 px-4 flex flex-wrap gap-1 justify-center'>
                                    {user.roles?.includes("viewer") ? (
                                        <Tooltip.Root>
                                            <Tooltip.Trigger asChild>
                                                <button
                                                    className='px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600'
                                                    onClick={() => {
                                                        setPreviewItem(item);
                                                        setIsPreviewOpen(true);
                                                    }}
                                                >
                                                    <NotebookPenIcon />
                                                </button>
                                            </Tooltip.Trigger>
                                            <Tooltip.Content className='bg-gray-800 text-white text-xs rounded px-2 py-1 shadow-md'>
                                                Fill this form
                                                <Tooltip.Arrow className='fill-gray-800' />
                                            </Tooltip.Content>
                                        </Tooltip.Root>
                                    ) : (
                                        <>
                                            <Tooltip.Root>
                                                <Tooltip.Trigger asChild>
                                                    <button
                                                        className='px-2 py-1 bg-slate-500 text-white rounded hover:bg-slate-600'
                                                        onClick={() => {
                                                            setPreviewItem(item);
                                                            setIsPreviewOpen(true);
                                                        }}
                                                    >
                                                        <SquareChartGanttIcon></SquareChartGanttIcon>
                                                    </button>
                                                </Tooltip.Trigger>
                                                <Tooltip.Content className='bg-gray-800 text-white text-xs rounded px-2 py-1 shadow-md'>
                                                    Preview this form
                                                    <Tooltip.Arrow className='fill-gray-800' />
                                                </Tooltip.Content>
                                            </Tooltip.Root>
                                            <Tooltip.Root>
                                                <Tooltip.Trigger asChild>
                                                    <button
                                                        className='px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600'
                                                        onClick={() => {
                                                            setViewItem(item);
                                                            setIsViewModalOpen(true);
                                                        }}
                                                    >
                                                        <ScanEyeIcon></ScanEyeIcon>
                                                    </button>
                                                </Tooltip.Trigger>
                                                <Tooltip.Content className='bg-gray-800 text-white text-xs rounded px-2 py-1 shadow-md'>
                                                    View form details
                                                    <Tooltip.Arrow className='fill-gray-800' />
                                                </Tooltip.Content>
                                            </Tooltip.Root>
                                        </>
                                    )}

                                    {user && allowedRoles.some((role) => user.roles?.includes(role)) && (
                                        <>
                                            {!item.is_deleted ? (
                                                <>
                                                    <Tooltip.Root>
                                                        <Tooltip.Trigger asChild>
                                                            <button
                                                                className='px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600'
                                                                onClick={() => {
                                                                    setEditItem(item);
                                                                    setIsEditModalOpen(true);
                                                                }}
                                                            >
                                                                <PencilIcon></PencilIcon>
                                                            </button>
                                                        </Tooltip.Trigger>
                                                        <Tooltip.Content className='bg-gray-800 text-white text-xs rounded px-2 py-1 shadow-md'>
                                                            Edit this form
                                                            <Tooltip.Arrow className='fill-gray-800' />
                                                        </Tooltip.Content>
                                                    </Tooltip.Root>
                                                    <Tooltip.Root>
                                                        <Tooltip.Trigger asChild>
                                                            <button
                                                                className='px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600'
                                                                onClick={() => handleDelete(item.id)}
                                                            >
                                                                {user.roles?.includes("admin") ? <Trash2Icon /> : <EraserIcon />}
                                                            </button>
                                                        </Tooltip.Trigger>
                                                        <Tooltip.Content className='bg-gray-800 text-white text-xs rounded px-2 py-1 shadow-md'>
                                                            Delete this form
                                                            <Tooltip.Arrow className='fill-gray-800' />
                                                        </Tooltip.Content>
                                                    </Tooltip.Root>
                                                </>
                                            ) : (
                                                user.roles?.includes("admin") && (
                                                    <>
                                                        <Tooltip.Root>
                                                            <Tooltip.Trigger asChild>
                                                                <button
                                                                    className='px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600'
                                                                    onClick={() => handleRestore(item.id)}
                                                                >
                                                                    <ArchiveRestoreIcon></ArchiveRestoreIcon>
                                                                </button>
                                                            </Tooltip.Trigger>
                                                            <Tooltip.Content className='bg-gray-800 text-white text-xs rounded px-2 py-1 shadow-md'>
                                                                Restore this form
                                                                <Tooltip.Arrow className='fill-gray-800' />
                                                            </Tooltip.Content>
                                                        </Tooltip.Root>
                                                        <Tooltip.Root>
                                                            <Tooltip.Trigger asChild>
                                                                <button
                                                                    className='px-2 py-1 bg-red-700 text-white rounded hover:bg-red-800'
                                                                    onClick={() => handleDelete(item.id)}
                                                                >
                                                                    <Trash2Icon></Trash2Icon>
                                                                </button>
                                                            </Tooltip.Trigger>
                                                            <Tooltip.Content className='bg-gray-800 text-white text-xs rounded px-2 py-1 shadow-md'>
                                                                Permanently delete this form
                                                                <Tooltip.Arrow className='fill-gray-800' />
                                                            </Tooltip.Content>
                                                        </Tooltip.Root>
                                                    </>
                                                )
                                            )}
                                        </>
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
                                    {/* Preview */}
                                    <Tooltip.Root>
                                        <Tooltip.Trigger asChild>
                                            <button
                                                className='px-2 py-1 bg-slate-500 text-white rounded hover:bg-slate-600'
                                                onClick={() => {
                                                    setPreviewItem(item);
                                                    setIsPreviewOpen(true);
                                                }}
                                            >
                                                <SquareChartGanttIcon />
                                            </button>
                                        </Tooltip.Trigger>
                                        <Tooltip.Content className='bg-gray-800 text-white text-xs rounded px-2 py-1 shadow-md'>
                                            Preview this form
                                            <Tooltip.Arrow className='fill-gray-800' />
                                        </Tooltip.Content>
                                    </Tooltip.Root>

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

                                    {/* Role-based actions */}
                                    {user && allowedRoles.some((role) => user.roles?.includes(role)) && (
                                        <>
                                            {!item.is_deleted ? (
                                                <>
                                                    {/* Edit */}
                                                    <Tooltip.Root>
                                                        <Tooltip.Trigger asChild>
                                                            <button
                                                                className='px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600'
                                                                onClick={() => {
                                                                    setEditItem(item);
                                                                    setIsEditModalOpen(true);
                                                                }}
                                                            >
                                                                <PencilIcon />
                                                            </button>
                                                        </Tooltip.Trigger>
                                                        <Tooltip.Content className='bg-gray-800 text-white text-xs rounded px-2 py-1 shadow-md'>
                                                            Edit this form
                                                            <Tooltip.Arrow className='fill-gray-800' />
                                                        </Tooltip.Content>
                                                    </Tooltip.Root>

                                                    {/* Delete */}
                                                    <Tooltip.Root>
                                                        <Tooltip.Trigger asChild>
                                                            <button
                                                                className='px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600'
                                                                onClick={() => handleDelete(item.id)}
                                                            >
                                                                <EraserIcon />
                                                            </button>
                                                        </Tooltip.Trigger>
                                                        <Tooltip.Content className='bg-gray-800 text-white text-xs rounded px-2 py-1 shadow-md'>
                                                            Delete this form
                                                            <Tooltip.Arrow className='fill-gray-800' />
                                                        </Tooltip.Content>
                                                    </Tooltip.Root>
                                                </>
                                            ) : (
                                                user.roles?.includes("admin") && (
                                                    <>
                                                        {/* Restore */}
                                                        <Tooltip.Root>
                                                            <Tooltip.Trigger asChild>
                                                                <button
                                                                    className='px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600'
                                                                    onClick={() => handleRestore(item.id)}
                                                                >
                                                                    <ArchiveRestoreIcon />
                                                                </button>
                                                            </Tooltip.Trigger>
                                                            <Tooltip.Content className='bg-gray-800 text-white text-xs rounded px-2 py-1 shadow-md'>
                                                                Restore this form
                                                                <Tooltip.Arrow className='fill-gray-800' />
                                                            </Tooltip.Content>
                                                        </Tooltip.Root>

                                                        {/* Permanent Delete */}
                                                        <Tooltip.Root>
                                                            <Tooltip.Trigger asChild>
                                                                <button
                                                                    className='px-2 py-1 bg-red-700 text-white rounded hover:bg-red-800'
                                                                    onClick={() => handleDelete(item.id)}
                                                                >
                                                                    <Trash2Icon />
                                                                </button>
                                                            </Tooltip.Trigger>
                                                            <Tooltip.Content className='bg-gray-800 text-white text-xs rounded px-2 py-1 shadow-md'>
                                                                Permanently delete this form
                                                                <Tooltip.Arrow className='fill-gray-800' />
                                                            </Tooltip.Content>
                                                        </Tooltip.Root>
                                                    </>
                                                )
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    />
                </div>

                {/* Preview Modal */}
                <PreviewSchemaModal
                    isPreviewOpen={isPreviewOpen}
                    setIsPreviewOpen={setIsPreviewOpen}
                    viewItem={previewItem}
                    user={user}
                    token={token}
                />

                {/* View Modal */}
                <ViewSchemaModal isViewModalOpen={isViewModalOpen} setIsViewModalOpen={setIsViewModalOpen} viewItem={viewItem} />

                {/* Create Schema Modal */}
                <CreateSchemaModal isCreationModalOpen={isCreationModalOpen} setIsCreationModalOpen={setIsCreatiodModalOpen} fetchData={fetchData} />

                {/* Edit Modal */}
                <EditSchemaModal
                    isEditModalOpen={isEditModalOpen}
                    setIsEditModalOpen={setIsEditModalOpen}
                    editItem={editItem}
                    fetchData={fetchData}
                    page={page}
                    pageSize={pageSize}
                />

                {/* Upload JSON Modal */}
                {isUploadModalOpen && (
                    <div className='fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4'>
                        <div className='bg-white rounded-lg shadow-lg w-full max-w-md sm:max-w-lg lg:max-w-xl p-6'>
                            <h3 className='text-xl sm:text-2xl font-semibold mb-4'>Upload JSON</h3>
                            {isUploading ? (
                                <div className='flex flex-col items-center justify-center space-y-2 py-6'>
                                    <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500'></div>
                                    <p className='text-gray-600 text-sm'>Uploading... {uploadTime}s elapsed</p>
                                </div>
                            ) : (
                                <>
                                    <input
                                        type='file'
                                        accept='application/JSON'
                                        onChange={handleFileUpload}
                                        className='w-full border rounded px-3 py-2'
                                    />
                                    <div className='flex justify-end mt-4'>
                                        <button onClick={() => setIsUploadModalOpen(false)} className='px-4 py-2 rounded border'>
                                            Cancel
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </Tooltip.Provider>
    );
}
