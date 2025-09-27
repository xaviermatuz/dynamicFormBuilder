import React, { lazy } from "react";
import { Routes as Switch, Route, Navigate } from "react-router-dom";
import RouteGuard from "../common/components/RouteGuard";

const AuthForm = lazy(() => import("../features/auth/pages/LoginPage"));
const DashboardLayout = lazy(() => import("../features/dashboard/pages/DashboardLayout"));
const ProfilePage = lazy(() => import("../features/profile/pages/ProfilePage"));
const DashboardHome = lazy(() => import("../features/dashboard/pages/DashboardPage"));
const UsersPage = lazy(() => import("../features/users/pages/UsersPage"));
const FormsPage = lazy(() => import("../features/forms/pages/FormsPage"));
const SubmissionsPage = lazy(() => import("../features/submissions/pages/SubmissionsPage"));
const AuditLogsPage = lazy(() => import("../features/logs/pages/AuditLogsPage"));

export default function Routes() {
    return (
        <Switch>
            <Route path='/login' element={<AuthForm />} />

            {/* Dashboard routes */}
            <Route
                path='/dashboard'
                element={
                    <RouteGuard requireAuth>
                        <DashboardLayout />
                    </RouteGuard>
                }
            >
                <Route index element={<DashboardHome />} />

                <Route
                    path='profile'
                    element={
                        <RouteGuard requireAuth>
                            <ProfilePage />
                        </RouteGuard>
                    }
                />

                {/* Only Admins can access Users */}
                <Route
                    path='users'
                    element={
                        <RouteGuard requireAuth requireRoles={["admin"]}>
                            <UsersPage />
                        </RouteGuard>
                    }
                />

                <Route path='forms' element={<FormsPage />} />
                <Route path='submissions' element={<SubmissionsPage />} />

                <Route
                    path='logs'
                    element={
                        <RouteGuard requireAuth requireRoles={["admin"]}>
                            <AuditLogsPage />
                        </RouteGuard>
                    }
                />
            </Route>

            <Route path='*' element={<Navigate to='/login' replace />} />
        </Switch>
    );
}
