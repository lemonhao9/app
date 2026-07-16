import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

interface User {
  user_id: number;
  email: string;
  name: string;
  role: 'admin' | 'technician' | 'client';
  phone?: string | null;
  picture?: string | null;
  is_active: boolean;
}

interface AuthContextValue {
    user: User | null;
    loading: boolean;
    login: (token: string, user: User) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('hch_token');
        if (!token) {
            setLoading(false);
            return;
        }
        fetch('/api/v1/auth/me', {
            headers: {Authorization: `Bearer ${token}`},
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

    function login(token: string, user: User) {
        localStorage.setItem('hch_token', token);
        setUser(user);
    }

    function logout() {
        const token = localStorage.getItem('hch_token');
        localStorage.removeItem('hch_token');
        setUser(null);
        if(token) {
            fetch('/api/v1/auth/logout', {
                method: 'POST',
                headers: {Authorization: `Bearer ${token}`},
            }).catch(() => {});
        }
    }
    
    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return ctx;
} 