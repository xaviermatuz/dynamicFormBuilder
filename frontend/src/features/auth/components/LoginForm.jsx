import React, { useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import Button from "../../../common/components/Button";
import { notifyInfo, notifySuccess } from "../../../utils/toast";

export default function AuthForm() {
    const { login, register } = useAuth();
    const navigate = useNavigate();
    const [isLogin, setIsLogin] = useState(true);

    // Common state
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");

    // Register-specific state
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password2, setPassword2] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [role, setRole] = useState("viewer"); // default role

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!identifier || !password) {
            notifyInfo("Please enter your email/username and password");
            return;
        }

        const success = await login(identifier, password);
        if (success) {
            notifySuccess("Welcome Back!");
            navigate("/dashboard");
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        if (!username || !email || !password || !password2 || !firstName || !lastName || !role) {
            notifyInfo("All fields are required");
            return;
        }

        if (password !== password2) {
            notifyInfo("Passwords do not match");
            return;
        }

        const success = await register({
            username,
            email,
            password,
            password2,
            firstName,
            lastName,
            role,
        });

        if (success) {
            notifySuccess("Registration successful!");
            navigate("/dashboard");
        }
    };

    return (
        <div className='flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4'>
            <div className='bg-white p-8 rounded shadow-md w-full max-w-sm transition-all duration-500 ease-in-out'>
                <h2 className='text-2xl font-bold mb-4 text-center'>{isLogin ? "Login" : "Register"}</h2>

                {isLogin ? (
                    <form onSubmit={handleLogin} className='space-y-4'>
                        <input
                            type='text'
                            placeholder='Email or Username'
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            className='w-full p-2 border rounded'
                        />
                        <input
                            type='password'
                            placeholder='Password'
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className='w-full p-2 border rounded'
                        />
                        <Button type='submit' className='w-full'>
                            Login
                        </Button>
                    </form>
                ) : (
                    <form onSubmit={handleRegister} className='space-y-4'>
                        <input
                            type='text'
                            placeholder='Username'
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className='w-full p-2 border rounded'
                        />
                        <input
                            type='email'
                            placeholder='Email'
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className='w-full p-2 border rounded'
                        />
                        <input
                            type='text'
                            placeholder='First Name'
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            className='w-full p-2 border rounded'
                        />
                        <input
                            type='text'
                            placeholder='Last Name'
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            className='w-full p-2 border rounded'
                        />
                        <input
                            type='password'
                            placeholder='Password'
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className='w-full p-2 border rounded'
                        />
                        <input
                            type='password'
                            placeholder='Confirm Password'
                            value={password2}
                            onChange={(e) => setPassword2(e.target.value)}
                            className='w-full p-2 border rounded'
                        />

                        <select value={role} onChange={(e) => setRole(e.target.value)} className='w-full p-2 border rounded bg-white'>
                            <option value='Admin'>Admin</option>
                            <option value='Editor'>Editor</option>
                            <option value='Viewer'>Viewer</option>
                        </select>

                        <Button type='submit' className='w-full'>
                            Register
                        </Button>
                    </form>
                )}

                <p className='mt-4 text-center text-sm text-gray-600'>
                    {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
                    <button onClick={() => setIsLogin(!isLogin)} className='text-blue-500 hover:underline font-medium'>
                        {isLogin ? "Register" : "Login"}
                    </button>
                </p>
            </div>
        </div>
    );
}
