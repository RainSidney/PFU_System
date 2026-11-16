import { NavLink, Outlet, useNavigate } from "react-router";

const linkClass = ({ isActive }) =>
    `block rounded px-3 py-2 ${isActive ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`;

export default function Layout() {
    const navigate = useNavigate();
    const user= JSON.parse(localStorage.getItem('user') || '{}');

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        navigate('/login')
    }

    return(
        <div className="flex min-h-screen">
            <aside className="flex w-60 flex-col bg-gray-800 p-4">
                <h2 className="mb-6 text-xl font-bold text-white">PFU Inventory</h2>

                <nav className="flex-1 space-y-1">
                    <NavLink to="/dashboard" className={linkClass}>Dashboard</NavLink>
                    <NavLink to="/products" className={linkClass}>Products</NavLink>
                    <NavLink to="/orders" className={linkClass}>Orders</NavLink>
                    {user.role === 'admin' && (
                        <NavLink to="/staffs" className={linkClass}>Staffs</NavLink>
                    )}
                    <NavLink to="/settings" className={linkClass}>Settings</NavLink>
                </nav>
                    <div className="border-t border-gray-700 pt-4 text-sm text-gray-300">
                        <p>{user.first_name} {user.last_name}</p>
                        <p className="mb-3 text-xs capitalize text-gray-400">{user.role}</p>
                        <button onClick={handleLogout} className="w-full rounded bg-gray-700 p-2 hover:bg-gray-600">Logout
                        </button>
                    </div>
            </aside>
            <main className="flex-1 bg-gray-100">
                <Outlet />
            </main>
        </div>
    );
}