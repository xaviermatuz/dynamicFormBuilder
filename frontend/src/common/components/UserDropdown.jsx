import { NavLink } from "react-router-dom";
import { User as UserIcon } from "lucide-react";

export default function UserDropdown({ user, open, setOpen, setSidebarOpen }) {
    if (!open) return null;

    return (
        <div className='absolute left-0 mt-2 w-44 bg-white rounded-lg shadow-lg transition-all z-10'>
            <NavLink
                to='profile'
                end
                className='flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-t-lg'
                onClick={() => {
                    setOpen(false);
                    setSidebarOpen(false);
                }}
            >
                <UserIcon className='w-4 h-4' /> Profile
            </NavLink>
        </div>
    );
}
