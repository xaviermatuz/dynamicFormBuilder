import React, { useState, useEffect, useMemo } from "react";
import { useDeleteItem } from "../../../hooks/api/useDelete";
import CreateUserModal from "../modals/CreateUserModal";
import EditUserModal from "../modals/EditUserModal";
import { useAuth } from "../../../context/AuthContext";
import * as Tooltip from "@radix-ui/react-tooltip";
import { Users, UserRoundPlusIcon } from "lucide-react";
import DataTable from "../../../common/components/DataTable";
import { useApi } from "../../../hooks/api/useApi";
import { useUsers } from "../../../hooks/api/useUsers";
import { UserRow } from "../../../common/components/UserRow";
import StateFilterDropdown from "../../../common/components/stateFilterDropdown";

export default function UsersPage() {
    const { user } = useAuth();
    const { deleteItem } = useDeleteItem();
    const { request } = useApi();
    const { items, setItems, search, setSearch, filterState, setFilterState, sortConfig, setSortConfig, loading, error, pagination, fetchData } =
        useUsers(request, { user });

    // Modal state
    const [isCreationModalOpen, setIsCreatiodModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editItem, setEditItem] = useState(null);

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

    const handleDelete = async (id) => {
        const success = await deleteItem("users", id, user);
        if (success) fetchData();
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
                        pagination={pagination}
                        searchProps={{
                            search,
                            setSearch,
                        }}
                        sorting={{
                            sortConfig,
                            onSort: handleSort,
                        }}
                        loading={loading}
                        error={error}
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
                                            <StateFilterDropdown
                                                filterState={filterState}
                                                setFilterState={setFilterState}
                                                storageKey='filterState'
                                                labelText='Filter:'
                                                options={[
                                                    { value: "active", label: "Active Only" },
                                                    { value: "deleted", label: "Inactive Only" },
                                                    { value: "all", label: "All" },
                                                ]}
                                            />
                                        </div>
                                    </>
                                )}
                            </>
                        }
                        renderRow={(item) => (
                            <UserRow
                                key={item.id}
                                item={item}
                                user={user}
                                onDelete={handleDelete}
                                onEdit={(item) => {
                                    setEditItem(item);
                                    setIsEditModalOpen(true);
                                }}
                                variant='table'
                            />
                        )}
                        renderMobileRow={(item) => (
                            <UserRow
                                key={item.id}
                                item={item}
                                user={user}
                                onDelete={handleDelete}
                                onEdit={(item) => {
                                    setEditItem(item);
                                    setIsEditModalOpen(true);
                                }}
                                variant='card'
                            />
                        )}
                    />
                </div>

                {/* Modals */}
                <CreateUserModal isCreationModalOpen={isCreationModalOpen} setIsCreationModalOpen={setIsCreatiodModalOpen} fetchData={fetchData} />
                <EditUserModal isEditModalOpen={isEditModalOpen} setIsEditModalOpen={setIsEditModalOpen} editItem={editItem} fetchData={fetchData} />
            </div>
        </Tooltip.Provider>
    );
}
