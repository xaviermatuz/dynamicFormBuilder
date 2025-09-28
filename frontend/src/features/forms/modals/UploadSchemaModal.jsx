import React, { useState } from "react";

export default function UploadModal({ isOpen, onClose, onUpload }) {
    const [selectedFile, setSelectedFile] = useState(null);

    if (!isOpen) return null;

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setSelectedFile(file || null);
    };

    const handleSubmit = () => {
        if (selectedFile) {
            onUpload(selectedFile);
            setSelectedFile(null);
        }
        onClose();
    };

    return (
        <div className='fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4'>
            <div className='bg-white rounded-lg shadow-lg w-full max-w-md sm:max-w-lg lg:max-w-xl p-6'>
                <h3 className='text-xl sm:text-2xl font-semibold mb-4'>Upload JSON</h3>

                <input type='file' accept='application/JSON' onChange={handleFileChange} className='w-full border rounded px-3 py-2' />

                <div className='flex justify-end mt-4 gap-2'>
                    <button onClick={onClose} className='px-4 py-2 rounded border hover:bg-gray-100'>
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!selectedFile}
                        className='px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50'
                    >
                        Upload
                    </button>
                </div>
            </div>
        </div>
    );
}
