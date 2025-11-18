// store-management-frontend/src/context/AuthContext.jsx

import React, { createContext, useState, useContext } from 'react';
import { login, register } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(
        localStorage.getItem('access_token') ? true : null
    );

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleLogin = async (username, password) => {
        setLoading(true);
        setError(null);

        try {
            const response = await login({ username, password });

            localStorage.setItem('access_token', response.data.access);
            localStorage.setItem('refresh_token', response.data.refresh);

            setUser(true);
            return true;

        } catch (err) {
            const errorMessage =
                err.response?.data?.detail || "Invalid Credentials or server error.";
            setError(errorMessage);
            return false;
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (username, email, password) => {
        setLoading(true);
        setError(null);

        try {
            await register({ username, email, password });
            return await handleLogin(username, password);

        } catch (err) {
            const errorDetail =
                err.response?.data?.username ||
                err.response?.data?.email ||
                ["Registration Failed."];

            setError(
                Array.isArray(errorDetail)
                    ? errorDetail.join(" ")
                    : errorDetail[0]
            );

            return false;

        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setUser(null);
    };

    const contextData = {
        user,
        loading,
        error,
        login: handleLogin,
        register: handleRegister,
        logout: handleLogout,
    };

    return (
        <AuthContext.Provider value={contextData}>
            {children}
        </AuthContext.Provider>
    );
};

// --- Custom Hook ---
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error("useAuth must be used inside an AuthProvider");
    }

    return context;
};
