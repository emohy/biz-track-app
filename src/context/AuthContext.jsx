import { createContext, useContext, useEffect, useState } from 'react';
import authService from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const unsubscribe = authService.listenToAuth(async (authUser, profile) => {
            setUser(authUser);
            setUserProfile(profile);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const login = async (email, password) => {
        setError(null);
        try {
            return await authService.login(email, password);
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    const signup = async (email, password) => {
        setError(null);
        try {
            return await authService.signup(email, password);
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    const loginWithGoogle = async () => {
        setError(null);
        try {
            return await authService.loginWithGoogle();
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    const logout = async () => {
        try {
            await authService.logout();
        } catch (err) {
            console.error("Logout Error:", err);
        }
    };

    const value = {
        user,
        userProfile,
        loading,
        error,
        login,
        signup,
        loginWithGoogle,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
