import React, { useState, useEffect, useMemo } from "react";
import { notifyError } from "../../../utils/toast";
import { useDeleteItem } from "../../../hooks/api/useDelete";
import CreateUserModal from "../modals/CreateUserModal";
import EditUserModal from "../modals/EditUserModal";
import { useAuth } from "../../../context/AuthContext";
import * as Tooltip from "@radix-ui/react-tooltip";
import { Users, EraserIcon, UserRoundPenIcon, UserRoundPlusIcon } from "lucide-react";
import DataTable from "../../../common/components/DataTable";
import { useApi } from "../../../hooks/api/useApi";

export default function UsersPage() {
    const { user } = useAuth();
    const { deleteItem } = useDeleteItem();
    const { request, loading, error } = useApi();

    // Table state variables
    const [items, setItems] = useState([]);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalCount, setTotalCount] = useState(0);
    const effectiveTotal = totalCount;

    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [sortConfig, setSortConfig] = useState({ key: "is_active", direction: "desc" });
    const [filterState, setFilterState] = useState(() => {
        return localStorage.getItem("filterState") || "active";
    });

    const columns = [
        { key: "id", label: "ID" },
        { key: "username", label: "Username" },
        { key: "email", label: "Email" },
        { key: "role", label: "Role" },
        { key: "is_active", label: "Status" },
        { key: "last_login", label: "Last connection" },
        { key: "actions", label: "Actions", isAction: true },
    ];

    const searchableColumns = columns.filter((col) => !col.isAction).map((col) => col.key);

    const getPageNumbers = (current, total) => {
        const pages = [];
        if (total <= 7) {
            for (let i = 1; i <= total; i++) pages.push(i);
        } else {
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

    // Modal state
    const [isCreationModalOpen, setIsCreatiodModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editItem, setEditItem] = useState(null);

    // Debounce effect: update debouncedSearch after delay
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1);
        }, 1200);
        return () => clearTimeout(handler);
    }, [search]);

    // Fetch data
    const fetchData = async (currentPage = page, currentPageSize = pageSize, searchTerm = debouncedSearch) => {
        // Agrega el parámetro is_active si el usuario es admin y el filtro está activo
        let url = `/users/?page=${currentPage}&page_size=${currentPageSize}&search=${encodeURIComponent(searchTerm)}`;
        if (user?.roles?.includes("admin")) {
            if (filterState === "active") {
                url += `&is_active=true`;
            } else if (filterState === "deleted") {
                url += `&is_active=false`;
            }
            // "all" , no filter
        }

        try {
            const res = await request({
                endpoint: url,
            });

            setItems(res.results || []);
            setTotalCount(res.count || 0);
        } catch (err) {
            console.log(err);
            notifyError("Failed to fetch data: " + err);
        }
    };

    // Fetch on page/pageSize/search changes
    useEffect(() => {
        localStorage.setItem("filterState", filterState);

        fetchData(page, pageSize, debouncedSearch);

        // Auto-refresh every 5 minutes
        const interval = setInterval(() => fetchData(page, pageSize, debouncedSearch), 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [page, pageSize, debouncedSearch, filterState]);

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
        const success = await deleteItem("users", id, user);
        if (success) {
            setItems(items.filter((item) => item.id !== id));
        }
    };

    return (
        <Tooltip.Provider delayDuration={200}>
            <div className='p-2 sm:p-4 lg:p-6 xl:p-8'>
                <h1 className='text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold mb-4 flex items-center gap-2'>
                    <Users className='w-6 h-6' />
                    Users
                </h1>

                <div className='relative overflow-x-auto'>
                    <DataTable
                        columns={columns}
                        items={filteredItems}
                        page={page}
                        setPage={setPage}
                        pageSize={pageSize}
                        setPageSize={setPageSize}
                        totalCount={effectiveTotal}
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
                                {user?.roles?.includes("admin") && (
                                    <>
                                        <div className='flex flex-row flex-wrap justify-center sm:justify-start gap-3'>
                                            <Tooltip.Root>
                                                <Tooltip.Trigger asChild>
                                                    <button
                                                        onClick={() => setIsCreatiodModalOpen(true)}
                                                        className='flex items-center justify-center bg-green-500 text-white rounded hover:bg-green-600
                           w-10 h-10 sm:w-auto sm:h-auto sm:px-4 sm:py-2'
                                                    >
                                                        <UserRoundPlusIcon className='w-5 h-5' />
                                                    </button>
                                                </Tooltip.Trigger>
                                                <Tooltip.Content className='bg-gray-800 text-white text-xs rounded px-2 py-1 shadow-md'>
                                                    Create a new user
                                                    <Tooltip.Arrow className='fill-gray-800' />
                                                </Tooltip.Content>
                                            </Tooltip.Root>
                                        </div>
                                        <div className='flex items-center gap-2'>
                                            <label htmlFor='stateFilter' className='text-sm font-medium'>
                                                Filter:
                                            </label>
                                            <select
                                                id='stateFilter'
                                                value={filterState}
                                                onChange={(e) => setFilterState(e.target.value)}
                                                className='border rounded px-2 py-1'
                                            >
                                                <option value='active'>Active Only</option>
                                                <option value='deleted'>Inactive Only</option>
                                                <option value='all'>All</option>
                                            </select>
                                        </div>
                                    </>
                                )}
                            </>
                        }
                        renderRow={(item) => (
                            <tr key={item.id} className='border-t hover:bg-gray-50 text-center'>
                                <td className='py-2 px-4'>{item.id}</td>
                                <td className='py-2 px-4 capitalize'>{item.username}</td>
                                <td className='py-2 px-4'>{item.email}</td>
                                <td className='py-2 px-4'>{item.role}</td>
                                <td className='py-2 px-4'>
                                    {item.is_active ? (
                                        <span className='bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold'>Active</span>
                                    ) : (
                                        <span className='bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-bold'>Inactive</span>
                                    )}
                                </td>

                                <td className='py-2 px-4'>
                                    {item.last_login && !isNaN(new Date(item.last_login)) ? new Date(item.last_login).toLocaleString() : "None"}
                                </td>
                                <td className='py-2 px-4 flex flex-wrap gap-1 justify-center'>
                                    {user?.roles?.includes("admin") && (
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
                                                        <UserRoundPenIcon />
                                                    </button>
                                                </Tooltip.Trigger>
                                                <Tooltip.Content className='bg-gray-800 text-white text-xs rounded px-2 py-1 shadow-md'>
                                                    Edit this user
                                                    <Tooltip.Arrow className='fill-gray-800' />
                                                </Tooltip.Content>
                                            </Tooltip.Root>
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
                                                    Delete this user
                                                    <Tooltip.Arrow className='fill-gray-800' />
                                                </Tooltip.Content>
                                            </Tooltip.Root>
                                        </>
                                    )}
                                </td>
                            </tr>
                        )}
                        renderMobileRow={(item) => (
                            <div key={item.id} className='bg-white shadow rounded p-4 flex flex-col gap-2 text-sm sm:text-base'>
                                <div>
                                    <span className='font-medium'>Username:</span> {item.username}
                                </div>
                                <div>
                                    <span className='font-medium'>Email:</span> {item.email}
                                </div>
                                <div>
                                    <span className='font-medium'>Role:</span> {item.role}
                                </div>
                                <div>
                                    <span className='font-medium'>Status:</span> {item.is_active ? "Active" : "Inactive"}
                                </div>
                                <div>
                                    <span className='font-medium'>Last login:</span>{" "}
                                    {item.last_login && !isNaN(new Date(item.last_login)) ? new Date(item.last_login).toLocaleString() : "None"}
                                </div>
                                {user?.roles?.includes("admin") && (
                                    <div className='flex flex-wrap gap-2 mt-2'>
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
                                )}
                            </div>
                        )}
                    />
                </div>

                {/* Modals */}
                <CreateUserModal isCreationModalOpen={isCreationModalOpen} setIsCreationModalOpen={setIsCreatiodModalOpen} fetchData={fetchData} />
                <EditUserModal
                    isEditModalOpen={isEditModalOpen}
                    setIsEditModalOpen={setIsEditModalOpen}
                    editItem={editItem}
                    fetchData={fetchData}
                    page={page}
                    pageSize={pageSize}
                />
            </div>
        </Tooltip.Provider>
    );
}
