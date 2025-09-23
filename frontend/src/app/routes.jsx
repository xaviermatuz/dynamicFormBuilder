import React, { lazy } from "react";
import { Routes as Switch, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const LoginPage = lazy(() => import("../features/auth/pages/LoginPage"));
const DashboardLayout = lazy(() => import("../features/dashboard/pages/DashboardLayout"));
const FormsPage = lazy(() => import("../features/forms/pages/FormsPage"));

// Protected Route
const ProtectedRoute = ({ children }) => {
    const { user } = useAuth();
    return user ? children : <Navigate to='/login' replace />;
};

export default function Routes() {
    return (
        <Switch>
            <Route path='/login' element={<LoginPage />} />
            <Route
                path='/dashboard/*'
                element={
                    <ProtectedRoute>
                        <DashboardLayout />
                    </ProtectedRoute>
                }
            />
            <Route path='*' element={<Navigate to='/login' replace />} />
        </Switch>
    );
}
