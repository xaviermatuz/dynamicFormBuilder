import { useState, useRef, useEffect } from "react";

export default function StateFilterDropdown({
    filterState,
    setFilterState,
    options, // [{ value: "active", label: "Active Only" }, ...]
    storageKey, // key name to store
    labelText = "Filter:", // Optional label above dropdown
}) {
    const [open, setOpen] = useState(false);
    const timeoutRef = useRef(null);

    // Restore state from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
            setFilterState(saved);
        } else {
            // fallback if no saved value
            const defaultValue = options[0]?.value || "active";
            setFilterState(defaultValue);
            localStorage.setItem(storageKey, defaultValue);
        }
    }, [storageKey]);

    // Save to localStorage whenever filterState changes
    useEffect(() => {
        if (filterState && storageKey) {
            localStorage.setItem(storageKey, filterState);
        }
    }, [filterState, storageKey]);

    const currentLabel = options.find((o) => o.value === filterState)?.label || "Select...";

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
                {currentLabel}
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
                        {options.map((opt) => (
                            <li key={opt.value}>
                                <button
                                    onClick={() => {
                                        setFilterState(opt.value);
                                        setOpen(false);
                                    }}
                                    className='block w-full text-left px-4 py-2 hover:bg-gray-100'
                                >
                                    {opt.label}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
