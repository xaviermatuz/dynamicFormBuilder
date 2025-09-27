import { useApi } from "../api/useApi";
import { deleteCore } from "../../utils/deleteCore";

export function useDeleteItem() {
    const { request } = useApi();

    const deleteItem = (resource, id, user, options = {}) => deleteCore(resource, id, user, request, options);

    return { deleteItem };
}
