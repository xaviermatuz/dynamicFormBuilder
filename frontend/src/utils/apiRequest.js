// Clean body: converts numeric-like strings to numbers
function cleanBody(body) {
    if (!body || body instanceof FormData) return body;

    if (Array.isArray(body)) {
        return body.map((item) =>
            typeof item === "object" && item !== null
                ? Object.fromEntries(Object.entries(item).map(([k, v]) => [k, v !== "" && !isNaN(v) && !isNaN(parseFloat(v)) ? Number(v) : v]))
                : item
        );
    }

    if (typeof body === "object") {
        return Object.fromEntries(Object.entries(body).map(([k, v]) => [k, v !== "" && !isNaN(v) && !isNaN(parseFloat(v)) ? Number(v) : v]));
    }

    return body;
}

// Default error handler
function defaultErrorHandler(response, data) {
    // Default fallback
    let errorMsg = `HTTP ${response.status}`;

    if (data) {
        if (Array.isArray(data)) {
            // Example: [{ non_field_errors: ["msg"] }]
            errorMsg = data.map((err) => (typeof err === "object" ? Object.values(err).flat().join(", ") : String(err))).join(" | ");
        } else if (typeof data === "object") {
            // Example: { field1: ["msg1"], field2: ["msg2"] }
            errorMsg = Object.entries(data)
                .map(([field, messages]) => {
                    if (Array.isArray(messages)) return `${field}: ${messages.join(", ")}`;
                    return `${field}: ${messages}`;
                })
                .join(" | ");
        } else if (typeof data === "string") {
            errorMsg = data;
        }
    }

    throw new Error(errorMsg);
}

// Default response parser
async function defaultResponseParser(response, errorHandler) {
    let data;
    try {
        data = await response.json();
    } catch {
        data = null;
    }

    if (!response.ok) errorHandler(response, data);
    return data;
}

// Core request function
export async function apiRequest(
    httpClient,
    { url, method = "GET", headers = {}, body = null, errorHandler = defaultErrorHandler, responseParser = defaultResponseParser }
) {
    const response = await httpClient(url, { method, headers, body });
    return responseParser(response, errorHandler);
}
