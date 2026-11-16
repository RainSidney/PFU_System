import { Navigate, Outlet } from 'react-router';

export default function AdminRoute() {
    const user = localStorage.getItem('user') || '{}';

    if (user.role !== 'admin'){
        return <Navigate to="/dashboard" replace/>
    }

    return <Outlet/>;
}