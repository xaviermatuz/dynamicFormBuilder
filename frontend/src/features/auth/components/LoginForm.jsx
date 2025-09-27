import React, { useState } from "react";
import { User, Lock, LogIn } from "lucide-react";
import Button from "../../../common/components/Button";
import { InputWithIcon } from "../../../common/components/InputIcons";
import { validateField } from "../../../utils/validation";

export default function LoginForm({ onSubmit }) {
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [errors, setErrors] = useState({});

    const handleChange = (field, value) => {
        if (field === "identifier") setIdentifier(value.toLowerCase());
        if (field === "password") setPassword(value);

        const error = validateField(field, value);
        setErrors((prev) => ({ ...prev, [field]: error }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const newErrors = {
            identifier: validateField("identifier", identifier),
            password: validateField("password", password),
        };

        setErrors(newErrors);

        if (!newErrors.identifier && !newErrors.password) {
            onSubmit({ identifier, password });
        }
    };

    return (
        <form onSubmit={handleSubmit} className='space-y-4'>
            <InputWithIcon
                icon={User}
                type='text'
                placeholder='Email or Username'
                value={identifier}
                onChange={(e) => handleChange("identifier", e.target.value)}
                error={errors.identifier}
            />
            <InputWithIcon
                icon={Lock}
                type='password'
                placeholder='Password'
                value={password}
                onChange={(e) => handleChange("password", e.target.value)}
                error={errors.password}
            />
            <Button type='submit' className='w-full flex items-center justify-center gap-2'>
                <LogIn className='w-5 h-5' /> Login
            </Button>
        </form>
    );
}
