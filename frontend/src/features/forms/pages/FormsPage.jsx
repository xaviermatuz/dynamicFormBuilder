import React, { useMemo, useState } from "react";
import { notifySuccess, notifyError } from "../../../utils/toast";
import { useDeleteItem } from "../../../hooks/api/useDelete";
import DataTable from "../../../common/components/DataTable";
import ViewSchemaModal from "../modals/ViewSchemaModal";
import CreateSchemaModal from "../modals/CreateSchemaModal";
import EditSchemaModal from "../modals/EditSchemaModal";
import PreviewSchemaModal from "../modals/PreviewSchemaModal";
import UploadSchemeModal from "../modals/UploadSchemaModal";
import { useAuth } from "../../../context/AuthContext";
import * as Tooltip from "@radix-ui/react-tooltip";
import { useApi } from "../../../hooks/api/useApi";
import {
    FileText,
    FilePlusIcon,
    ScanEyeIcon,
    SquareChartGanttIcon,
    PencilIcon,
    EraserIcon,
    ArchiveRestoreIcon,
    Trash2Icon,
    NotebookPenIcon,
    FileUpIcon,
} from "lucide-react";
import { useForms } from "../../../hooks/api/useForms";
import { uploadForms, restoreForm, deleteForm } from "../../../services/FormService";

export default function FormsPage() {
    const { user } = useAuth();
    const { request } = useApi();
    const { deleteItem } = useDeleteItem();

    const {
        items,
        setItems,
        search,
        setSearch,
        filterState,
        setFilterState,
        showAllVersions,
        setShowAllVersions,
        sortConfig,
        setSortConfig,
        loading,
        error,
        pagination,
        refetch,
    } = useForms(request, { user });

    const allowedRoles = ["admin", "editor"];

    // Modals
    const [isCreationModalOpen, setIsCreatiodModalOpen] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const [previewItem, setPreviewItem] = useState(null);
    const [viewItem, setViewItem] = useState(null);
    const [editItem, setEditItem] = useState(null);

    // Upload state
    const [isUploading, setIsUploading] = useState(false);
    const [uploadTime, setUploadTime] = useState(0);

    // Columns
    const baseColumns = [
        { key: "name", label: "Name" },
        { key: "created_at", label: "Created" },
        { key: "actions", label: "Actions", isAction: true },
    ];
    const adminColumns = [
        { key: "id", label: "ID" },
        { key: "version", label: "Version" },
        { key: "created_by", label: "Created By" },
    ];
    const columns = user?.roles?.includes("admin") ? [...baseColumns.slice(0, 2), ...adminColumns, ...baseColumns.slice(2)] : baseColumns;

    const searchableColumns = columns.filter((col) => !col.isAction).map((col) => col.key);

    const handleSort = (key) => {
        setSortConfig((prev) => {
            if (prev.key === key) {
                return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
            }
            return { key, direction: "asc" };
        });
    };

    // Derived data
    const filteredItems = useMemo(() => {
        let data = [...items];
        if (search.trim() !== "") {
            data = data.filter((item) =>
                searchableColumns.some((key) => {
                    const value = item[key];
                    return value && value.toString().toLowerCase().includes(search.toLowerCase());
                })
            );
        }
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

    const handleFileUpload = async (file) => {
        if (!file) return;

        setIsUploading(true);
        setUploadTime(0);

        const start = Date.now();
        const timer = setInterval(() => {
            setUploadTime(Math.floor((Date.now() - start) / 1000));
        }, 1000);

        try {
            const text = await file.text();
            const jsonData = JSON.parse(text);
            const forms = Array.isArray(jsonData) ? jsonData : [jsonData];

            await uploadForms(request, forms);
            notifySuccess("Forms uploaded successfully");
            setIsUploadModalOpen(false);
            refetch();
        } catch (err) {
            notifyError(`Failed to upload JSON: ${err.message}`);
        } finally {
            clearInterval(timer);
            setIsUploading(false);
        }
    };

    const handleDelete = async (id) => {
        const success = await deleteForm(deleteItem, id, user);
        if (success) {
            // setItems(items.filter((item) => item.id !== id));
            refetch();
        }
    };

    const handleRestore = async (id) => {
        try {
            await restoreForm(request, id);
            setItems((prev) => prev.map((item) => (item.id === id ? { ...item, is_deleted: false } : item)));
            setFilterState("active");
            refetch();
        } catch (err) {
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
                        selectable
                        columns={columns}
                        items={filteredItems}
                        pagination={pagination}
                        sorting={{
                            sortConfig,
                            onSort: handleSort,
                        }}
                        loading={loading}
                        error={error}
                        searchProps={{
                            searchable: true,
                            search,
                            setSearch,
                        }}
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
                                                    <FileUpIcon className='w-5 h-5' />
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
                        renderRow={(item, { isSelected, toggleRow }) => (
                            <tr key={item.id} className='border-t hover:bg-gray-50 text-center'>
                                <td className='py-2 px-4 text-center'>
                                    <input type='checkbox' checked={isSelected} onChange={toggleRow} />
                                </td>
                                <td className='py-2 px-4'>{item.name}</td>
                                <td className='py-2 px-4'>{new Date(item.created_at).toLocaleString()}</td>
                                {user.roles?.includes("admin") && (
                                    <>
                                        <td className='py-2 px-4'>{item.id}</td>
                                        <td className='py-2 px-4'>{item.version}</td>
                                        <td className='py-2 px-4'>{item.created_by}</td>
                                    </>
                                )}
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
                                    <span className='font-medium'>Name:</span> {item.name}
                                </div>
                                <div>
                                    <span className='font-medium'>Created:</span> {new Date(item.created_at).toLocaleString()}
                                </div>
                                <div className='flex flex-wrap gap-2 mt-2'>
                                    {/* Preview */}
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

                <PreviewSchemaModal isPreviewOpen={isPreviewOpen} setIsPreviewOpen={setIsPreviewOpen} viewItem={previewItem} user={user} />
                <ViewSchemaModal isViewModalOpen={isViewModalOpen} setIsViewModalOpen={setIsViewModalOpen} schema={viewItem} />
                <CreateSchemaModal
                    isOpen={isCreationModalOpen}
                    onClose={() => setIsCreatiodModalOpen(false)}
                    onSave={async (payload) => {
                        await uploadForms(request, payload);
                        notifySuccess("Form created.");
                        refetch();
                    }}
                />

                <EditSchemaModal isEditModalOpen={isEditModalOpen} setIsEditModalOpen={setIsEditModalOpen} editItem={editItem} />
                <UploadSchemeModal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} onUpload={handleFileUpload} />
            </div>
        </Tooltip.Provider>
    );
}
