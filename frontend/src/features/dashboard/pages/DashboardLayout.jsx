import React, { useState, useRef, Suspense } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { Home, Users, FileText, LogOut, Menu, ActivityIcon, User as UserIcon, FileUp } from "lucide-react";
import SidebarNav from "../../../common/components/SidebarNav";
import navItems from "../../../common/components/navConfig";
import UserDropdown from "../../../common/components/UserDropdown";

export default function DashboardLayout() {
    const { user, logout } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [open, setOpen] = useState(false);
    const timeoutRef = useRef(null);

    const handleMouseEnter = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setOpen(true);
    };

    const handleMouseLeave = () => {
        timeoutRef.current = setTimeout(() => setOpen(false), 200); // 200ms delay
    };

    return (
        <div className='flex h-screen'>
            {/* Sidebar overlay for mobile */}
            {sidebarOpen && (
                <div className='fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden transition-opacity' onClick={() => setSidebarOpen(false)} />
            )}

            {/* Sidebar */}
            <aside
                className={`
                    fixed top-0 left-0 h-full w-64 bg-gray-800 text-white z-50 transform transition-transform duration-300 ease-in-out
                    ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
                    md:translate-x-0 md:relative md:w-64 lg:w-72 xl:w-80
                `}
            >
                <div className='flex flex-col h-full p-4 lg:p-6 xl:p-8'>
                    <div className='mb-6'>
                        {/* App title */}
                        <h1 className='text-xl sm:text-2xl lg:text-3xl font-bold mb-2 md:block truncate'>Dynamic Forms</h1>
                    </div>

                    <div className='mb-6 relative' onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
                        <div className='flex items-center gap-3 p-3 rounded-lg bg-gray-700/60 cursor-pointer'>
                            {/* Avatar */}
                            <div className='w-10 h-10 flex items-center justify-center rounded-full bg-indigo-500 text-white font-bold text-lg'>
                                {user?.username?.charAt(0).toUpperCase()}
                            </div>

                            <div className='flex flex-col'>
                                <span className='font-semibold text-white text-sm sm:text-base capitalize'>{user?.username}</span>
                                <span className='mt-1 inline-block px-2 py-0.5 text-xs sm:text-sm rounded-full bg-indigo-600 text-white font-medium w-fit capitalize'>
                                    {Array.isArray(user?.roles) ? user.roles.join(", ") : user?.roles}
                                </span>
                            </div>
                        </div>

                        {/* Dropdown */}
                        <UserDropdown user={user} open={open} />
                    </div>

                    {/* Navigation */}
                    <SidebarNav navItems={navItems} userRoles={user?.roles || []} onClick={() => setSidebarOpen(false)} />

                    {/* Logout */}
                    <button
                        className='mt-auto flex items-center gap-2 bg-red-500 px-4 py-2 rounded hover:bg-red-600 text-sm sm:text-base lg:text-lg justify-center'
                        onClick={logout}
                    >
                        <LogOut className='w-5 h-5' /> Logout
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <div className='flex-1 flex flex-col md:ml-58 lg:ml-58 xl:ml-58 transition-all duration-300'>
                {/* Header for mobile */}
                <header className='md:hidden flex items-center bg-gray-800 text-white p-4 z-50 relative'>
                    <button className='focus:outline-none flex-shrink-0' onClick={() => setSidebarOpen(!sidebarOpen)}>
                        <Menu className='w-6 h-6' />
                    </button>
                    <h1 className='ml-3 text-lg sm:text-xl font-bold truncate'>Dynamic Forms</h1>
                </header>

                {/* Main area */}
                <main className='flex-1 p-4 sm:p-6 lg:p-8 xl:p-12 bg-gray-100 overflow-auto'>
                    <Suspense fallback={<div className='text-center mt-20 text-gray-500'>Loading...</div>}>
                        <Outlet />
                    </Suspense>
                </main>
            </div>
        </div>
    );
}
