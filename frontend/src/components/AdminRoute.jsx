import { Navigate, Outlet } from 'react-router';

export default function AdminRoute() {
    let user = null;
    try {
        user = JSON.parse(localStorage.getItem('user') || 'null');
    } catch {
        user = null;
    }

    const role = (user?.acc_role || user?.role || '').toLowerCase();

    if (role !== 'admin') {
        return <Navigate to="/dashboard" replace />;
    }

    return <Outlet />;
}