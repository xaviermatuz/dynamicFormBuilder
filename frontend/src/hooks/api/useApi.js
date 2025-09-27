import { useState } from "react";
import { apiRequest } from "../../utils/apiRequest";
import { parseApiError } from "../../utils/parseApiError";
import { getToken, setToken, decodeToken, refreshToken } from "../../services/authService";

export function useApi(httpClient = fetch) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const request = async ({ endpoint, method = "GET", body = null, query = {}, baseUrl = import.meta.env.VITE_API_URL }) => {
        setLoading(true);
        setError(null);

        try {
            // Handle tokens
            let token = getToken();
            const decoded = token ? decodeToken(token) : null;
            const now = Math.floor(Date.now() / 1000);

            if (decoded?.exp && decoded.exp <= now) {
                token = await refreshToken(baseUrl);
            }

            // Build URL
            const queryString = new URLSearchParams(query).toString();
            const url = `${baseUrl}${endpoint}${queryString ? `?${queryString}` : ""}`;

            // Build headers
            const headers = { "Content-Type": "application/json" };
            if (token) headers["Authorization"] = `Bearer ${token}`;

            // Build body
            let finalBody;
            if (body) {
                finalBody = body instanceof FormData ? body : JSON.stringify(body);
            }

            // Call utility
            return await apiRequest(httpClient, {
                url,
                method,
                headers,
                body: finalBody,
            });
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return { request, loading, error };
}
