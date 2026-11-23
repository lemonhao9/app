import { useEffect, useState, type ReactNode } from 'react';
import { AuthContext } from './auth-context';
import { SESSION_EXPIRED_EVENT } from '../services/http';
export interface User {
    user_id: number;
    email: string;
    name: string;
    role: 'admin' | 'technician' | 'client';
    phone?: string | null;
    picture?: string | null;
    is_active: boolean;
    must_change_password?: boolean;
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [sessionExpired, setSessionExpired] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('hch_token');
        if (!token) {
            setLoading(false);
            return;
        }
        fetch('/api/v1/auth/me', {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(async (res) => {
                if (!res.ok) {
                    throw new Error();
                }
                const data = await res.json();
                setUser(data.user);
            })
            .catch(() => {
                localStorage.removeItem('hch_token');
                setUser(null);
            })
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        function onSessionExpired() {
            localStorage.removeItem('hch_token');
            setUser(null);
            setSessionExpired(true);
        }
        window.addEventListener(SESSION_EXPIRED_EVENT, onSessionExpired);
        return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onSessionExpired);
    }, []);

    function login(token: string, user: User) {
        localStorage.setItem('hch_token', token);
        setUser(user);
        setSessionExpired(false);
    }

    function logout() {
        const token = localStorage.getItem('hch_token');
        localStorage.removeItem('hch_token');
        setUser(null);
        if (token) {
            fetch('/api/v1/auth/logout', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            }).catch(() => { });
        }
    }

    function updateUser(updated: User) {
        setUser(updated);
    }

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, updateUser, sessionExpired }}>
            {children}
        </AuthContext.Provider>
    );
}
