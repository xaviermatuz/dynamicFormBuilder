import React, { useState, useEffect } from "react";
import { notifySuccess, notifyError } from "../../../utils/toast";
import { useApi } from "../../../hooks/api/useApi";

export default function PreviewSchemaModal({ isPreviewOpen, setIsPreviewOpen, viewItem, user }) {
    const localKey = viewItem ? `submission_draft_form_${viewItem.id}` : "submission_draft_global";
    const { request, loading: apiLoading, error } = useApi();

    // Initialize formData from localStorage if available
    const [formData, setFormData] = useState({});

    // Watch for changes to formData and persist them. Load draft on open
    useEffect(() => {
        if (isPreviewOpen) {
            const saved = localStorage.getItem(localKey);
            if (saved) {
                try {
                    setFormData(JSON.parse(saved));
                    return;
                } catch {
                    setFormData({});
                }
            }
            // If no draft, initialize with empty fields
            if (viewItem?.fields) {
                const initialData = viewItem.fields.reduce((acc, f) => {
                    acc[f.name] = "";
                    return acc;
                }, {});
                setFormData(initialData);
            }
        }
    }, [isPreviewOpen, localKey, viewItem]);

    if (!isPreviewOpen || !viewItem) return null;

    const handleChange = (key, value) => {
        setFormData((prev) => {
            const updated = { ...prev, [key]: value };
            localStorage.setItem(localKey, JSON.stringify(updated)); // persist immediately
            return updated;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            // Ensure numeric fields are numbers
            const cleanedData = {};
            for (const [key, value] of Object.entries(formData)) {
                cleanedData[key] = value !== "" && !isNaN(value) && !isNaN(parseFloat(value)) ? Number(value) : value;
            }

            const payload = { data: cleanedData };

            await request({
                endpoint: `/forms/${viewItem.id}/submissions/`,
                method: "POST",
                body: payload,
            });

            notifySuccess("Submission saved successfully.");
            setFormData({});

            localStorage.removeItem(localKey);

            setIsPreviewOpen(false);

            if (typeof fetchData === "function") {
                fetchData();
            }
        } catch (err) {
            console.error("Submission failed:", err);
            notifyError(`Failed to submit: ${err.message}`);
        }
    };

    return (
        <div className='fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4'>
            <div className='bg-white rounded-lg shadow-lg w-full max-w-md sm:max-w-lg lg:max-w-xl p-6 overflow-y-auto max-h-[90vh]'>
                <h3 className='text-xl sm:text-2xl font-semibold mb-4'>
                    {viewItem.name} {!user.roles?.includes("viewer") && "- Preview"}
                </h3>
                <form onSubmit={handleSubmit} className='flex flex-col gap-3'>
                    {viewItem.fields
                        .sort((a, b) => a.order - b.order)
                        .map((field, idx) => (
                            <div key={idx} className='flex flex-col gap-1'>
                                <label className='font-medium'>
                                    {field.label} {field.required && "*"}
                                </label>

                                {field.field_type === "text" && (
                                    <input
                                        type='text'
                                        value={formData[field.name] ?? ""}
                                        onChange={(e) => handleChange(field.name, e.target.value)}
                                        className='border p-2 rounded w-full'
                                        required={field.required}
                                    />
                                )}

                                {field.field_type === "number" && (
                                    <input
                                        type='number'
                                        value={formData[field.name] ?? 0}
                                        onChange={(e) => handleChange(field.name, e.target.value)}
                                        className='border p-2 rounded w-full'
                                        required={field.required}
                                    />
                                )}

                                {field.field_type === "date" && (
                                    <input
                                        type='date'
                                        value={formData[field.name] ?? ""}
                                        onChange={(e) => handleChange(field.name, e.target.value)}
                                        className='border p-2 rounded w-full'
                                        required={field.required}
                                    />
                                )}

                                {field.field_type === "select" && (
                                    <select
                                        value={formData[field.name] ?? ""}
                                        onChange={(e) => handleChange(field.name, e.target.value)}
                                        className='border p-2 rounded w-full'
                                        required={field.required}
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

                    <div className='flex justify-end gap-2 mt-4'>
                        <button type='button' onClick={() => setIsPreviewOpen(false)} className='px-4 py-2 rounded border'>
                            Close
                        </button>
                        {user.roles?.includes("viewer") && (
                            <button type='submit' className='px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600'>
                                Submit
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}
