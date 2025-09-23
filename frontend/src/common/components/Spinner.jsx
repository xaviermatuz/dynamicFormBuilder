import React from "react";

const Spinner = ({
    size = "16", // Tailwind width/height class
    color = "blue-500", // Tailwind border color
    fullPage = false, // Center on full page if true
    className = "", // Additional Tailwind classes
}) => {
    const spinnerSize = `w-${size} h-${size}`;
    const borderColor = `border-${color}`;
    const containerClass = fullPage ? "fixed inset-0 flex justify-center items-center bg-white z-50" : "flex justify-center items-center";

    return (
        <div className={`${containerClass} ${className}`}>
            <div className={`border-4 border-gray-200 ${borderColor} border-t-transparent rounded-full animate-spin ${spinnerSize}`}></div>
        </div>
    );
};

export default Spinner;
