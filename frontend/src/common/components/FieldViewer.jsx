export default function FieldViewer({ field }) {
    return (
        <div className='border p-2 rounded'>
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
            {field.field_type === "select" && field.options?.length > 0 && (
                <p>
                    <span className='font-medium'>Options:</span> {field.options.join(", ")}
                </p>
            )}
        </div>
    );
}
