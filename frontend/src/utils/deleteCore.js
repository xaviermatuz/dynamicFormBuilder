import { showAlert } from "./SwalWrapper";
import { notifyError } from "./toast";
import { useApi } from "../hooks/api/useApi";

const deleteStrategies = {
    admin: {
        method: "DELETE",
        body: null,
        successMsg: "The item has been permanently deleted.",
        confirmMsg: "This will permanently delete the item.",
    },
    default: {
        method: "PATCH",
        body: { is_deleted: true },
        successMsg: "The item has been mark as deleted.",
        confirmMsg: "This will mark the item as deleted.",
    },
};

export async function deleteCore(resource, id, user, request, options = {}) {
    const role = user?.roles?.includes("admin") ? "admin" : "default";
    const strategy = deleteStrategies[role];

    try {
        // Confirm action
        const result = await showAlert({
            title: "Are you sure?",
            text: strategy.confirmMsg,
            icon: "warning",
            confirmButtonText: "Yes, delete it!",
            cancelButtonText: "Cancel",
            ...options.confirm,
        });
        if (!result?.isConfirmed) return false;

        // Perform request (endpoint is resource-based only)
        await request({
            endpoint: `/${resource}/${id}/`,
            method: strategy.method,
            body: strategy.body,
        });

        // Success message
        await showAlert({
            title: "Deleted!",
            text: strategy.successMsg,
            icon: "success",
            showConfirmButton: false,
            showCancelButton: false,
            timer: 1500,
        });

        return true;
    } catch (err) {
        console.error(err);
        notifyError("Failed to delete item: " + err.message);
        return false;
    }
}
