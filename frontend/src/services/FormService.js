//Fetch form data
export async function fetchForms(request, { page, pageSize, search, filterState, showAllVersions }) {
    let url = `/forms/?page=${page}&page_size=${pageSize}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (filterState) url += `&state=${filterState}`;
    if (showAllVersions) url += `&latest_only=false`;

    return request({ endpoint: url });
}

//JSON File
export async function uploadForms(request, forms) {
    return request({ endpoint: "/forms/", method: "POST", body: forms });
}

//Restore from sof deletion
export async function restoreForm(request, id) {
    return request({ endpoint: `/forms/${id}/`, method: "PATCH", body: { is_deleted: false } });
}

//Soft Deletion
export async function deleteForm(deleteItem, id, user) {
    return deleteItem("forms", id, user);
}

//Edition through modal
export async function updatedForm(request, id, form) {
    return request({ endpoint: `/forms/${id}/`, method: "PATCH", body: form });
}
