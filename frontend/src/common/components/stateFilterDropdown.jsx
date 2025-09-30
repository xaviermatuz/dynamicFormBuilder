import { useState, useRef, useEffect } from "react";

export default function StateFilterDropdown({ filterState, setFilterState }) {
    const [open, setOpen] = useState(false);
    const timeoutRef = useRef(null);

    // Restore state from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem("filterState");
        if (saved) {
            setFilterState(saved);
        }
    }, [setFilterState]);

    // Save to localStorage whenever filterState changes
    useEffect(() => {
        if (filterState) {
            localStorage.setItem("filterState", filterState);
        }
    }, [filterState]);

    const label = filterState === "active" ? "Active Only" : filterState === "deleted" ? "Deleted Only" : "All Forms";

    const handleMouseEnter = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setOpen(true);
    };

    const handleMouseLeave = () => {
        timeoutRef.current = setTimeout(() => {
            setOpen(false);
        }, 200);
    };

    return (
        <div className='flex items-center gap-2 relative' onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            <label htmlFor='stateFilter' className='text-sm font-medium text-gray-700'>
                State:
            </label>

            {/* Trigger */}
            <button
                type='button'
                className='text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 focus:ring-2 focus:outline-none focus:ring-blue-400 font-medium rounded-md text-sm px-4 py-2 text-center inline-flex items-center shadow-sm'
            >
                {label}
                <svg
                    className={`w-2.5 h-2.5 ms-2 transition-transform ${open ? "rotate-180" : ""}`}
                    aria-hidden='true'
                    xmlns='http://www.w3.org/2000/svg'
                    fill='none'
                    viewBox='0 0 10 6'
                >
                    <path stroke='currentColor' strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='m1 1 4 4 4-4' />
                </svg>
            </button>

            {/* Dropdown menu */}
            {open && (
                <div className='absolute top-full mt-1 right-0 z-10 bg-white border border-gray-200 rounded-md shadow-lg w-44'>
                    <ul className='py-2 text-sm text-gray-700' aria-labelledby='stateFilter'>
                        <li>
                            <button
                                onClick={() => {
                                    setFilterState("active");
                                    setOpen(false);
                                }}
                                className='block w-full text-left px-4 py-2 hover:bg-gray-100'
                            >
                                Active Only
                            </button>
                        </li>
                        <li>
                            <button
                                onClick={() => {
                                    setFilterState("deleted");
                                    setOpen(false);
                                }}
                                className='block w-full text-left px-4 py-2 hover:bg-gray-100'
                            >
                                Deleted Only
                            </button>
                        </li>
                        <li>
                            <button
                                onClick={() => {
                                    setFilterState("all");
                                    setOpen(false);
                                }}
                                className='block w-full text-left px-4 py-2 hover:bg-gray-100'
                            >
                                All Forms
                            </button>
                        </li>
                    </ul>
                </div>
            )}
        </div>
    );
}
