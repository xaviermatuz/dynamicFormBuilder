import React, { createContext, useState, useEffect, useContext } from "react";
import { notifyError } from "../utils/toast";
import Spinner from "../common/components/Spinner";
import { useApi } from "../hooks/api/useApi";
import { getToken, setToken, getRefreshToken, decodeToken, refreshToken } from "../services/authService";
import { parseApiError } from "../utils/parseApiError";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const { request, loading: apiLoading, error } = useApi();

    // --- Restore user on reload ---
    useEffect(() => {
        const initAuth = async () => {
            try {
                let token = getToken();
                if (token) {
                    const decoded = decodeToken(token);
                    const now = Math.floor(Date.now() / 1000);

                    // If expired, try refresh via authService
                    if (decoded?.exp && decoded.exp <= now) {
                        token = await refreshToken(import.meta.env.VITE_API_URL);
                    }

                    const freshDecoded = token ? decodeToken(token) : null;
                    setUser(freshDecoded || null);
                } else {
                    setUser(null);
                }
            } catch (err) {
                console.error("Auth init failed:", err);
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        initAuth();
    }, []);

    // --- Login ---
    const login = async (identifier, password) => {
        try {
            const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
            const payload = {
                [isEmail ? "email" : "username"]: identifier,
                password,
            };

            const res = await request({
                endpoint: "/auth/token/",
                method: "POST",
                body: payload,
            });

            setToken(res.access);
            localStorage.setItem("refreshToken", res.refresh);

            const decoded = decodeToken(res.access);
            setUser(decoded);

            return true;
        } catch (err) {
            console.error("Login failed:", parseApiError(err.message));
            notifyError(err.message);
            return false;
        }
    };

    // --- Register ---
    const register = async (userData) => {
        try {
            const res = await request({
                endpoint: "/auth/register/",
                method: "POST",
                body: userData,
            });

            if (res.access && res.refresh) {
                setToken(res.access);
                localStorage.setItem("refreshToken", res.refresh);

                const decoded = decodeToken(res.access);
                setUser(decoded);
                return true;
            }

            const password = userData.password.trim();
            return await login(userData.username.trim().toLowerCase(), password);
        } catch (err) {
            console.error("Registration failed:", err);
            parseApiError(err).forEach((msg) => notifyError(msg));
            return false;
        }
    };

    // --- Logout ---
    const logout = () => {
        setUser(null);
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
    };

    return (
        <AuthContext.Provider value={{ user, loading: loading || apiLoading, login, register, logout, error }}>
            {loading ? <Spinner fullPage size='16' color='blue-500' /> : children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
