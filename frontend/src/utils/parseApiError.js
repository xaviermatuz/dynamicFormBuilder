export const parseApiError = (error) => {
    if (!error) return ["Unknown error"];

    let data = error;

    // If Axios-style error, unwrap the response
    if (error.response?.data) {
        data = error.response.data;
    } else if (error.detail) {
        data = error.detail;
    } else if (error.message && typeof error.message === "string") {
        data = error.message;
    }

    const allMessages = [];

    // ✅ If it's already an object (like your DRF error), just walk it
    if (typeof data === "object" && data !== null) {
        Object.values(data).forEach((val) => {
            if (Array.isArray(val)) {
                val.forEach((msg) => allMessages.push(String(msg)));
            } else if (typeof val === "string") {
                allMessages.push(val);
            }
        });
    }
    // ✅ If it's just a string, split and clean it
    else if (typeof data === "string") {
        data.split("|").forEach((segment) => {
            const clean = segment.includes(":") ? segment.split(":").slice(1).join(":").trim() : segment.trim();
            if (clean) allMessages.push(clean);
        });
    }

    return allMessages.length ? allMessages : ["Unknown error"];
};
