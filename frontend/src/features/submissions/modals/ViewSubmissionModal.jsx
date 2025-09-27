import React from "react";

export default function ViewSubmissionModal({ isViewModalOpen, setIsViewModalOpen, viewItem, user }) {
    if (!isViewModalOpen || !viewItem) return null;

    return (
        <div className='fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4'>
            <div className='bg-white rounded-lg shadow-lg w-full max-w-md sm:max-w-lg lg:max-w-xl p-6 overflow-y-auto max-h-[90vh]'>
                <h3 className='text-xl sm:text-2xl font-semibold mb-4'>{viewItem.form_name} – Submission</h3>

                {/* Metadata */}
                <div className='flex flex-col gap-2 mb-4 text-sm text-gray-600'>
                    {user?.roles?.includes("admin") && (
                        <p className='flex flex-col w-full gap-2 md:flex-row md:gap-4'>
                            <span className='md:flex-1'>
                                <span className='font-medium'>Submission ID:</span> {viewItem.id}
                            </span>
                            <span className='md:flex-1'>
                                <span className='font-medium'>Form ID:</span> {viewItem.form}
                            </span>
                            <span className='md:flex-1'>
                                <span className='font-medium'>Form Version:</span> {viewItem.form_version}
                            </span>
                        </p>
                    )}

                    <p>
                        <span className='font-medium'>Created At:</span> {new Date(viewItem.submitted_at).toLocaleString()}
                    </p>
                </div>

                {/* Render fields with submitted values */}
                <div className='flex flex-col gap-3'>
                    {viewItem.form_fields
                        ?.sort((a, b) => a.order - b.order)
                        .map((field, idx) => (
                            <div key={idx} className='flex flex-col gap-1'>
                                <label className='font-medium'>
                                    {field.label} {field.required && "*"}
                                </label>

                                {field.field_type === "text" && (
                                    <input
                                        type='text'
                                        value={viewItem.data?.[field.name] ?? ""}
                                        readOnly
                                        className='border p-2 rounded w-full bg-gray-100 cursor-not-allowed'
                                    />
                                )}

                                {field.field_type === "number" && (
                                    <input
                                        type='number'
                                        value={viewItem.data?.[field.name] ?? ""}
                                        readOnly
                                        className='border p-2 rounded w-full bg-gray-100 cursor-not-allowed'
                                    />
                                )}

                                {field.field_type === "date" && (
                                    <input
                                        type='date'
                                        value={viewItem.data?.[field.name] ?? ""}
                                        readOnly
                                        className='border p-2 rounded w-full bg-gray-100 cursor-not-allowed'
                                    />
                                )}

                                {field.field_type === "select" && (
                                    <select
                                        value={viewItem.data?.[field.name] ?? ""}
                                        disabled
                                        className='border p-2 rounded w-full bg-gray-100 cursor-not-allowed'
                                    >
                                        <option value=''>Select...</option>
                                        {field.options?.map((opt, i) => (
                                            <option key={i} value={opt}>
                                                {opt}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>
                        ))}
                </div>

                <div className='flex justify-end gap-2 mt-4'>
                    <button onClick={() => setIsViewModalOpen(false)} className='px-4 py-2 rounded border'>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
