import React, { lazy, useState } from "react";
import { Routes, Route, NavLink, Navigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";

const DashboardHome = lazy(() => import("./DashboardPage"));
const UsersPage = lazy(() => import("../../users/pages/UsersPage"));
const FormsPage = lazy(() => import("../../forms/pages/FormsPage"));

export default function DashboardLayout() {
    const { logout } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const user = localStorage.getItem("username");
    const role = localStorage.getItem("roles");

    return (
        <div className='flex h-screen'>
            {/* Sidebar overlay */}
            {sidebarOpen && <div className='fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden' onClick={() => setSidebarOpen(false)} />}

            {/* Sidebar */}
            <aside
                className={`fixed top-0 left-0 h-full w-64 bg-gray-800 text-white z-50 transform transition-transform duration-300
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} 
          md:translate-x-0 md:relative md:w-64 lg:w-72 xl:w-80`}
            >
                <div className='flex flex-col h-full p-4 lg:p-6 xl:p-8'>
                    <h1 className='text-xl sm:text-2xl lg:text-3xl font-bold mb-6 md:block truncate'>Dynamic Forms</h1>

                    <nav className='flex flex-col space-y-2'>
                        <NavLink
                            to=''
                            end
                            className={({ isActive }) => (isActive ? "font-bold" : "hover:font-semibold")}
                            onClick={() => setSidebarOpen(false)}
                        >
                            Home
                        </NavLink>
                        <NavLink
                            to='users'
                            end
                            className={({ isActive }) => (isActive ? "font-bold" : "hover:font-semibold")}
                            onClick={() => setSidebarOpen(false)}
                        >
                            Users
                        </NavLink>
                        <NavLink
                            to='forms'
                            className={({ isActive }) => (isActive ? "font-bold" : "hover:font-semibold")}
                            onClick={() => setSidebarOpen(false)}
                        >
                            Forms
                        </NavLink>
                    </nav>
                    <button className='mt-auto bg-red-500 px-4 py-2 rounded hover:bg-red-600 text-sm sm:text-base lg:text-lg' onClick={logout}>
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <div className='flex-1 flex flex-col md:ml-58'>
                {/* Header for mobile */}
                <header className='md:hidden flex items-center bg-gray-800 text-white p-4 z-50 relative'>
                    <button className='focus:outline-none flex-shrink-0' onClick={() => setSidebarOpen(!sidebarOpen)}>
                        <svg className='w-6 h-6 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 6h16M4 12h16M4 18h16' />
                        </svg>
                    </button>
                    <h1 className='ml-3 text-lg sm:text-xl font-bold truncate'>Dynamic Forms</h1>
                </header>

                {/* Main area */}
                <main className='flex-1 p-4 sm:p-6 lg:p-8 xl:p-12 bg-gray-100 overflow-auto'>
                    <Routes>
                        <Route path='/' element={<DashboardHome />} />
                        <Route path='users' element={<UsersPage />} />
                        <Route path='forms' element={<FormsPage />} />
                        <Route path='*' element={<Navigate to='/' replace />} />
                    </Routes>
                </main>
            </div>
        </div>
    );
}
