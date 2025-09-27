// src/common/components/RouteGuard.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Spinner from "./Spinner";

export default function RouteGuard({ children, requireAuth = false, requireRoles = [] }) {
    const { user, loading } = useAuth();

    // Validating token, show loader
    if (loading) {
        return <Spinner size='16' color='blue-500' fullPage />;
    }

    // If route requires authentication but no user
    if (requireAuth && !user) {
        return <Navigate to='/login' replace />;
    }

    // If route requires specific roles but user doesn't have them
    if (requireRoles.length > 0) {
        const hasRole = requireRoles.some((role) => user?.roles?.includes(role.toLowerCase()));
        if (!hasRole) {
            return <Navigate to='/dashboard/forms' replace />;
        }
    }

    return children;
}
