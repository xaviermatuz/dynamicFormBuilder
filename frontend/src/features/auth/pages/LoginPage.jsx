import React, { useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { notifySuccess } from "../../../utils/toast";
import LoginForm from "../components/LoginForm";
import RegisterForm from "../components/RegisterForm";
import { LogIn, UserPlus } from "lucide-react";

export default function AuthForm() {
    const { login, register } = useAuth();
    const navigate = useNavigate();
    const [isLogin, setIsLogin] = useState(true);

    const handleLogin = async ({ identifier, password }) => {
        const success = await login(identifier, password);
        if (success) {
            notifySuccess("Welcome Back!");
            navigate("/dashboard");
        }
    };

    const handleRegister = async (formData) => {
        const success = await register(formData);
        if (success) {
            notifySuccess("Registration successful!");
            navigate("/dashboard");
        }
    };

    return (
        <div
            className='relative flex items-center justify-center min-h-screen w-screen bg-cover bg-center'
            style={{ backgroundImage: "url('/img/abstract.jpg')" }}
        >
            {/* 🔹 Overlay */}
            <div className='absolute inset-0 bg-black/50'></div>

            {/* 🔹 Form container */}
            <div className='relative z-10 bg-white p-8 rounded-lg shadow-lg w-full max-w-sm transition-all duration-500 ease-in-out'>
                <h2 className='text-2xl font-bold mb-4 text-center flex items-center justify-center gap-2'>
                    {isLogin ? <LogIn className='w-6 h-6' /> : <UserPlus className='w-6 h-6' />}
                    {isLogin ? "Login" : "Register"}
                </h2>

                {isLogin ? <LoginForm onSubmit={handleLogin} /> : <RegisterForm onSubmit={handleRegister} />}

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
