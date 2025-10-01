import React, { useState } from "react";
import { notifySuccess, notifyError } from "../../../utils/toast";
import { UserIcon, MailIcon, LockIcon, LockKeyholeIcon, IdCardIcon, ShieldIcon, SaveIcon, XIcon } from "lucide-react";
import { useApi } from "../../../hooks/api/useApi";

export default function CreateUserModal({ isCreationModalOpen, setIsCreationModalOpen, fetchData }) {
    const { request, loading: apiLoading, error } = useApi();

    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
        password2: "",
        first_name: "",
        last_name: "",
        role: "Viewer",
    });

    const [errors, setErrors] = useState({});

    const resetForm = () => {
        setFormData({
            username: "",
            email: "",
            password: "",
            password2: "",
            first_name: "",
            last_name: "",
            role: "Viewer",
        });
        setErrors({});
    };

    const handleClose = () => {
        resetForm();
        setIsCreationModalOpen(false);
    };

    const handleChange = (key, value) => {
        // build new state immediately
        const newFormData = { ...formData, [key]: value };
        setFormData(newFormData);

        setErrors((prev) => {
            const updated = { ...prev };

            // username
            if (!newFormData.username?.trim()) {
                updated.username = "Username is required.";
            } else {
                delete updated.username;
            }

            // email
            if (!newFormData.email?.trim()) {
                updated.email = "Email is required.";
            } else {
                delete updated.email;
            }

            // password
            if (!newFormData.password?.trim()) {
                updated.password = "Password is required.";
            } else {
                delete updated.password;
            }

            // password2 (must match password)
            if (newFormData.password2 && newFormData.password2 !== newFormData.password) {
                updated.password2 = "Passwords must match.";
            } else {
                delete updated.password2;
            }

            // role (select field must not be empty)
            if (!newFormData.role?.trim()) {
                updated.role = "Role is required.";
            } else {
                delete updated.role;
            }

            return updated;
        });
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.username.trim()) newErrors.username = "Username is required.";
        if (!formData.email.trim()) newErrors.email = "Email is required.";
        if (!formData.password.trim()) newErrors.password = "Password is required.";
        if (!formData.password2.trim()) newErrors.password2 = "Please confirm your password.";
        if (formData.password !== formData.password2) newErrors.password2 = "Passwords must match.";
        if (!formData.role || formData.role.trim() === "") {
            newErrors.role = "Role is required.";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validate()) return;

        try {
            await request({
                endpoint: `/users/`,
                method: "POST",
                body: formData,
            });

            notifySuccess("User created successfully.");
            handleClose();
            if (fetchData) fetchData();
        } catch (error) {
            console.error("Error creating user:", error);
            notifyError(`Error creating user: ${error.message}`);
        }
    };

    if (!isCreationModalOpen) return null;

    return (
        <div className='fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-2 sm:p-4'>
            <div className='bg-white rounded-lg shadow-lg w-full max-w-md sm:max-w-2xl lg:max-w-3xl xl:max-w-4xl p-6 overflow-y-auto max-h-[90vh]'>
                <h3 className='text-xl sm:text-2xl font-semibold mb-4'>Create User</h3>

                <div className='flex flex-col gap-3'>
                    <input
                        type='text'
                        placeholder='Username'
                        value={formData.username}
                        onChange={(e) => handleChange("username", e.target.value)}
                        className={`border p-2 rounded w-full capitalize ${errors.username ? "border-red-500" : ""}`}
                    />
                    {/* </div> */}
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
                        placeholder='Password'
                        value={formData.password}
                        onChange={(e) => handleChange("password", e.target.value)}
                        className={`border p-2 rounded w-full ${errors.password ? "border-red-500" : ""}`}
                    />
                    {errors.password && <span className='text-red-500 text-sm'>{errors.password}</span>}

                    <input
                        type='password'
                        placeholder='Confirm Password'
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
                </div>

                <div className='flex flex-col sm:flex-row justify-end mt-6 gap-2'>
                    <button onClick={handleSave} className='px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 w-full sm:w-auto'>
                        Save
                    </button>
                    <button onClick={handleClose} className='px-4 py-2 rounded border w-full sm:w-auto'>
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}
