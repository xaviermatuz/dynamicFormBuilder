import React, { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { notifySuccess, notifyError } from "../../../utils/toast";
import FieldEditor from "../../../common/components/FieldEditor";
import { useSchemaForm } from "../../../hooks/api/useCreateForm";
import { updatedForm } from "../../../services/FormService";
import { useApi } from "../../../hooks/api/useApi";

export default function EditSchemaModal({ isEditModalOpen, setIsEditModalOpen, editItem }) {
    const { request } = useApi();
    const queryClient = useQueryClient();
    const { name, setName, description, setDescription, fields, addField, removeField, updateField, validate, errors } = useSchemaForm(editItem);

    if (!isEditModalOpen || !editItem) return null;

    const handleSave = async () => {
        if (!validate()) return;

        try {
            await updatedForm(request, editItem.id, {
                name,
                description,
                fields,
            });

            notifySuccess("Form updated.");
            queryClient.invalidateQueries({ queryKey: ["forms"] });
            setIsEditModalOpen(false);
        } catch (err) {
            console.error(err);
            notifyError("Error updating form.");
        }
    };

    return (
        <div className='fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-2 sm:p-4'>
            <div className='bg-white rounded-lg shadow-lg w-full max-w-md sm:max-w-2xl lg:max-w-3xl xl:max-w-4xl p-6 overflow-y-auto max-h-[90vh]'>
                <h3 className='text-xl sm:text-2xl font-semibold mb-4'>Edit Schema</h3>

                <div className='flex flex-col gap-3'>
                    <input
                        type='text'
                        placeholder='Schema Name'
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className='border p-2 rounded w-full'
                    />
                    {errors.name && <span className='text-red-500 text-sm'>{errors.name}</span>}
                    <textarea
                        placeholder='Description'
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className='border p-2 rounded w-full'
                    />
                </div>

                <div className='mt-4 flex flex-col gap-3'>
                    <h4 className='font-medium'>Fields</h4>
                    {errors.atLeastOne && <span className='text-red-500 text-sm'>{errors.atLeastOne}</span>}

                    {fields.map((f, i) => (
                        <FieldEditor key={i} field={f} index={i} onChange={updateField} onRemove={removeField} error={errors.fields?.[i]} />
                    ))}

                    <button onClick={addField} className='px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600'>
                        Add Field
                    </button>
                </div>

                <div className='flex flex-col sm:flex-row justify-end mt-6 gap-2'>
                    <button onClick={() => setIsEditModalOpen(false)} className='px-4 py-2 rounded border w-full sm:w-auto'>
                        Cancel
                    </button>
                    <button onClick={handleSave} className='px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 w-full sm:w-auto'>
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
}
