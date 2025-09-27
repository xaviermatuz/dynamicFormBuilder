import React, { useState, useEffect } from "react";
import { notifySuccess, notifyError } from "../../../utils/toast";
import { useApi } from "../../../hooks/api/useApi";

export default function EditUserModal({ isEditModalOpen, setIsEditModalOpen, editItem, fetchData, page, pageSize }) {
    const { request } = useApi();
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
        password2: "",
        first_name: "",
        last_name: "",
        role: "Viewer",
        is_active: true,
    });

    const [errors, setErrors] = useState({});

    // Initialize modal state when editItem changes
    useEffect(() => {
        if (editItem) {
            const currentRole = editItem.role || (editItem.groups && editItem.groups.length > 0 ? editItem.groups[0].name : "Viewer");

            setFormData({
                username: editItem.username || "",
                email: editItem.email || "",
                password: "",
                password2: "",
                first_name: editItem.first_name || "",
                last_name: editItem.last_name || "",
                role: currentRole,
                is_active: editItem.is_active ?? true,
            });
            setErrors({});
        }
    }, [editItem]);

    const handleChange = (key, value) => {
        const newFormData = { ...formData, [key]: value };
        setFormData(newFormData);

        setErrors((prev) => {
            const updated = { ...prev };

            if (!newFormData.username?.trim()) updated.username = "Username is required.";
            else delete updated.username;

            if (!newFormData.email?.trim()) updated.email = "Email is required.";
            else delete updated.email;

            if (newFormData.password && !newFormData.password.trim()) updated.password = "Password is required.";
            else delete updated.password;

            if (newFormData.password2 && newFormData.password2 !== newFormData.password) {
                updated.password2 = "Passwords must match.";
            } else {
                delete updated.password2;
            }

            if (!newFormData.role?.trim()) updated.role = "Role is required.";
            else delete updated.role;

            return updated;
        });
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.username.trim()) newErrors.username = "Username is required.";
        if (!formData.email.trim()) newErrors.email = "Email is required.";
        if (formData.password && !formData.password.trim()) newErrors.password = "Password is required.";
        if (formData.password2 && formData.password !== formData.password2) newErrors.password2 = "Passwords must match.";
        if (!formData.role || formData.role.trim() === "") newErrors.role = "Role is required.";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validate()) return;

        const payload = {
            username: formData.username,
            email: formData.email,
            ...(formData.password ? { password: formData.password } : {}), // only send password if changed
            first_name: formData.first_name,
            last_name: formData.last_name,
            role: formData.role,
            is_active: formData.is_active,
        };

        try {
            // Update user base info
            await request({
                endpoint: `/users/${editItem.id}/`,
                method: "PATCH",
                body: payload,
            });

            // Call extra endpoint if password was changed
            if (formData.password) {
                const passRes = await request({
                    endpoint: `/users/${editItem.id}/set-password//`,
                    method: "POST",
                    body: { password: formData.password, password2: formData.password2 },
                });
            }

            notifySuccess("User updated successfully.");
            await fetchData(page, pageSize);
            setIsEditModalOpen(false);
        } catch (err) {
            console.error(err);
            notifyError(`Error updating user:\n${err.message}`);
        }
    };

    if (!isEditModalOpen || !editItem) return null;

    return (
        <div className='fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-2 sm:p-4'>
            <div className='bg-white rounded-lg shadow-lg w-full max-w-md sm:max-w-2xl lg:max-w-3xl xl:max-w-4xl p-6 overflow-y-auto max-h-[90vh]'>
                <h3 className='text-xl sm:text-2xl font-semibold mb-4'>Edit User</h3>

                <div className='flex flex-col gap-3'>
                    <input
                        type='text'
                        placeholder='Username'
                        value={formData.username}
                        onChange={(e) => handleChange("username", e.target.value)}
                        className={`border p-2 rounded w-full ${errors.username ? "border-red-500" : ""}`}
                    />
                    {errors.username && <span className='text-red-500 text-sm'>{errors.username}</span>}

                    <input
                        type='email'
                        placeholder='Email'
                        value={formData.email}
                        onChange={(e) => handleChange("email", e.target.value)}
                        className={`border p-2 rounded w-full ${errors.email ? "border-red-500" : ""}`}
                    />
                    {errors.email && <span className='text-red-500 text-sm'>{errors.email}</span>}

                    <input
                        type='password'
                        placeholder='New Password (leave blank to keep current)'
                        value={formData.password}
                        onChange={(e) => handleChange("password", e.target.value)}
                        className={`border p-2 rounded w-full ${errors.password ? "border-red-500" : ""}`}
                    />
                    {errors.password && <span className='text-red-500 text-sm'>{errors.password}</span>}

                    <input
                        type='password'
                        placeholder='Confirm New Password'
                        value={formData.password2}
                        onChange={(e) => handleChange("password2", e.target.value)}
                        className={`border p-2 rounded w-full ${errors.password2 ? "border-red-500" : ""}`}
                    />
                    {errors.password2 && <span className='text-red-500 text-sm'>{errors.password2}</span>}

                    <div className='flex flex-col sm:flex-row gap-2'>
                        <input
                            type='text'
                            placeholder='First Name'
                            value={formData.first_name}
                            onChange={(e) => handleChange("first_name", e.target.value)}
                            className='border p-2 rounded w-full'
                        />
                        <input
                            type='text'
                            placeholder='Last Name'
                            value={formData.last_name}
                            onChange={(e) => handleChange("last_name", e.target.value)}
                            className='border p-2 rounded w-full'
                        />
                    </div>

                    <select
                        value={formData.role}
                        onChange={(e) => handleChange("role", e.target.value)}
                        className={`border p-2 rounded w-full ${errors.role ? "border-red-500" : ""}`}
                    >
                        <option value=''>Select Role</option>
                        <option value='Admin'>Admin</option>
                        <option value='Editor'>Editor</option>
                        <option value='Viewer'>Viewer</option>
                    </select>
                    {errors.role && <span className='text-red-500 text-sm'>{errors.role}</span>}

                    {/* Slider for is_active */}
                    <div className='flex items-center justify-between mt-4'>
                        <span className='font-medium'>Active Status</span>

                        <label className='relative inline-flex items-center cursor-pointer'>
                            <input
                                type='checkbox'
                                checked={formData.is_active}
                                onChange={(e) => handleChange("is_active", e.target.checked)}
                                className='sr-only peer'
                            />
                            {/* Track with moving thumb via ::after */}
                            <div
                                className="
        relative w-11 h-6 rounded-full bg-gray-300 transition-colors
        peer-checked:bg-blue-600

        after:content-[''] after:absolute after:top-0.5 after:left-0.5
        after:w-5 after:h-5 after:bg-white after:rounded-full
        after:transition-transform after:duration-300

        peer-checked:after:translate-x-5
      "
                            />
                        </label>
                    </div>
                </div>

                <div className='flex flex-col sm:flex-row justify-end mt-6 gap-2'>
                    <button onClick={handleSave} className='px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 w-full sm:w-auto'>
                        Save
                    </button>
                    <button onClick={() => setIsEditModalOpen(false)} className='px-4 py-2 rounded border w-full sm:w-auto'>
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}
