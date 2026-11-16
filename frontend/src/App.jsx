import { Routes, Route, Navigate } from 'react-router';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Orders from './pages/Orders';
import Settings from './pages/Settings';
import { NavLink } from 'react-router';

export default function App() {
  return (
    <>
      <nav className="flex gap-4 bg-gray-800 p-4 text-white">
        <NavLink to="/dashboard">Dashboard</NavLink>
        <NavLink to="/products">Products</NavLink>
        <NavLink to="/orders">Orders</NavLink>
        <NavLink to="/settings">Settings</NavLink>
      </nav>

      <Routes>
        <Route path="/login" element={<Login />}/>
        <Route path="/dashboard" element={<Dashboard />}/>
        <Route path="/products" element={<Products />}/>
        <Route path="/orders" element={<Orders />}/>
        <Route path="/settings" element={<Settings />}/>
        <Route path="/" element={<Navigate to='/dashbaord' replace />} />
      </Routes>
    </>
  );
}