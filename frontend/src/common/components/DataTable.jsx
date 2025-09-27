import React from "react";
import clsx from "clsx";
import { XIcon } from "lucide-react";

export default function DataTable({
    columns,
    items,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalCount,
    sortConfig,
    onSort,
    renderRow,
    renderMobileRow,
    getPageNumbers,
    loading,
    error,
    searchable = false,
    search,
    setSearch,
    optionsMenu,
}) {
    const totalPages = Math.ceil(totalCount / pageSize) || 1;

    return (
        <div className='relative overflow-x-auto'>
            {/* Error message */}
            {error && <p className='text-red-500 mb-2'>Error: {error}</p>}

            {/* Loading overlay */}
            {loading && (
                <div className='absolute inset-0 flex items-center justify-center bg-white/70 z-10'>
                    <p className='text-gray-600 font-medium'>Loading...</p>
                </div>
            )}

            {/* Optional search */}
            {(searchable || optionsMenu) && (
                <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2'>
                    <div className='relative w-full sm:w-1/2 lg:w-1/3'>
                        <input
                            type='text'
                            placeholder='Search...'
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
                            className='w-full border px-3 py-2 rounded pr-8' // 👈 padding for icon
                        />
                        {search && (
                            <button
                                type='button'
                                onClick={() => {
                                    setSearch("");
                                    setPage(1);
                                }}
                                className='absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600'
                            >
                                <XIcon className='w-4 h-4' />
                            </button>
                        )}
                    </div>

                    {optionsMenu && <div className='flex flex-row flex-wrap justify-center sm:justify-start gap-3'>{optionsMenu}</div>}
                </div>
            )}

            {/* Desktop Table */}
            <div className='hidden md:table w-full bg-white rounded shadow text-sm sm:text-base lg:text-lg'>
                <table className='min-w-full'>
                    <thead className='bg-gray-200 text-left'>
                        <tr>
                            {columns.map((col) => (
                                <th
                                    key={col.key}
                                    className={`py-2 px-4 text-center${!col.isAction ? " cursor-pointer select-none" : ""}`}
                                    onClick={() => !col.isAction && onSort && onSort(col.key)}
                                >
                                    {col.label}
                                    {!col.isAction && sortConfig?.key === col.key && (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {items.length > 0 ? (
                            items.map((item) => renderRow(item))
                        ) : (
                            <tr>
                                <td colSpan={columns.length} className='text-center py-4 text-gray-500 italic'>
                                    No items found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Mobile stacked table */}
            <div className='md:hidden flex flex-col gap-4'>
                {items.length > 0 ? (
                    items.map((item) => renderMobileRow(item))
                ) : (
                    <div className='text-center py-4 text-gray-500 italic'>No items found.</div>
                )}
            </div>

            {/* Pagination with Page Size Selector */}
            <div className='flex flex-col sm:flex-row justify-between items-center mt-4 gap-4'>
                {/* Page Size Selector */}
                <div className='flex items-center gap-2'>
                    <label htmlFor='pageSize' className='text-sm bold'>
                        Items per page:
                    </label>
                    <select
                        id='pageSize'
                        value={pageSize}
                        onChange={(e) => {
                            setPageSize(Number(e.target.value));
                            setPage(1);
                        }}
                        className='border rounded px-2 py-1'
                    >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                    </select>
                </div>

                {/* Results count */}
                <div className='text-sm text-gray-600'>
                    {totalCount > 0
                        ? `Showing ${Math.min((page - 1) * pageSize + 1, totalCount)} – ${Math.min(
                              page * pageSize,
                              totalCount
                          )} of ${totalCount} results`
                        : "No results found"}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className='flex justify-center items-center gap-2 flex-wrap'>
                        <button
                            className={clsx("px-3 py-1 rounded bg-gray-200 hover:bg-gray-300", {
                                "opacity-50 cursor-not-allowed": page === 1,
                            })}
                            onClick={() => setPage((p) => Math.max(p - 1, 1))}
                            disabled={page === 1}
                        >
                            ←
                        </button>

                        {getPageNumbers(page, totalPages).map((p, idx) =>
                            p === "..." ? (
                                <span key={idx} className='px-2 py-1'>
                                    ...
                                </span>
                            ) : (
                                <button
                                    key={idx}
                                    className={clsx("px-3 py-1 rounded", p === page ? "bg-blue-500 text-white" : "bg-gray-200 hover:bg-gray-300")}
                                    onClick={() => setPage(p)}
                                >
                                    {p}
                                </button>
                            )
                        )}

                        <button
                            className={clsx("px-3 py-1 rounded bg-gray-200 hover:bg-gray-300", {
                                "opacity-50 cursor-not-allowed": page === totalPages,
                            })}
                            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                            disabled={page === totalPages}
                        >
                            →
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
