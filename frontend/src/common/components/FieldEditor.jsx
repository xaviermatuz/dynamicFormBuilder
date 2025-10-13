import * as Tooltip from "@radix-ui/react-tooltip";

export default function FieldEditor({ field, onChange, onRemove, error }) {
    return (
        <div className='flex flex-col sm:flex-row gap-2 items-center border p-2 rounded'>
            {/* Label input */}
            <div className='flex-1 flex flex-col gap-1 w-auto'>
                <input
                    type='text'
                    placeholder='Field Label'
                    value={field.label}
                    onChange={(e) => onChange(field.id, "label", e.target.value)}
                    className={`border p-2 rounded flex-1 ${error?.label ? "border-red-500" : "border-gray-300"}`}
                />
                {error?.label && <span className='text-red-500 text-sm'>{error.label}</span>}
                {(console.log("errors:", error), console.log("field.id:", field, "typeof:", typeof field))}
            </div>

            {/* Field type */}
            <select value={field.field_type} onChange={(e) => onChange(field.id, "field_type", e.target.value)} className='border p-2 rounded'>
                <option value='text'>Text</option>
                <option value='number'>Number</option>
                <option value='date'>Date</option>
                <option value='select'>Select</option>
            </select>

            {/* Required toggle with tooltip */}
            <Tooltip.Root>
                <Tooltip.Trigger asChild>
                    <span>
                        <input
                            type='checkbox'
                            checked={field.required}
                            onChange={(e) => onChange(field.id, "required", e.target.checked)}
                            className='mt-1 cursor-pointer'
                        />
                    </span>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                    <Tooltip.Content side='top' sideOffset={5} className='bg-gray-800 text-white text-xs rounded px-2 py-1 shadow-md z-50'>
                        Is this field required on your form?
                        <Tooltip.Arrow className='fill-gray-800' />
                    </Tooltip.Content>
                </Tooltip.Portal>
            </Tooltip.Root>

            {/* Options input (only for select fields) */}
            {field.field_type === "select" && (
                <div className='flex flex-col gap-1'>
                    <input
                        type='text'
                        placeholder='Options (comma-separated)'
                        value={field.options.join(",")}
                        onChange={(e) =>
                            onChange(
                                field.id,
                                "options",
                                e.target.value
                                    .split(",")
                                    .map((opt) => opt.trim())
                                    .filter((opt) => opt.length > 0)
                            )
                        }
                        className={`border p-2 rounded ${error?.options ? "border-red-500" : "border-gray-300"}`}
                    />
                    {error?.options && <span className='text-red-500 text-sm'>{error.options}</span>}
                </div>
            )}

            {/* Remove button */}
            <button onClick={() => onRemove(field.id)} className='px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600'>
                Remove
            </button>
        </div>
    );
}
