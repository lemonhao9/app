import { createContext } from 'react';
import type { User } from './AuthContext';

export interface AuthContextValue {
    user: User | null;
    loading: boolean;
    login: (token: string, user: User) => void;
    logout: () => void;
    updateUser: (user: User) => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
