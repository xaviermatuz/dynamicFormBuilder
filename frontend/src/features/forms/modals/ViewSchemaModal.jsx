import React, { useState } from "react";
import PreviewSchemaModal from "./PreviewSchemaModal";

export default function ViewSchemaModal({ isViewModalOpen, setIsViewModalOpen, viewItem }) {
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    if (!isViewModalOpen || !viewItem) return null;

    return (
        <>
            <div className='fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4'>
                <div className='bg-white rounded-lg shadow-lg w-full max-w-md sm:max-w-lg lg:max-w-xl p-6 overflow-y-auto max-h-[90vh]'>
                    <h3 className='text-xl sm:text-2xl font-semibold mb-4'>View Schema</h3>

                    <div className='flex flex-col gap-2'>
                        <p>
                            <span className='font-medium'>ID:</span> {viewItem.id}
                        </p>
                        <p>
                            <span className='font-medium'>Name:</span> {viewItem.name}
                        </p>
                        <p>
                            <span className='font-medium'>Description:</span> {viewItem.description || "-"}
                        </p>
                        <p>
                            <span className='font-medium'>Created At:</span> {new Date(viewItem.created_at).toLocaleString()}
                        </p>

                        {viewItem.fields && viewItem.fields.length > 0 && (
                            <div className='mt-4'>
                                <h4 className='font-medium mb-2'>Fields:</h4>
                                <div className='flex flex-col gap-2'>
                                    {viewItem.fields
                                        .sort((a, b) => a.order - b.order)
                                        .map((field, idx) => (
                                            <div key={idx} className='border p-2 rounded'>
                                                <p>
                                                    <span className='font-medium'>Label:</span> {field.label}
                                                </p>
                                                <p>
                                                    <span className='font-medium'>Name:</span> {field.name}
                                                </p>
                                                <p>
                                                    <span className='font-medium'>Type:</span> {field.field_type}
                                                </p>
                                                <p>
                                                    <span className='font-medium'>Required:</span> {field.required ? "Yes" : "No"}
                                                </p>
                                                {field.field_type === "select" && field.options && (
                                                    <p>
                                                        <span className='font-medium'>Options:</span> {field.options.join(", ")}
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className='flex justify-end mt-4 gap-2'>
                        <button onClick={() => setIsPreviewOpen(true)} className='px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600'>
                            Preview
                        </button>
                        <button onClick={() => setIsViewModalOpen(false)} className='px-4 py-2 rounded border'>
                            Close
                        </button>
                    </div>
                </div>
            </div>

            {/* Preview modal */}
            {isPreviewOpen && <PreviewSchemaModal isPreviewOpen={isPreviewOpen} setIsPreviewOpen={setIsPreviewOpen} schema={viewItem} />}
        </>
    );
}
