import React, { createContext, useState, useEffect, useContext } from "react";
import { notifyError } from "../utils/toast";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        // Initialize user from access token if present
        const token = localStorage.getItem("accessToken");
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split(".")[1]));
                return { id: payload.user_id };
            } catch {
                return null;
            }
        }
        return null;
    });

    const login = async (identifier, password) => {
        try {
            const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
            const login_payload = {
                [isEmail ? "email" : "username"]: identifier,
                password: password, // example additional field
            };
            const res = await fetch("http://127.0.0.1:8000/api/v1/auth/token/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(login_payload),
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.detail || "Login failed");

            // Save token data in localStorage
            localStorage.setItem("accessToken", data.access);
            localStorage.setItem("refreshToken", data.refresh);
            localStorage.setItem("id", data.user_id);
            localStorage.setItem("last_login", data.last_login);
            localStorage.setItem("username", data.username);
            localStorage.setItem("roles", data.roles);

            // Decode access token for user info
            const payload = JSON.parse(atob(data.access.split(".")[1]));
            setUser({ id: payload.user_id });

            return true;
        } catch (err) {
            console.error(err);
            notifyError(err.message);
            return false;
        }
    };

    const register = async ({ username, email, password, password2, firstName, lastName, role }) => {
        try {
            const res = await fetch("http://127.0.0.1:8000/api/v1/auth/register/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, email, password, password2, firstName, lastName, role }),
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.detail || "Registration failed");

            // Optionally auto-login after registration
            return await login(email, password);
        } catch (err) {
            console.error(err);
            notifyError(err.message);
            return false;
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("last_login");
    };

    return <AuthContext.Provider value={{ user, login, register, logout }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
