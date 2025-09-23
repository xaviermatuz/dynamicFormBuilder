// SwalWrapper.js
import Swal from "sweetalert2";

/**
 * Show a SweetAlert2 modal with custom options.
 * @param {object} options - SweetAlert2 options.
 * @returns {Promise<SweetAlertResult>} - Resolves with SweetAlert2 result object.
 */
export const showAlert = async (options) => {
    try {
        const defaultOptions = {
            title: "Are you sure?",
            text: "You won't be able to revert this!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Yes",
        };

        const mergedOptions = { ...defaultOptions, ...options };
        const result = await Swal.fire(mergedOptions);
        return result;
    } catch (error) {
        console.error("Error showing alert:", error);
        return null;
    }
};
