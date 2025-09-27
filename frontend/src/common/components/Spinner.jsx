import React from "react";
const Spinner = ({
    size = "12", // Tailwind width/height size (12 = h-12 w-12)
    color = "blue-500", // Tailwind color for the spinning border
    message = "Loading...", // Optional message text
    elapsedTime = null, // Optional seconds elapsed to show
    fullPage = false, // If true, center spinner on full page
    className = "", // Extra custom classes
}) => {
    const spinnerSize = `h-${size} w-${size}`;
    const borderColor = `border-${color}`;
    const containerClass = fullPage
        ? "fixed inset-0 flex flex-col items-center justify-center bg-white z-50"
        : "flex flex-col items-center justify-center";

    return (
        <div className={`${containerClass} space-y-2 py-6 ${className}`}>
            <div className={`animate-spin rounded-full ${spinnerSize} border-t-2 border-b-2 ${borderColor}`}></div>
            <p className='text-gray-600 text-sm'>
                {message}
                {elapsedTime !== null ? ` ${elapsedTime}s elapsed` : ""}
            </p>
        </div>
    );
};

export default Spinner;
