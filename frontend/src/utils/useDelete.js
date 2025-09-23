// deleteHelper.js
import { showAlert } from "./SwalWrapper";
import { notifyError } from "./toast";

/**
 * Generic, role-aware delete function.
 * @param {string|number} id - ID of the item to delete.
 * @param {string} apiUrl - Base API URL for the entity (e.g., /api/v1/forms/).
 * @param {string} token - Auth token for API request.
 * @param {string} userRole - Current user's role.
 * @param {object} [options] - Optional SweetAlert2 overrides.
 * @returns {Promise<boolean>} - Resolves to true if deletion was successful.
 */
export const deleteItem = async (id, apiUrl, token, userRole, options = {}) => {
    try {
        // Show confirmation dialog
        const result = await showAlert({
            title: "Are you sure?",
            text: "You won't be able to revert this!",
            icon: "warning",
            confirmButtonText: "Yes, delete it!",
            cancelButtonText: "Cancel",
            ...options.confirm,
        });

        if (!result?.isConfirmed) return false;

        // Determine HTTP method and body
        const method = userRole === "admin" ? "DELETE" : "PATCH";
        const body = userRole === "admin" ? null : JSON.stringify({ is_deleted: true });

        // Perform API request
        await fetch(`${apiUrl}${id}/`, {
            method,
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body,
        });

        // Show success message
        await showAlert({
            title: "Deleted!",
            text: userRole === "admin" ? "The item has been permanently deleted." : "The item has been soft deleted.",
            icon: "success",
            showCancelButton: false,
            ...options.success,
        });

        return true;
    } catch (err) {
        console.error(err);
        notifyError("Failed to delete item.");
        return false;
    }
};
