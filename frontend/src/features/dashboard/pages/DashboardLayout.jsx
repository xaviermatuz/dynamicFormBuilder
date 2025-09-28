import React, { useState, useRef, Suspense } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { Home, Users, FileText, LogOut, Menu, ActivityIcon, User as UserIcon, FileUp } from "lucide-react";
import SidebarNav from "../../../common/components/SidebarNav";
import navItems from "../../../common/components/navConfig";
import UserDropdown from "../../../common/components/UserDropdown";
import Sidebar from "../../../common/components/Sidebar";
import Header from "../../../common/components/Header";

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
            {/* Overlay for mobile */}
            {sidebarOpen && (
                <div className='fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden transition-opacity' onClick={() => setSidebarOpen(false)} />
            )}

            {/* Sidebar */}
            <Sidebar
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
                user={user}
                open={open}
                setOpen={setOpen}
                handleMouseEnter={handleMouseEnter}
                handleMouseLeave={handleMouseLeave}
                logout={logout}
            />

            {/* Main content */}
            <div className='flex-1 flex flex-col md:ml-58 lg:ml-58 xl:ml-58 transition-all duration-300'>
                <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

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
