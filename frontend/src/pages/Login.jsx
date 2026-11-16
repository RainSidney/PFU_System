import { useState } from 'react';
import { useNavigate } from 'react-router';
import api from '../api/axios';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try{
            const res = await api.post('/auth/login', {email, password});

            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));

            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Cannot reach the server');
        } finally {
            setLoading(false);
        }
    }

    return(
        <div className="flex min-h-scree items-center justify-center bg-gray-100">
            <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-lg bg-white p-8 shadow">
                <h1 className="mb-6 text-2xl font-bold">PFU Inventory</h1>
                {error && <p className="mb-4 rounded bg-red-100 p-2 text-sm text-red-700">{error}</p>}

                <input 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    className="mb-4 w-full rounded border p-2"
                />

                <input 
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="password"
                    className="mb-4 w-full rounded border p-2"
                />

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded bg-blue-600 p-2 text-white disabled:opcacity-50"
                >
                    {loading ? 'Logging in...' : 'Log in'}
                </button>
            </form>
        </div>
    );
}