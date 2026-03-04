import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { AuthUser } from '../types';
import apiClient from '../services/api';

interface AuthContextType {
    session: Session | null;
    user: AuthUser | null;
    loading: boolean;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    session: null,
    user: null,
    loading: true,
    signOut: async () => { },
    refreshProfile: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchUserProfile = async (currentSession: Session | null) => {
        if (!currentSession) {
            setUser(null);
            setLoading(false);
            return;
        }

        try {
            // The API interceptor will automatically attach the current session token
            const response = await apiClient.get<AuthUser>('/auth/me');
            setUser(response.data);
        } catch (error) {
            console.error('Failed to fetch user profile:', error);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // 1. Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            fetchUserProfile(session);
        });

        // 2. Listen for auth changes (login, logout, token refresh)
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, newSession) => {
            setSession(newSession);
            fetchUserProfile(newSession);
        });

        return () => subscription.unsubscribe();
    }, []);

    const signOut = async () => {
        await supabase.auth.signOut();
        setSession(null);
        setUser(null);
    };

    const refreshProfile = async () => {
        await fetchUserProfile(session);
    };

    return (
        <AuthContext.Provider value={{ session, user, loading, signOut, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    );
};
