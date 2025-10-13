import React from "react";
import * as Tooltip from "@radix-ui/react-tooltip";
import FieldList from "../../../common/components/FieldList";
import { useSchemaForm } from "../../../hooks/api/useCreateForm";
import { notifyError } from "../../../utils/toast";

export default function CreateSchemaModal({ isOpen, onClose, onSave }) {
    const { name, setName, description, setDescription, fields, setFields, addField, removeField, updateField, validate, errors, reset } =
        useSchemaForm();

    if (!isOpen) return null;

    const handleSave = async () => {
        if (!validate()) return;
        try {
            await onSave({ name, description, fields });
            reset();
            onClose();
        } catch (err) {
            let message = err.message || "Failed to save.";
            message = message.replace(/^non_field_errors:\s*/, "");
            notifyError(message);
        }
    };

    return (
        <Tooltip.Provider delayDuration={200}>
            <div className='fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-2 sm:p-4'>
                <div className='bg-white rounded-lg shadow-lg w-full max-w-3xl p-6 overflow-y-auto max-h-[90vh]'>
                    <h3 className='text-xl font-semibold mb-4'>Create Form</h3>

                    {/* Name */}
                    <input
                        type='text'
                        placeholder='Form Name'
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className={`border p-2 rounded w-full ${errors.name ? "border-red-500" : ""}`}
                    />
                    {errors.name && <span className='text-red-500 text-sm'>{errors.name}</span>}

                    {/* Description */}
                    <textarea
                        placeholder='Description'
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className='border p-2 rounded w-full mt-3'
                    />

                    {/* Fields */}
                    <div className='mt-4 flex flex-col gap-3'>
                        <h4 className='font-medium'>Fields</h4>
                        {errors.atLeastOne && <span className='text-red-500 text-sm'>{errors.atLeastOne}</span>}

                        <FieldList fields={fields} setFields={setFields} updateField={updateField} removeField={removeField} errors={errors} />
                        {/* {fields.map((f, i) => (
                            <div key={i} className='flex flex-col sm:flex-row gap-2 items-center border p-2 rounded'>
                                <div className='flex-1 flex flex-col gap-1 w-auto'>
                                    <input
                                        type='text'
                                        placeholder='Field Label'
                                        value={f.label}
                                        onChange={(e) => updateField(i, "label", e.target.value)}
                                        className={`border p-2 rounded flex-1 ${errors.fields?.[i]?.label ? "border-red-500" : ""}`}
                                    />
                                    {errors.fields?.[i]?.label && <span className='text-red-500 text-sm'>{errors.fields[i].label}</span>}
                                </div>

                                <select
                                    value={f.field_type}
                                    onChange={(e) => updateField(i, "field_type", e.target.value)}
                                    className='border p-2 rounded'
                                >
                                    <option value='text'>Text</option>
                                    <option value='number'>Number</option>
                                    <option value='date'>Date</option>
                                    <option value='select'>Select</option>
                                </select>
                                <Tooltip.Root>
                                    <Tooltip.Trigger asChild>
                                        <input
                                            type='checkbox'
                                            checked={f.required}
                                            onChange={(e) => updateField(i, "required", e.target.checked)}
                                            className='mt-1'
                                        />
                                    </Tooltip.Trigger>
                                    <Tooltip.Content className='bg-gray-800 text-white text-xs rounded px-2 py-1 shadow-md'>
                                        Is this field required on your form?
                                        <Tooltip.Arrow className='fill-gray-800' />
                                    </Tooltip.Content>
                                </Tooltip.Root>

                                <div className='w-auto'>
                                    {f.field_type === "select" && (
                                        <div className='flex-1 flex flex-col gap-1 w-full'>
                                            <input
                                                type='text'
                                                placeholder='Options (comma-separated)'
                                                value={f.options.join(",")}
                                                onChange={(e) =>
                                                    updateField(
                                                        i,
                                                        "options",
                                                        e.target.value.split(",").map((opt) => opt.trim())
                                                    )
                                                }
                                                className={`border p-2 rounded flex-1 ${
                                                    errors.fields?.[i]?.options ? "border-red-500" : "border-gray-300"
                                                }`}
                                            />
                                            {errors.fields?.[i]?.options && <span className='text-red-500 text-sm'>{errors.fields[i].options}</span>}
                                        </div>
                                    )}
                                </div>

                                <button onClick={() => removeField(i)} className='px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600'>
                                    Remove
                                </button>
                            </div>
                        ))} */}

                        <button onClick={addField} className='mt-3 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600'>
                            Add Field
                        </button>
                    </div>

                    {/* Actions */}
                    <div className='flex justify-end mt-6 gap-2'>
                        <button onClick={handleSave} className='px-4 py-2 bg-blue-500 text-white rounded'>
                            Save
                        </button>
                        <button
                            onClick={() => {
                                onClose();
                                reset();
                            }}
                            className='px-4 py-2 border rounded'
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </Tooltip.Provider>
    );
}
