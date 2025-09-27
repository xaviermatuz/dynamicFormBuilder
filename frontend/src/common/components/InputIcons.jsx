import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export const InputWithIcon = ({ icon: Icon, error, type = "text", ...props }) => {
    const [showPassword, setShowPassword] = useState(false);

    const isPassword = type === "password";
    const inputType = isPassword && showPassword ? "text" : type;

    return (
        <div className='w-full'>
            <div className={`flex items-center border rounded p-2 ${error ? "border-red-500" : "border-gray-300"}`}>
                {Icon && <Icon className='w-5 h-5 text-gray-400 mr-2' />}
                <input {...props} type={inputType} className='w-full focus:outline-none bg-transparent capitalize' />
                {isPassword && (
                    <button
                        type='button'
                        onClick={() => setShowPassword(!showPassword)}
                        className='ml-2 text-gray-500 hover:text-gray-700 focus:outline-none'
                    >
                        {showPassword ? <EyeOff className='w-5 h-5' /> : <Eye className='w-5 h-5' />}
                    </button>
                )}
            </div>
            {error && <span className='text-red-500 text-sm'>{error}</span>}
        </div>
    );
};

export const SelectWithIcon = ({ icon: Icon, error, value, onChange, children }) => (
    <div className='w-full'>
        <div className={`flex items-center border rounded p-2 bg-white ${error ? "border-red-500" : "border-gray-300"}`}>
            {Icon && <Icon className='w-5 h-5 text-gray-400 mr-2' />}
            <select value={value} onChange={onChange} className='w-full bg-white focus:outline-none'>
                {children}
            </select>
        </div>
        {error && <span className='text-red-500 text-sm'>{error}</span>}
    </div>
);
