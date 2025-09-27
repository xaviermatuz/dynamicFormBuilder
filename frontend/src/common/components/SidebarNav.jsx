import { NavLink } from "react-router-dom";
import { canAccess } from "../../utils/accessControl";

export default function SidebarNav({ navItems, userRoles, onClick }) {
    return (
        <nav className='flex flex-col space-y-2'>
            {navItems.map(({ to, label, icon: Icon, roles }) =>
                canAccess(roles, userRoles) ? (
                    <NavLink
                        key={to}
                        to={to}
                        end
                        className={({ isActive }) =>
                            `flex items-center gap-2 p-2 rounded ${isActive ? "bg-gray-700 font-bold" : "hover:bg-gray-700 hover:font-semibold"}`
                        }
                        onClick={onClick}
                    >
                        <Icon className='w-5 h-5' /> {label}
                    </NavLink>
                ) : null
            )}
        </nav>
    );
}
