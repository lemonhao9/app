import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

interface Props {
    roles?: Array<'admin' | 'technician' | 'client'>;
}

export function ProtectedRoute({ roles }: Props) {
    const { user, loading } = useAuth();

    if(loading) return null;

    if(!user) {
        return <Navigate to="/login" replace />;
    }

    if(roles && !roles.includes(user.role)) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
}