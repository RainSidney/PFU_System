import { Routes, Route, Navigate } from 'react-router';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import AdminRoute from './components/AdminRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Orders from './pages/Orders';
import Staffs from './pages/Staffs';
import Settings from './pages/Settings';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />}/>
      
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout/>}>
          <Route path="/dashboard" element={<Dashboard />}/>
          <Route path="/products" element={<Products />}/>
          <Route path="/orders" element={<Orders />}/>
          <Route element={<AdminRoute />}>
            <Route path="/staffs" element={<Staffs />} />
          </Route>
          <Route path="/settings" element={<Settings />}/>
        </Route>
      </Route>
      
      <Route path="/" element={<Navigate to='/dashbaord' replace />} />
      <Route path="*" element={<Navigate to='/dashbaord' replace />} />
    </Routes>
  );
}