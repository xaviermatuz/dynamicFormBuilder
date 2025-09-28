import { formatDate } from "../../../utils/formatters";
import FieldViewer from "../../../common/components/FieldViewer";

export default function ViewSchemaModal({ isViewModalOpen, setIsViewModalOpen, schema }) {
    if (!isViewModalOpen || !schema) return null;

    return (
        <div className='fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4'>
            <div className='bg-white rounded-lg shadow-lg w-full max-w-md sm:max-w-lg lg:max-w-xl p-6 overflow-y-auto max-h-[90vh]'>
                <h3 className='text-xl sm:text-2xl font-semibold mb-4'>View Schema</h3>

                <div className='flex flex-col gap-2'>
                    <p>
                        <span className='font-medium'>ID:</span> {schema.id}
                    </p>
                    <p>
                        <span className='font-medium'>Name:</span> {schema.name}
                    </p>
                    <p>
                        <span className='font-medium'>Description:</span> {schema.description || "-"}
                    </p>
                    <p>
                        <span className='font-medium'>Created At:</span> {formatDate(schema.created_at)}
                    </p>

                    {schema.fields?.length > 0 && (
                        <div className='mt-4'>
                            <h4 className='font-medium mb-2'>Fields:</h4>
                            <div className='flex flex-col gap-2'>
                                {schema.fields
                                    .sort((a, b) => a.order - b.order)
                                    .map((field) => (
                                        <FieldViewer key={field.id || field.name} field={field} />
                                    ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className='flex justify-end mt-4 gap-2'>
                    <button onClick={() => setIsViewModalOpen(false)} className='px-4 py-2 rounded border'>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
