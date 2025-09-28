//Fetch form data
export async function fetchSubmissions(request, { formId, page, pageSize, search, ordering }) {
    const apiUrl = formId ? `/forms/${formId}/submissions/` : `/submissions/`;

    const params = new URLSearchParams({
        page,
        page_size: pageSize,
    });
    if (search) params.append("search", search);
    if (ordering) params.append("ordering", ordering);

    return await request({ endpoint: `${apiUrl}?${params.toString()}` });
}
