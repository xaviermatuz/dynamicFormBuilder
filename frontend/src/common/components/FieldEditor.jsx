import * as Tooltip from "@radix-ui/react-tooltip";

export default function FieldEditor({ field, index, onChange, onRemove, error }) {
    return (
        <div className='flex flex-col sm:flex-row gap-2 items-center border p-2 rounded'>
            <div className='flex-1 flex flex-col gap-1 w-auto'>
                <input
                    type='text'
                    placeholder='Field Label'
                    value={field.label}
                    onChange={(e) => onChange(index, "label", e.target.value)}
                    className={`border p-2 rounded flex-1 ${error?.label ? "border-red-500" : ""}`}
                />
                {error?.label && <span className='text-red-500 text-sm'>{error.label}</span>}
            </div>

            <select value={field.field_type} onChange={(e) => onChange(index, "field_type", e.target.value)} className='border p-2 rounded'>
                <option value='text'>Text</option>
                <option value='number'>Number</option>
                <option value='date'>Date</option>
                <option value='select'>Select</option>
            </select>

            <Tooltip.Root>
                <Tooltip.Trigger asChild>
                    <input
                        type='checkbox'
                        checked={field.required}
                        onChange={(e) => onChange(index, "required", e.target.checked)}
                        className='mt-1'
                    />
                </Tooltip.Trigger>
                <Tooltip.Content className='bg-gray-800 text-white text-xs rounded px-2 py-1 shadow-md'>
                    Is this field required on your form?
                    <Tooltip.Arrow className='fill-gray-800' />
                </Tooltip.Content>
            </Tooltip.Root>
            {field.field_type === "select" && (
                <input
                    type='text'
                    placeholder='Options (comma-separated)'
                    value={field.options.join(",")}
                    onChange={(e) =>
                        onChange(
                            index,
                            "options",
                            e.target.value.split(",").map((opt) => opt.trim())
                        )
                    }
                    className={`border p-2 rounded ${error?.options ? "border-red-500" : "border-gray-300"}`}
                />
            )}
            {error?.options && <span className='text-red-500 text-sm'>{error.options}</span>}

            <button onClick={() => onRemove(index)} className='px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600'>
                Remove
            </button>
        </div>
    );
}
