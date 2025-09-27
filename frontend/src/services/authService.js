// Decode JWT payload
export function decodeToken(token) {
    try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        return {
            id: payload.user_id,
            username: payload.username,
            roles: Array.isArray(payload.roles) ? payload.roles.map((r) => r.toLowerCase()) : payload.roles?.toLowerCase(),
            lastLogin: payload.last_login,
            exp: payload.exp,
        };
    } catch {
        return null;
    }
}

// Token storage
export function getToken() {
    return localStorage.getItem("accessToken");
}

export function setToken(token) {
    localStorage.setItem("accessToken", token);
}

export function getRefreshToken() {
    return localStorage.getItem("refreshToken");
}

// Refresh logic
export async function refreshToken(baseUrl) {
    const refresh = getRefreshToken();
    if (!refresh) throw new Error("No refresh token available");

    const res = await fetch(`${baseUrl}/auth/token/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Session expired");

    setToken(data.access);
    return data.access;
}
