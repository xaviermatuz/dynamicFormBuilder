import React, { useState } from "react";

export default function PreviewSchemaModal({ isPreviewOpen, setIsPreviewOpen, schema }) {
    const [formData, setFormData] = useState(
        schema.fields?.reduce((acc, f) => {
            acc[f.name] = "";
            return acc;
        }, {}) || {}
    );

    if (!isPreviewOpen || !schema) return null;

    const handleChange = (fieldName, value) => {
        setFormData({ ...formData, [fieldName]: value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log("Form data submitted:", formData);
        alert("This is a preview, form data logged to console.");
    };

    return (
        <div className='fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4'>
            <div className='bg-white rounded-lg shadow-lg w-full max-w-md sm:max-w-lg lg:max-w-xl p-6 overflow-y-auto max-h-[90vh]'>
                <h3 className='text-xl sm:text-2xl font-semibold mb-4'>{schema.name} - Preview</h3>
                <form onSubmit={handleSubmit} className='flex flex-col gap-3'>
                    {schema.fields
                        .sort((a, b) => a.order - b.order)
                        .map((field, idx) => (
                            <div key={idx} className='flex flex-col gap-1'>
                                <label className='font-medium'>
                                    {field.label} {field.required && "*"}
                                </label>
                                {field.field_type === "text" && (
                                    <input
                                        type='text'
                                        value={formData[field.name]}
                                        onChange={(e) => handleChange(field.name, e.target.value)}
                                        className='border p-2 rounded w-full'
                                        required={field.required}
                                    />
                                )}
                                {field.field_type === "number" && (
                                    <input
                                        type='number'
                                        value={formData[field.name]}
                                        onChange={(e) => handleChange(field.name, e.target.value)}
                                        className='border p-2 rounded w-full'
                                        required={field.required}
                                    />
                                )}
                                {field.field_type === "date" && (
                                    <input
                                        type='date'
                                        value={formData[field.name]}
                                        onChange={(e) => handleChange(field.name, e.target.value)}
                                        className='border p-2 rounded w-full'
                                        required={field.required}
                                    />
                                )}
                                {field.field_type === "select" && (
                                    <select
                                        value={formData[field.name]}
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
                        <button type='submit' className='px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600'>
                            Submit
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
