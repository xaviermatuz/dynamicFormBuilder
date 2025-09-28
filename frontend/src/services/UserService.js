//Fetch form data
export async function fetchUsers(request, { page, pageSize, search, filterState }) {
    let url = `/users/?page=${page}&page_size=${pageSize}&search=${encodeURIComponent(search)}`;
    if (filterState === "active") url += "&is_active=true";
    if (filterState === "deleted") url += "&is_active=false";

    return request({ endpoint: url });
}
