import { LogOut } from "lucide-react";
import SidebarNav from "./SidebarNav";
import UserDropdown from "./UserDropdown";
import { navItems } from "./navConfig";

export default function Sidebar({ sidebarOpen, setSidebarOpen, user, open, setOpen, handleMouseEnter, handleMouseLeave, logout }) {
    return (
        <aside
            className={`
        fixed top-0 left-0 h-full w-64 bg-gray-800 text-white z-50 transform
        transition-transform duration-300 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        md:translate-x-0 md:relative md:w-64 lg:w-72 xl:w-80
      `}
        >
            <div className='flex flex-col h-full p-4 lg:p-6 xl:p-8'>
                <div className='mb-6'>
                    {/* App title */}
                    <h1 className='text-xl sm:text-2xl lg:text-3xl font-bold mb-2 md:block truncate'>Dynamic Forms</h1>
                </div>

                {/* User section */}
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
                    <UserDropdown user={user} open={open} setOpen={setOpen} setSidebarOpen={setSidebarOpen} />
                </div>

                {/* Navigation */}
                <SidebarNav navItems={navItems} userRoles={user?.roles || []} onClick={() => setSidebarOpen(false)} />

                {/* Logout */}
                <button
                    className='mt-auto flex items-center gap-2 bg-red-500 px-4 py-2 rounded hover:bg-red-600 justify-center text-sm sm:text-base lg:text-lg'
                    onClick={logout}
                >
                    <LogOut className='w-5 h-5' /> Logout
                </button>
            </div>
        </aside>
    );
}
