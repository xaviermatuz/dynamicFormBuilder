import { Menu } from "lucide-react";

export default function Header({ setSidebarOpen, sidebarOpen }) {
    return (
        <header className='md:hidden flex items-center bg-gray-800 text-white p-4 z-50 relative'>
            <button className='focus:outline-none flex-shrink-0' onClick={() => setSidebarOpen(!sidebarOpen)}>
                <Menu className='w-6 h-6' />
            </button>
            <h1 className='ml-3 text-lg sm:text-xl font-bold truncate'>Dynamic Forms</h1>
        </header>
    );
}
