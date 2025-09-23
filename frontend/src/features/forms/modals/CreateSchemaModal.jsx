import React, { useState } from "react";
import { notifySuccess, notifyError } from "../../../utils/toast";

export default function CreateSchemaModal({ isCreationModalOpen, setIsCreationModalOpen, fetchData, token }) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [fields, setFields] = useState([]);
    const [fieldErrors, setFieldErrors] = useState({});
    const [atLeastOneError, setatLeastOneError] = useState("");
    const [nameError, setNameError] = useState("");

    const resetForm = () => {
        setName("");
        setDescription("");
        setFields([]);
        setFieldErrors({});
        setNameError("");
        setatLeastOneError("");
    };

    const handleClose = () => {
        resetForm();
        setIsCreationModalOpen(false);
    };

    const handleAddField = () => {
        setFields([...fields, { name: "", label: "", field_type: "text", required: false, order: fields.length + 1, options: [] }]);
    };

    const handleRemoveField = (index) => {
        const updatedFields = fields.filter((_, i) => i !== index).map((f, i) => ({ ...f, order: i + 1 }));
        setFields(updatedFields);

        const updatedErrors = { ...fieldErrors };
        delete updatedErrors[index];
        setFieldErrors(updatedErrors);
    };

    const handleFieldChange = (index, key, value) => {
        const updatedFields = [...fields];
        updatedFields[index][key] = value;

        if (key === "label") {
            updatedFields[index].name = value.toLowerCase().replace(/\s+/g, "_");
        }

        setFields(updatedFields);

        // Validate + update errors inline
        setFieldErrors((prev) => {
            const updatedErrors = { ...prev };
            let fieldError = updatedErrors[index] ? { ...updatedErrors[index] } : {};

            if (key === "label") {
                if (!value.trim()) {
                    fieldError.label = "Field label is required.";
                } else {
                    fieldError.label = "";
                }
            }

            if (key === "options") {
                if (!value || value.length === 0 || value.every((opt) => !opt.trim())) {
                    fieldError.options = "Options are required for select fields.";
                } else {
                    fieldError.options = "";
                }
            }

            // cleanup: remove empty error fields
            if (!fieldError.label && !fieldError.options) {
                delete updatedErrors[index];
            } else {
                updatedErrors[index] = fieldError;
            }

            return updatedErrors;
        });
    };

    const validate = () => {
        let valid = true;

        if (!name.trim()) {
            setNameError("Schema name is required.");
            valid = false;
        } else if (fields.length === 0) {
            setatLeastOneError("At least one field is required.");
            valid = false;
        } else {
            setNameError("");
            setatLeastOneError("");
        }

        const errors = {};
        fields.forEach((field, idx) => {
            const fieldError = {};

            if (!field.label.trim()) {
                fieldError.label = "Field label is required.";
                valid = false;
            }

            if (field.field_type === "select" && (!field.options || field.options.length === 0 || field.options.every((opt) => !opt.trim()))) {
                fieldError.options = "Options are required for select fields.";
                valid = false;
            }

            if (Object.keys(fieldError).length > 0) {
                errors[idx] = fieldError; // always object
            }
        });

        setFieldErrors(errors);
        return valid;
    };

    const handleSave = async () => {
        if (!validate()) return;

        const payload = {
            name,
            description,
            fields,
        };

        try {
            const response = await fetch("http://127.0.0.1:8000/api/v1/forms/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error("Failed to create Form");
            }

            notifySuccess("Form created.");
            handleClose();
            if (fetchData) fetchData(); // Refresh data in parent component
        } catch (error) {
            console.error(error);
            notifyError("Error creating schema. See console for details.");
        }
    };

    if (!isCreationModalOpen) return null;

    return (
        <div className='fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-2 sm:p-4'>
            <div className='bg-white rounded-lg shadow-lg w-full max-w-md sm:max-w-2xl lg:max-w-3xl xl:max-w-4xl p-6 overflow-y-auto max-h-[90vh]'>
                <h3 className='text-xl sm:text-2xl font-semibold mb-4'>Create Schema</h3>

                <div className='flex flex-col gap-3'>
                    <input
                        type='text'
                        placeholder='Schema Name'
                        value={name}
                        onChange={(e) => {
                            const value = e.target.value;
                            setName(value);

                            // Inline validation
                            if (!value.trim()) {
                                setNameError("Schema name is required.");
                            } else {
                                setNameError("");
                            }
                        }}
                        className={`border p-2 rounded w-full ${nameError ? "border-red-500" : ""}`}
                    />
                    {nameError && <span className='text-red-500 text-sm'>{nameError}</span>}
                    <textarea
                        placeholder='Description'
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className='border p-2 rounded w-full'
                    />
                </div>

                <div className='mt-4 flex flex-col gap-3'>
                    <h4 className='font-medium'>Fields</h4>
                    {atLeastOneError && <span className='text-red-500 text-sm'>{atLeastOneError}</span>}
                    {fields.map((field, idx) => (
                        <div key={idx} className='flex flex-col sm:flex-row gap-2 items-center border p-2 rounded'>
                            <div className='flex-1 flex flex-col gap-1 w-auto'>
                                <input
                                    type='text'
                                    placeholder='Field Label'
                                    value={field.label}
                                    onChange={(e) => handleFieldChange(idx, "label", e.target.value)}
                                    className={`border p-2 rounded w-full ${fieldErrors[idx] ? "border-red-500" : ""}`}
                                />
                                {fieldErrors[idx]?.label && <span className='text-red-500 text-sm'>{fieldErrors[idx].label}</span>}
                            </div>

                            <select
                                value={field.field_type}
                                onChange={(e) => handleFieldChange(idx, "field_type", e.target.value)}
                                className='border p-2 rounded'
                            >
                                <option value='text'>Text</option>
                                <option value='number'>Number</option>
                                <option value='date'>Date</option>
                                <option value='select'>Select</option>
                            </select>

                            <input
                                type='checkbox'
                                checked={field.required}
                                onChange={(e) => handleFieldChange(idx, "required", e.target.checked)}
                                className='mt-1'
                            />

                            <div className='w-auto'>
                                {field.field_type === "select" && (
                                    <div className='flex-1 flex flex-col gap-1 w-full'>
                                        <input
                                            type='text'
                                            placeholder='Options (comma-separated)'
                                            value={field.options.join(",")}
                                            onChange={(e) =>
                                                handleFieldChange(
                                                    idx,
                                                    "options",
                                                    e.target.value.split(",").map((opt) => opt.trim())
                                                )
                                            }
                                            className={`border p-2 rounded flex-1 ${
                                                fieldErrors[idx]?.options ? "border-red-500" : "border-gray-300"
                                            }`}
                                        />
                                    </div>
                                )}
                                {fieldErrors[idx]?.options && <span className='text-red-500 text-sm'>{fieldErrors[idx].options}</span>}
                            </div>

                            <button
                                onClick={() => handleRemoveField(idx)}
                                className='px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 mt-2 sm:mt-0'
                            >
                                Remove
                            </button>
                        </div>
                    ))}

                    <button onClick={handleAddField} className='px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600'>
                        Add Field
                    </button>
                </div>

                <div className='flex flex-col sm:flex-row justify-end mt-6 gap-2'>
                    <button onClick={handleSave} className='px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 w-full sm:w-auto'>
                        Save
                    </button>
                    <button onClick={handleClose} className='px-4 py-2 rounded border w-full sm:w-auto'>
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}
