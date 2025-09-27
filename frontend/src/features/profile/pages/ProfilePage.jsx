import React, { useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { useApi } from "../../../hooks/api/useApi";
import * as Tooltip from "@radix-ui/react-tooltip";
import { User, UserRoundPenIcon, LockIcon, Eye, EyeOff } from "lucide-react";
import { notifySuccess, notifyError } from "../../../utils/toast";

export default function ProfilePage() {
    const { user } = useAuth();
    const token = localStorage.getItem("accessToken");
    const { request, loading: apiLoading, error } = useApi();

    const [isEditing, setIsEditing] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

    const [formData, setFormData] = useState({
        username: user?.username || "",
        email: user?.email || "",
        first_name: user?.first_name || "",
        last_name: user?.last_name || "",
    });

    const [passwordData, setPasswordData] = useState({
        current_password: "",
        new_password: "",
        confirm_password: "",
    });

    const [showPassword, setShowPassword] = useState({
        current_password: false,
        new_password: false,
        confirm_password: false,
    });

    const handleChange = (key, value) => {
        setFormData((prev) => ({ ...prev, [key]: value }));
    };

    const handlePasswordChange = (key, value) => {
        setPasswordData((prev) => ({ ...prev, [key]: value }));
    };

    const toggleVisibility = (field) => {
        setShowPassword((prev) => ({ ...prev, [field]: !prev[field] }));
    };

    const handleSave = async () => {
        try {
            const payload = {
                first_name: formData.first_name,
                last_name: formData.last_name,
            };
            await request({
                endpoint: `/users/${user.id}/`,
                method: "PATCH",
                body: payload,
            });

            notifySuccess("Profile updated successfully");
            setIsEditing(false);
        } catch (err) {
            notifyError(err.message);
        }
    };

    const handlePasswordSave = async () => {
        if (passwordData.new_password !== passwordData.confirm_password) {
            notifyError("Passwords do not match");
            return;
        }

        const payload = {
            old_password: passwordData.current_password,
            new_password: passwordData.new_password,
            new_password2: passwordData.confirm_password,
        };

        try {
            await request({
                endpoint: "/auth/change-password/",
                method: "POST",
                body: payload,
            });

            notifySuccess("Password updated successfully");
            setIsPasswordModalOpen(false);
            setPasswordData({
                current_password: "",
                new_password: "",
                confirm_password: "",
            });
        } catch (err) {
            notifyError(err.message);
        }
    };

    return (
        <Tooltip.Provider delayDuration={200}>
            <div className='p-2 sm:p-4 lg:p-6 xl:p-8'>
                <h1 className='text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold mb-4 flex items-center gap-2'>
                    <User className='w-6 h-6' />
                    Profile
                </h1>

                <div className='max-w-2xl mx-auto bg-white shadow rounded-lg p-6'>
                    {/* Avatar */}
                    <div className='flex items-center gap-4 mb-6'>
                        <div className='w-16 h-16 flex items-center justify-center rounded-full bg-indigo-500 text-white font-bold text-2xl'>
                            {user?.username?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <p className='font-semibold text-lg capitalize'>{user?.username}</p>
                            <span className='mt-1 inline-block px-2 py-0.5 text-xs rounded-full bg-indigo-600 text-white font-medium capitalize'>
                                {Array.isArray(user?.roles) ? user.roles.join(", ") : user?.roles}
                            </span>
                        </div>
                    </div>

                    {/* Form fields */}
                    <div className='space-y-4'>
                        <div>
                            <label className='block text-sm font-medium text-gray-700'>Email</label>
                            <input
                                type='email'
                                value={formData.email}
                                onChange={(e) => handleChange("email", e.target.value)}
                                disabled={!isEditing}
                                className='mt-1 block w-full border rounded px-3 py-2'
                            />
                        </div>

                        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                            <div>
                                <label className='block text-sm font-medium text-gray-700'>First Name</label>
                                <input
                                    type='text'
                                    value={formData.first_name}
                                    onChange={(e) => handleChange("first_name", e.target.value)}
                                    disabled={!isEditing}
                                    className='mt-1 block w-full border rounded px-3 py-2'
                                />
                            </div>
                            <div>
                                <label className='block text-sm font-medium text-gray-700'>Last Name</label>
                                <input
                                    type='text'
                                    value={formData.last_name}
                                    onChange={(e) => handleChange("last_name", e.target.value)}
                                    disabled={!isEditing}
                                    className='mt-1 block w-full border rounded px-3 py-2'
                                />
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className='flex justify-end gap-3 mt-6'>
                        {!isEditing ? (
                            <>
                                <Tooltip.Root>
                                    <Tooltip.Trigger asChild>
                                        <button
                                            className='px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-2'
                                            onClick={() => setIsEditing(true)}
                                        >
                                            <UserRoundPenIcon className='w-4 h-4' />
                                            Edit Profile
                                        </button>
                                    </Tooltip.Trigger>
                                    <Tooltip.Content className='bg-gray-800 text-white text-xs rounded px-2 py-1 shadow-md'>
                                        Edit your profile
                                        <Tooltip.Arrow className='fill-gray-800' />
                                    </Tooltip.Content>
                                </Tooltip.Root>

                                <Tooltip.Root>
                                    <Tooltip.Trigger asChild>
                                        <button
                                            className='px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 flex items-center gap-2'
                                            onClick={() => setIsPasswordModalOpen(true)}
                                        >
                                            <LockIcon className='w-4 h-4' />
                                            Change Password
                                        </button>
                                    </Tooltip.Trigger>
                                    <Tooltip.Content className='bg-gray-800 text-white text-xs rounded px-2 py-1 shadow-md'>
                                        Update your password
                                        <Tooltip.Arrow className='fill-gray-800' />
                                    </Tooltip.Content>
                                </Tooltip.Root>
                            </>
                        ) : (
                            <>
                                <button className='px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400' onClick={() => setIsEditing(false)}>
                                    Cancel
                                </button>
                                <button className='px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600' onClick={handleSave}>
                                    Save
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Change Password Modal */}
                {isPasswordModalOpen && (
                    <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'>
                        <div className='bg-white rounded-lg shadow-lg p-6 w-full max-w-md'>
                            <h2 className='text-lg font-bold mb-4'>Change Password</h2>

                            <div className='space-y-4'>
                                {[
                                    { label: "Current Password", field: "current_password" },
                                    { label: "New Password", field: "new_password" },
                                    { label: "Confirm New Password", field: "confirm_password" },
                                ].map(({ label, field }) => (
                                    <div key={field}>
                                        <label className='block text-sm font-medium text-gray-700'>{label}</label>
                                        <div className='relative mt-1'>
                                            <input
                                                type={showPassword[field] ? "text" : "password"}
                                                value={passwordData[field]}
                                                onChange={(e) => handlePasswordChange(field, e.target.value)}
                                                className='block w-full border rounded px-3 py-2 pr-10'
                                            />
                                            <button
                                                type='button'
                                                onClick={() => toggleVisibility(field)}
                                                className='absolute inset-y-0 right-2 flex items-center text-gray-500 hover:text-gray-700'
                                            >
                                                {showPassword[field] ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className='flex justify-end gap-3 mt-6'>
                                <button
                                    className='px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400'
                                    onClick={() => setIsPasswordModalOpen(false)}
                                >
                                    Cancel
                                </button>
                                <button className='px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600' onClick={handlePasswordSave}>
                                    Save
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Tooltip.Provider>
    );
}
