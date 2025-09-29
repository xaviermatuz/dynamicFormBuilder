import React, { useState } from "react";
import { User, Mail, Lock, UserPlus, UserCog } from "lucide-react";
import Button from "../../../common/components/Button";
import { InputWithIcon, SelectWithIcon } from "../../../common/components/InputIcons";
import { validateField } from "../../../utils/validation";
import { AVAILABLE_ROLES } from "../../../utils/roles";

export default function RegisterForm({ onSubmit }) {
    const [form, setForm] = useState({
        username: "",
        email: "",
        first_name: "",
        last_name: "",
        password: "",
        password2: "",
        role: "Viewer",
    });

    const [errors, setErrors] = useState({});

    const handleChange = (field, value) => {
        // merge in the new value immediately
        const updatedForm = { ...form, [field]: value };
        setForm(updatedForm);

        const newErrors = { ...errors };

        // always validate the changed field
        newErrors[field] = validateField(field, value, { password: updatedForm.password });

        // if password changed, re-validate password2
        if (field === "password" && updatedForm.password2) {
            newErrors.password2 = validateField("password2", updatedForm.password2, {
                password: updatedForm.password,
            });
        }

        // if password2 changed, re-validate password
        if (field === "password2" && updatedForm.password) {
            newErrors.password = validateField("password", updatedForm.password, {
                password: updatedForm.password,
            });
        }

        setErrors(newErrors);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const newErrors = {};
        Object.entries(form).forEach(([key, value]) => {
            newErrors[key] = validateField(key, value, { password: form.password });
        });

        setErrors(newErrors);

        const hasErrors = Object.values(newErrors).some(Boolean);
        console.log(newErrors);
        if (!hasErrors) {
            onSubmit(form);
        }
    };

    return (
        <form onSubmit={handleSubmit} className='space-y-4'>
            <InputWithIcon
                icon={User}
                type='text'
                placeholder='Username'
                value={form.username}
                onChange={(e) => handleChange("username", e.target.value)}
                error={errors.username}
            />
            <InputWithIcon
                icon={Mail}
                type='email'
                placeholder='Email'
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
                error={errors.email}
            />
            <InputWithIcon
                icon={User}
                type='text'
                placeholder='First Name'
                value={form.first_name}
                onChange={(e) => handleChange("first_name", e.target.value)}
                error={errors.first_name}
            />
            <InputWithIcon
                icon={User}
                type='text'
                placeholder='Last Name'
                value={form.last_name}
                onChange={(e) => handleChange("last_name", e.target.value)}
                error={errors.last_name}
            />
            <InputWithIcon
                icon={Lock}
                type='password'
                placeholder='Password'
                value={form.password}
                onChange={(e) => handleChange("password", e.target.value)}
                error={errors.password}
            />
            <InputWithIcon
                icon={Lock}
                type='password'
                placeholder='Confirm Password'
                value={form.password2}
                onChange={(e) => handleChange("password2", e.target.value)}
                error={errors.password2}
            />
            <SelectWithIcon icon={UserCog} value={form.role} onChange={(e) => handleChange("role", e.target.value)} error={errors.role}>
                {AVAILABLE_ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                        {r.label}
                    </option>
                ))}
            </SelectWithIcon>

            <Button type='submit' className='w-full flex items-center justify-center gap-2'>
                <UserPlus className='w-5 h-5' /> Register
            </Button>
        </form>
    );
}
