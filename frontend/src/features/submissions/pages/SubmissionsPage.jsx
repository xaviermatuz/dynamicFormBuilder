import React, { useState } from "react";
import * as Tooltip from "@radix-ui/react-tooltip";
import DataTable from "../../../common/components/DataTable";
import ViewSubmissionModal from "../modals/ViewSubmissionModal";
import { useAuth } from "../../../context/AuthContext";
import { FileUp } from "lucide-react";
import { useApi } from "../../../hooks/api/useApi";
import { useDeleteItem } from "../../../hooks/api/useDelete";
import { useSubmissions } from "../../../hooks/api/useSubmissions";
import { SubmissionRow } from "../../../common/components/SubmissionRow";

export default function SubmissionsPage({ formId }) {
    const { user } = useAuth();
    const { request } = useApi();
    const { deleteItem } = useDeleteItem();

    const { items, setItems, search, setSearch, sortConfig, setSortConfig, loading, error, pagination } = useSubmissions(request, { formId });

    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [viewItem, setViewItem] = useState(null);

    const columns = user?.roles?.includes("admin")
        ? [
              { key: "id", label: "ID" },
              { key: "form", label: "Form ID" },
              { key: "form_name", label: "Form" },
              { key: "form_version", label: "Version" },
              { key: "submitted_by", label: "Submitted By" },
              { key: "submitted_at", label: "Submitted At" },
              { key: "actions", label: "Actions", isAction: true },
          ]
        : [
              { key: "form_name", label: "Form" },
              { key: "submitted_at", label: "Submitted At" },
              { key: "actions", label: "Actions", isAction: true },
          ];

    const handleSort = (key) => {
        setSortConfig((prev) => {
            if (prev.key === key) {
                return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
            }
            return { key, direction: "asc" };
        });
    };

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

                <DataTable
                    columns={columns}
                    items={items}
                    pagination={pagination}
                    sorting={{ sortConfig, onSort: handleSort }}
                    searchProps={{ search, setSearch, searchable: true }}
                    loading={loading}
                    error={error}
                    renderRow={(item) => (
                        <SubmissionRow
                            key={item.id}
                            item={item}
                            user={user}
                            onView={(item) => {
                                setViewItem(item);
                                setIsViewModalOpen(true);
                            }}
                            onDelete={handleDelete}
                            variant='table'
                        />
                    )}
                    renderMobileRow={(item) => (
                        <SubmissionRow
                            key={item.id}
                            item={item}
                            user={user}
                            onView={(item) => {
                                setViewItem(item);
                                setIsViewModalOpen(true);
                            }}
                            onDelete={handleDelete}
                            variant='card'
                        />
                    )}
                />

                <ViewSubmissionModal isViewModalOpen={isViewModalOpen} setIsViewModalOpen={setIsViewModalOpen} viewItem={viewItem} user={user} />
            </div>
        </Tooltip.Provider>
    );
}
