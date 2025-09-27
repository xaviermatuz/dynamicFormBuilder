import React, { Suspense } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import Routes from "./routes";
import { AuthProvider } from "../context/AuthContext";
import ToastProvider from "../common/components/ToastProvider";
import Spinner from "../common/components/Spinner";

export default function App() {
    return (
        <AuthProvider>
            <ToastProvider>
                <Router>
                    <Suspense
                        fallback={
                            <div className='flex justify-center items-center h-screen'>
                                <Spinner size='16' color='green-800' fullPage />
                            </div>
                        }
                    >
                        <Routes />
                    </Suspense>
                </Router>
            </ToastProvider>
        </AuthProvider>
    );
}
